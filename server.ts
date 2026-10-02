import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Check if SerpApi key is configured on server
  app.get('/api/status', (_req: Request, res: Response) => {
    const hasKey = Boolean(
      process.env.SERPAPI_KEY &&
      process.env.SERPAPI_KEY !== 'your_key_here' &&
      process.env.SERPAPI_KEY.trim() !== ''
    );
    res.json({
      configured: hasKey,
      timestamp: new Date().toISOString(),
    });
  });

  // SerpApi Google Shopping search endpoint
  app.get('/api/search', async (req: Request, res: Response) => {
    const query = (req.query.q as string || '').trim();

    if (!query) {
      return res.status(400).json({
        error: 'Missing query parameter "q". Please provide a search term.',
        code: 'MISSING_QUERY',
        results: [],
      });
    }

    // Check for API key in server env or client request header/query
    const apiKey =
      (req.headers['x-serpapi-key'] as string) ||
      (req.query.api_key as string) ||
      process.env.SERPAPI_KEY;

    if (!apiKey || apiKey === 'your_key_here' || apiKey.trim() === '') {
      return res.status(401).json({
        error: 'SerpApi key is not configured. Please set the SERPAPI_KEY environment variable on your server.',
        code: 'MISSING_API_KEY',
        results: [],
      });
    }

    try {
      const serpUrl = new URL('https://serpapi.com/search.json');
      serpUrl.searchParams.set('engine', 'google_shopping');
      serpUrl.searchParams.set('q', query);
      serpUrl.searchParams.set('api_key', apiKey.trim());
      serpUrl.searchParams.set('hl', 'en');
      serpUrl.searchParams.set('gl', 'us');

      const response = await fetch(serpUrl.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PriceScope-App/1.0',
        },
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const errorMsg = data.error || `SerpApi responded with HTTP status ${response.status}`;
        console.error('SerpApi error response:', errorMsg);
        return res.status(response.status >= 400 && response.status < 500 ? response.status : 502).json({
          error: errorMsg,
          code: 'SERPAPI_ERROR',
          results: [],
        });
      }

      const shoppingResults = Array.isArray(data.shopping_results) ? data.shopping_results : [];

      // Parse shopping results
      const results = shoppingResults.map((item: any, index: number) => {
        // Extract numeric price
        let numericPrice: number | null = null;
        if (typeof item.extracted_price === 'number') {
          numericPrice = item.extracted_price;
        } else if (item.price) {
          const cleaned = String(item.price).replace(/,/g, '');
          const match = cleaned.match(/[\d]+(?:\.[\d]{2})?/);
          if (match) {
            const parsed = parseFloat(match[0]);
            if (!isNaN(parsed)) {
              numericPrice = parsed;
            }
          }
        }

        // Clean display price
        let displayPrice = item.price;
        if (!displayPrice && numericPrice !== null) {
          displayPrice = `$${numericPrice.toFixed(2)}`;
        } else if (!displayPrice) {
          displayPrice = 'Check retailer';
        }

        const retailer = item.source || item.merchant || item.seller || 'Direct Retailer';
        const link = item.link || item.product_link || '#';
        const thumbnail = item.thumbnail || '';
        const title = item.title || 'Product listing';
        const rating = typeof item.rating === 'number' ? item.rating : null;
        const reviews = typeof item.reviews === 'number' ? item.reviews : null;
        const delivery = item.delivery || (Array.isArray(item.extensions) ? item.extensions[0] : null) || null;

        // Check if price is a monthly installment (e.g. $17.50/mo with 36 monthly payments)
        const isInstallment = /\/(?:mo|month)\b|per\s*month/i.test(String(item.price || ''));
        if (isInstallment && numericPrice !== null) {
          const monthsMatch = `${title} ${delivery || ''}`.match(/(\d+)\s*(?:monthly|\/mo|month)/i);
          if (monthsMatch) {
            const months = parseInt(monthsMatch[1], 10);
            if (months > 1 && months <= 48) {
              const totalEst = Math.round(numericPrice * months * 100) / 100;
              numericPrice = totalEst;
              displayPrice = `${item.price} (~$${totalEst.toFixed(0)} total)`;
            }
          } else {
            // Unspecified installment duration, estimate 24 months or place after full price
            numericPrice = numericPrice * 24;
            displayPrice = `${item.price} (Installment plan)`;
          }
        }

        // Detect if product is refurbished, renewed, pre-owned, or used
        const fullText = `${title} ${delivery || ''} ${Array.isArray(item.extensions) ? item.extensions.join(' ') : ''} ${item.tag || ''}`.toLowerCase();
        const isRefurbished = /\b(refurbished|refurb|renewed|pre-?owned|preowned|used|reconditioned|open-?box|refubished|grade\s*[ab]|second-?hand|like\s*new)\b/i.test(fullText);

        return {
          id: item.product_id || item.position || `item-${index}`,
          title,
          thumbnail,
          price: displayPrice,
          priceNumber: numericPrice,
          source: retailer,
          link,
          rating,
          reviews,
          delivery,
          isRefurbished,
          condition: isRefurbished ? 'refurbished' : 'new',
          originalIndex: index,
        };
      });

      // Default sort: Genuine / Brand New items FIRST sorted by price ascending,
      // with Refurbished / Pre-Owned items positioned below genuine prices
      const sortedResults = [...results].sort((a, b) => {
        // Genuine new products always come before refurbished / used products
        if (a.isRefurbished !== b.isRefurbished) {
          return a.isRefurbished ? 1 : -1;
        }
        // Then sort by price ascending
        if (a.priceNumber !== null && b.priceNumber !== null) {
          return a.priceNumber - b.priceNumber;
        }
        if (a.priceNumber !== null) return -1;
        if (b.priceNumber !== null) return 1;
        return 0;
      });

      return res.json({
        query,
        total: results.length,
        results: sortedResults,
      });
    } catch (err: any) {
      console.error('Failed to search SerpApi:', err);
      return res.status(500).json({
        error: err.message || 'Failed to communicate with SerpApi.',
        code: 'NETWORK_ERROR',
        results: [],
      });
    }
  });

  // Setup static serving or Vite middleware
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PriceScope full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});

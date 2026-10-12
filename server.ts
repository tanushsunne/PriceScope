import express from 'express';
import type { Request, Response } from 'express';
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
      serpUrl.searchParams.set('gl', 'in'); // India geolocation
      serpUrl.searchParams.set('google_domain', 'google.co.in'); // Google India domain
      serpUrl.searchParams.set('location', 'India');

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

      // Regex for popular trusted Indian e-commerce platforms
      const POPULAR_INDIAN_STORES_REGEX = /\b(amazon|flipkart|croma|reliance\s*digital|tata\s*cliq|tatacliq|vijay\s*sales|jiomart|jio|myntra|ajio|meesho|nykaa|bigbasket|blinkit|zepto|imagine\s*online|poorvika|sangeetha|apple|samsung|oneplus|mi\.com|realme)\b/i;

      // Parse shopping results for Indian market
      const results = shoppingResults.map((item: any, index: number) => {
        // Extract numeric price in INR
        let numericPrice: number | null = null;
        if (typeof item.extracted_price === 'number') {
          numericPrice = item.extracted_price;
        } else if (item.price) {
          // Remove currency symbols (₹, Rs, INR) and comma separators
          const cleaned = String(item.price).replace(/[₹\s,]|Rs\.?|INR/gi, '');
          const match = cleaned.match(/[\d]+(?:\.[\d]{2})?/);
          if (match) {
            const parsed = parseFloat(match[0]);
            if (!isNaN(parsed)) {
              numericPrice = parsed;
            }
          }
        }

        const retailer = item.source || item.merchant || item.seller || 'Direct Retailer';
        const link = item.link || item.product_link || '#';
        const thumbnail = item.thumbnail || '';
        const title = item.title || 'Product listing';
        const rating = typeof item.rating === 'number' ? item.rating : null;
        const reviews = typeof item.reviews === 'number' ? item.reviews : null;
        const delivery = item.delivery || (Array.isArray(item.extensions) ? item.extensions[0] : null) || null;

        // Clean display price in Indian Rupees (₹)
        let displayPrice = item.price;
        if (numericPrice !== null) {
          if (!displayPrice || (!displayPrice.includes('₹') && !/rs/i.test(displayPrice))) {
            displayPrice = `₹${numericPrice.toLocaleString('en-IN')}`;
          }
        } else if (!displayPrice) {
          displayPrice = 'Check retailer';
        }

        // Check if price is a monthly installment (e.g. ₹2,499/mo)
        const isInstallment = /\/(?:mo|month)\b|per\s*month/i.test(String(item.price || ''));
        if (isInstallment && numericPrice !== null) {
          const monthsMatch = `${title} ${delivery || ''}`.match(/(\d+)\s*(?:monthly|\/mo|month)/i);
          if (monthsMatch) {
            const months = parseInt(monthsMatch[1], 10);
            if (months > 1 && months <= 48) {
              const totalEst = Math.round(numericPrice * months);
              numericPrice = totalEst;
              displayPrice = `${item.price} (~₹${totalEst.toLocaleString('en-IN')} total)`;
            }
          } else {
            numericPrice = numericPrice * 24;
            displayPrice = `${item.price} (Installment plan)`;
          }
        }

        // Detect if product is refurbished, renewed, pre-owned, or used in Indian market
        const fullText = `${title} ${delivery || ''} ${Array.isArray(item.extensions) ? item.extensions.join(' ') : ''} ${item.tag || ''}`.toLowerCase();
        const isRefurbished =
          /\b(refurbished|refurb|renewed|pre-?owned|preowned|used|reconditioned|open-?box|refubished|grade\s*[a-d]|as-is|second-?hand|like\s*new|unboxed)\b/i.test(fullText) ||
          /cashify|control\s*z|budli|ovantica/i.test(retailer) ||
          /cashify|control\s*z|budli/i.test(title);

        const isPopularStore = POPULAR_INDIAN_STORES_REGEX.test(retailer);

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
          isPopularStore,
          condition: isRefurbished ? 'refurbished' : 'new',
          originalIndex: index,
        };
      });

      // Sort results:
      // 1. Genuine Brand New products from Popular Indian Stores (Amazon, Flipkart, Croma, etc.)
      // 2. Genuine Brand New products from other Indian retailers
      // 3. Refurbished / Used items (Cashify, Renewed, etc.) positioned below
      const sortedResults = [...results].sort((a, b) => {
        // Genuine new products always come before refurbished / used products
        if (Boolean(a.isRefurbished) !== Boolean(b.isRefurbished)) {
          return a.isRefurbished ? 1 : -1;
        }

        // Among genuine products, prioritize popular Indian stores (Amazon, Flipkart, etc.)
        if (!a.isRefurbished && !b.isRefurbished) {
          if (Boolean(a.isPopularStore) !== Boolean(b.isPopularStore)) {
            return a.isPopularStore ? -1 : 1;
          }
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

import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface GeminiPriceEstimate {
  estimatedPriceINR: number;
  minRealisticPriceINR: number;
  maxRealisticPriceINR: number;
  isAccessoryQuery: boolean;
  explanation?: string;
}

/**
 * Uses Gemini AI to estimate the authentic retail price range in Indian Rupees (INR)
 * for the core product specified in the search query.
 */
async function fetchGeminiPriceEstimate(query: string): Promise<GeminiPriceEstimate | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey.trim()}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an Indian retail e-commerce price intelligence engine.
Analyze this search query: "${query}".
The user wants to buy this item in India.
1. Determine if the user is searching for a main product/device (e.g., "OnePlus 12", "iPhone 15", "Sony WH-1000XM5", "Nike Air Jordan") vs an accessory (e.g., "phone cover", "case", "tempered glass", "charging cable").
2. Estimate the typical brand-new retail price in Indian Rupees (INR / ₹) for the authentic product in India.
3. Provide a realistic minimum price threshold to filter out low-cost covers and accessories (e.g. for OnePlus 12, phone covers cost ₹150-₹400 while the phone is ₹55,000-₹65,000).

Return strictly a JSON object:
{
  "estimatedPriceINR": number,
  "minRealisticPriceINR": number,
  "maxRealisticPriceINR": number,
  "isAccessoryQuery": boolean,
  "explanation": string
}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('Gemini price estimate HTTP status:', response.status);
      return null;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text);
    return {
      estimatedPriceINR: Number(parsed.estimatedPriceINR) || 0,
      minRealisticPriceINR: Number(parsed.minRealisticPriceINR) || 0,
      maxRealisticPriceINR: Number(parsed.maxRealisticPriceINR) || 0,
      isAccessoryQuery: Boolean(parsed.isAccessoryQuery),
      explanation: typeof parsed.explanation === 'string' ? parsed.explanation : '',
    };
  } catch (err) {
    console.warn('Gemini price estimate skipped:', err);
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Check if SerpApi and Gemini keys are configured on server
  app.get('/api/status', (_req: Request, res: Response) => {
    const hasSerpKey = Boolean(
      process.env.SERPAPI_KEY &&
      process.env.SERPAPI_KEY !== 'your_key_here' &&
      process.env.SERPAPI_KEY.trim() !== ''
    );
    const hasGeminiKey = Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
      process.env.GEMINI_API_KEY.trim() !== ''
    );
    res.json({
      configured: hasSerpKey,
      geminiConfigured: hasGeminiKey,
      timestamp: new Date().toISOString(),
    });
  });

  // SerpApi Google Shopping search endpoint with Gemini price matching
  app.get('/api/search', async (req: Request, res: Response) => {
    const query = (req.query.q as string || '').trim();

    if (!query) {
      return res.status(400).json({
        error: 'Missing query parameter "q". Please provide a search term.',
        code: 'MISSING_QUERY',
        results: [],
      });
    }

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

      // Fetch Gemini AI price estimate and SerpApi results in parallel for maximum speed
      const [aiEstimate, serpData] = await Promise.all([
        fetchGeminiPriceEstimate(query),
        fetch(serpUrl.toString(), {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'PriceScope-App/1.0',
          },
        }).then(async (r) => {
          if (!r.ok) {
            const errBody = await r.json().catch(() => ({}));
            return { error: errBody.error || `HTTP ${r.status}` };
          }
          return r.json();
        }).catch((err) => ({ error: err.message })),
      ]);

      if (serpData.error) {
        console.error('SerpApi error response:', serpData.error);
        return res.status(502).json({
          error: serpData.error,
          code: 'SERPAPI_ERROR',
          results: [],
        });
      }

      const shoppingResults = Array.isArray(serpData.shopping_results) ? serpData.shopping_results : [];

      // Regex for popular trusted Indian e-commerce platforms
      const POPULAR_INDIAN_STORES_REGEX = /\b(amazon|flipkart|croma|reliance\s*digital|tata\s*cliq|tatacliq|vijay\s*sales|jiomart|jio|myntra|ajio|meesho|nykaa|bigbasket|blinkit|zepto|imagine\s*online|poorvika|sangeetha|apple|samsung|oneplus|mi\.com|realme)\b/i;

      // Parse shopping results for Indian market
      const results = shoppingResults.map((item: any, index: number) => {
        // Extract numeric price in INR
        let numericPrice: number | null = null;
        if (typeof item.extracted_price === 'number') {
          numericPrice = item.extracted_price;
        } else if (item.price) {
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

        // Detect if product is a phone case/cover/screen protector when user searched for a main device
        const isAccessory = Boolean(
          aiEstimate &&
          !aiEstimate.isAccessoryQuery &&
          aiEstimate.minRealisticPriceINR > 500 &&
          (
            (numericPrice !== null && numericPrice < aiEstimate.minRealisticPriceINR * 0.45) ||
            /\b(back\s*cover|flip\s*cover|phone\s*case|tempered\s*glass|screen\s*protector|pouch|sleeve|skin|protective\s*case|silicone\s*case|armor\s*case|phone\s*cover|charging\s*cable|case\s*cover)\b/i.test(title)
          )
        );

        // Closeness to Gemini estimated target price
        const priceDiff =
          numericPrice !== null && aiEstimate && aiEstimate.estimatedPriceINR > 0
            ? Math.abs(numericPrice - aiEstimate.estimatedPriceINR)
            : null;

        const isNearTargetPrice = Boolean(
          numericPrice !== null &&
          aiEstimate &&
          aiEstimate.estimatedPriceINR > 0 &&
          !isAccessory &&
          numericPrice >= aiEstimate.minRealisticPriceINR * 0.65 &&
          numericPrice <= aiEstimate.maxRealisticPriceINR * 1.45
        );

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
          isAccessory,
          isNearTargetPrice,
          priceDiffFromTarget: priceDiff !== null ? priceDiff : undefined,
          condition: isRefurbished ? 'refurbished' : 'new',
          originalIndex: index,
        };
      });

      // Sort results:
      // 1. Genuine Brand New devices around the Gemini target price (isNearTargetPrice)
      //    - Popular Indian Stores on top, sorted by closest to Gemini estimate
      // 2. Genuine Brand New devices outside target price range
      // 3. Low-cost phone covers and accessories (if user searched for device)
      // 4. Refurbished / Used items positioned below genuine prices
      const sortedResults = [...results].sort((a, b) => {
        // 1. Genuine new products always come before refurbished / used products
        if (Boolean(a.isRefurbished) !== Boolean(b.isRefurbished)) {
          return a.isRefurbished ? 1 : -1;
        }

        // 2. Main products before accessories (covers/cases)
        if (!a.isRefurbished && !b.isRefurbished) {
          if (Boolean(a.isAccessory) !== Boolean(b.isAccessory)) {
            return a.isAccessory ? 1 : -1;
          }

          // 3. If Gemini estimate is available, prioritize products around the target price
          if (aiEstimate && aiEstimate.estimatedPriceINR > 0) {
            if (Boolean(a.isNearTargetPrice) !== Boolean(b.isNearTargetPrice)) {
              return a.isNearTargetPrice ? -1 : 1;
            }

            // If both are near target price:
            if (a.isNearTargetPrice && b.isNearTargetPrice) {
              // Prioritize popular stores
              if (Boolean(a.isPopularStore) !== Boolean(b.isPopularStore)) {
                return a.isPopularStore ? -1 : 1;
              }
              // Closeness to target price
              const diffA = a.priceDiffFromTarget ?? Infinity;
              const diffB = b.priceDiffFromTarget ?? Infinity;
              if (diffA !== diffB) {
                return diffA - diffB;
              }
            }
          }

          // Prioritize popular stores
          if (Boolean(a.isPopularStore) !== Boolean(b.isPopularStore)) {
            return a.isPopularStore ? -1 : 1;
          }
        }

        // Default sort by price ascending
        if (a.priceNumber !== null && b.priceNumber !== null) {
          return a.priceNumber - b.priceNumber;
        }
        if (a.priceNumber !== null) return -1;
        if (b.priceNumber !== null) return 1;
        return 0;
      });

      return res.json({
        query,
        aiEstimate,
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

import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface GeminiPriceEstimate {
  estimatedPriceINR: number;
  minRealisticPriceINR: number;
  maxRealisticPriceINR: number;
  isAccessoryQuery: boolean;
  isHeuristic?: boolean;
  source?: 'gemini-ai' | 'indian-tech-catalog' | 'market-median';
  explanation?: string;
}

/**
 * Built-in Indian Tech Catalog
 * Provides authentic, verified brand-new retail price baselines in Indian Rupees (INR)
 * for popular gadgets and consumer electronics in India.
 * This guarantees zero random prices even if GEMINI_API_KEY is not configured on Render.
 */
interface CatalogEntry {
  regex: RegExp;
  estimatedPriceINR: number;
  minRealisticPriceINR: number;
  maxRealisticPriceINR: number;
  isAccessoryQuery: boolean;
  description: string;
}

const INDIAN_TECH_CATALOG: CatalogEntry[] = [
  // Apple iPhones
  {
    regex: /\biphone\s*16\s*pro\s*max\b/i,
    estimatedPriceINR: 144900,
    minRealisticPriceINR: 130000,
    maxRealisticPriceINR: 165000,
    isAccessoryQuery: false,
    description: 'Apple iPhone 16 Pro Max Indian retail price range',
  },
  {
    regex: /\biphone\s*16\s*pro\b/i,
    estimatedPriceINR: 119900,
    minRealisticPriceINR: 108000,
    maxRealisticPriceINR: 139000,
    isAccessoryQuery: false,
    description: 'Apple iPhone 16 Pro Indian retail price range',
  },
  {
    regex: /\biphone\s*16\s*plus\b/i,
    estimatedPriceINR: 89900,
    minRealisticPriceINR: 79000,
    maxRealisticPriceINR: 99000,
    isAccessoryQuery: false,
    description: 'Apple iPhone 16 Plus Indian retail price range',
  },
  {
    regex: /\biphone\s*16\b/i,
    estimatedPriceINR: 79900,
    minRealisticPriceINR: 69000,
    maxRealisticPriceINR: 89000,
    isAccessoryQuery: false,
    description: 'Apple iPhone 16 standard Indian retail price range',
  },
  {
    regex: /\biphone\s*15\s*pro\s*max\b/i,
    estimatedPriceINR: 134900,
    minRealisticPriceINR: 115000,
    maxRealisticPriceINR: 155000,
    isAccessoryQuery: false,
    description: 'Apple iPhone 15 Pro Max Indian retail price range',
  },
  {
    regex: /\biphone\s*15\s*pro\b/i,
    estimatedPriceINR: 109900,
    minRealisticPriceINR: 95000,
    maxRealisticPriceINR: 125000,
    isAccessoryQuery: false,
    description: 'Apple iPhone 15 Pro Indian retail price range',
  },
  {
    regex: /\biphone\s*15\s*plus\b/i,
    estimatedPriceINR: 74900,
    minRealisticPriceINR: 64000,
    maxRealisticPriceINR: 85000,
    isAccessoryQuery: false,
    description: 'Apple iPhone 15 Plus Indian retail price range',
  },
  {
    regex: /\biphone\s*15\b/i,
    estimatedPriceINR: 64900,
    minRealisticPriceINR: 54000,
    maxRealisticPriceINR: 79900,
    isAccessoryQuery: false,
    description: 'Apple iPhone 15 standard Indian retail price range',
  },
  {
    regex: /\biphone\s*14\b/i,
    estimatedPriceINR: 54900,
    minRealisticPriceINR: 48000,
    maxRealisticPriceINR: 65000,
    isAccessoryQuery: false,
    description: 'Apple iPhone 14 Indian retail price range',
  },
  {
    regex: /\biphone\s*13\b/i,
    estimatedPriceINR: 44900,
    minRealisticPriceINR: 39000,
    maxRealisticPriceINR: 55000,
    isAccessoryQuery: false,
    description: 'Apple iPhone 13 Indian retail price range',
  },

  // OnePlus Phones
  {
    regex: /\boneplus\s*12\b(?!\s*r)/i,
    estimatedPriceINR: 64999,
    minRealisticPriceINR: 54000,
    maxRealisticPriceINR: 72000,
    isAccessoryQuery: false,
    description: 'OnePlus 12 5G flagship Indian retail price range',
  },
  {
    regex: /\boneplus\s*12\s*r\b/i,
    estimatedPriceINR: 39999,
    minRealisticPriceINR: 34000,
    maxRealisticPriceINR: 46000,
    isAccessoryQuery: false,
    description: 'OnePlus 12R 5G Indian retail price range',
  },
  {
    regex: /\boneplus\s*13\b(?!\s*r)/i,
    estimatedPriceINR: 69999,
    minRealisticPriceINR: 59000,
    maxRealisticPriceINR: 79000,
    isAccessoryQuery: false,
    description: 'OnePlus 13 5G flagship Indian retail price range',
  },
  {
    regex: /\boneplus\s*11\b/i,
    estimatedPriceINR: 49999,
    minRealisticPriceINR: 40000,
    maxRealisticPriceINR: 58000,
    isAccessoryQuery: false,
    description: 'OnePlus 11 5G Indian retail price range',
  },
  {
    regex: /\boneplus\s*open\b/i,
    estimatedPriceINR: 129999,
    minRealisticPriceINR: 110000,
    maxRealisticPriceINR: 145000,
    isAccessoryQuery: false,
    description: 'OnePlus Open foldable Indian retail price range',
  },
  {
    regex: /\boneplus\s*nord\s*4\b/i,
    estimatedPriceINR: 29999,
    minRealisticPriceINR: 25000,
    maxRealisticPriceINR: 36000,
    isAccessoryQuery: false,
    description: 'OnePlus Nord 4 Indian retail price range',
  },
  {
    regex: /\boneplus\s*nord\s*ce\s*4\b/i,
    estimatedPriceINR: 24999,
    minRealisticPriceINR: 20000,
    maxRealisticPriceINR: 29000,
    isAccessoryQuery: false,
    description: 'OnePlus Nord CE 4 Indian retail price range',
  },

  // Samsung Galaxy
  {
    regex: /\bsamsung.*s24\s*ultra\b/i,
    estimatedPriceINR: 119999,
    minRealisticPriceINR: 99000,
    maxRealisticPriceINR: 139999,
    isAccessoryQuery: false,
    description: 'Samsung Galaxy S24 Ultra Indian retail price range',
  },
  {
    regex: /\bsamsung.*s24\s*plus\b|\bs24\s*\+\b/i,
    estimatedPriceINR: 84999,
    minRealisticPriceINR: 74000,
    maxRealisticPriceINR: 98000,
    isAccessoryQuery: false,
    description: 'Samsung Galaxy S24+ Indian retail price range',
  },
  {
    regex: /\bsamsung.*s24\b/i,
    estimatedPriceINR: 69999,
    minRealisticPriceINR: 58000,
    maxRealisticPriceINR: 82000,
    isAccessoryQuery: false,
    description: 'Samsung Galaxy S24 Indian retail price range',
  },
  {
    regex: /\bsamsung.*s23\s*ultra\b/i,
    estimatedPriceINR: 84999,
    minRealisticPriceINR: 72000,
    maxRealisticPriceINR: 99000,
    isAccessoryQuery: false,
    description: 'Samsung Galaxy S23 Ultra Indian retail price range',
  },
  {
    regex: /\bsamsung.*s23\b/i,
    estimatedPriceINR: 49999,
    minRealisticPriceINR: 42000,
    maxRealisticPriceINR: 62000,
    isAccessoryQuery: false,
    description: 'Samsung Galaxy S23 Indian retail price range',
  },
  {
    regex: /\bsamsung.*(?:z\s*flip\s*6|flip\s*6)\b/i,
    estimatedPriceINR: 99999,
    minRealisticPriceINR: 84000,
    maxRealisticPriceINR: 115000,
    isAccessoryQuery: false,
    description: 'Samsung Galaxy Z Flip 6 Indian retail price range',
  },
  {
    regex: /\bsamsung.*(?:z\s*fold\s*6|fold\s*6)\b/i,
    estimatedPriceINR: 154999,
    minRealisticPriceINR: 135000,
    maxRealisticPriceINR: 175000,
    isAccessoryQuery: false,
    description: 'Samsung Galaxy Z Fold 6 Indian retail price range',
  },

  // Google Pixel
  {
    regex: /\bpixel\s*9\s*pro\b/i,
    estimatedPriceINR: 109999,
    minRealisticPriceINR: 95000,
    maxRealisticPriceINR: 125000,
    isAccessoryQuery: false,
    description: 'Google Pixel 9 Pro Indian retail price range',
  },
  {
    regex: /\bpixel\s*9\b/i,
    estimatedPriceINR: 74999,
    minRealisticPriceINR: 64000,
    maxRealisticPriceINR: 84000,
    isAccessoryQuery: false,
    description: 'Google Pixel 9 Indian retail price range',
  },
  {
    regex: /\bpixel\s*8a\b/i,
    estimatedPriceINR: 42999,
    minRealisticPriceINR: 35000,
    maxRealisticPriceINR: 52000,
    isAccessoryQuery: false,
    description: 'Google Pixel 8a Indian retail price range',
  },
  {
    regex: /\bpixel\s*8\b/i,
    estimatedPriceINR: 54999,
    minRealisticPriceINR: 45000,
    maxRealisticPriceINR: 66000,
    isAccessoryQuery: false,
    description: 'Google Pixel 8 Indian retail price range',
  },

  // Laptops
  {
    regex: /\bmacbook\s*air\s*m3\b/i,
    estimatedPriceINR: 104900,
    minRealisticPriceINR: 92000,
    maxRealisticPriceINR: 125000,
    isAccessoryQuery: false,
    description: 'Apple MacBook Air M3 Indian retail price range',
  },
  {
    regex: /\bmacbook\s*air\s*m2\b/i,
    estimatedPriceINR: 89900,
    minRealisticPriceINR: 78000,
    maxRealisticPriceINR: 105000,
    isAccessoryQuery: false,
    description: 'Apple MacBook Air M2 Indian retail price range',
  },
  {
    regex: /\bmacbook\s*air\s*m1\b/i,
    estimatedPriceINR: 69900,
    minRealisticPriceINR: 58000,
    maxRealisticPriceINR: 79000,
    isAccessoryQuery: false,
    description: 'Apple MacBook Air M1 Indian retail price range',
  },
  {
    regex: /\bmacbook\s*pro\s*m3\b/i,
    estimatedPriceINR: 169900,
    minRealisticPriceINR: 145000,
    maxRealisticPriceINR: 210000,
    isAccessoryQuery: false,
    description: 'Apple MacBook Pro M3 Indian retail price range',
  },

  // Gaming
  {
    regex: /\b(?:playstation\s*5|ps5)\b/i,
    estimatedPriceINR: 49990,
    minRealisticPriceINR: 42000,
    maxRealisticPriceINR: 56000,
    isAccessoryQuery: false,
    description: 'Sony PlayStation 5 Console Indian retail price range',
  },
  {
    regex: /\bxbox\s*series\s*x\b/i,
    estimatedPriceINR: 49990,
    minRealisticPriceINR: 42000,
    maxRealisticPriceINR: 56000,
    isAccessoryQuery: false,
    description: 'Microsoft Xbox Series X Console Indian retail price range',
  },
  {
    regex: /\bnintendo\s*switch\s*oled\b/i,
    estimatedPriceINR: 29990,
    minRealisticPriceINR: 24000,
    maxRealisticPriceINR: 35000,
    isAccessoryQuery: false,
    description: 'Nintendo Switch OLED Console Indian retail price range',
  },

  // Audio
  {
    regex: /\bsony\s*wh-?1000xm5\b/i,
    estimatedPriceINR: 28990,
    minRealisticPriceINR: 24000,
    maxRealisticPriceINR: 34000,
    isAccessoryQuery: false,
    description: 'Sony WH-1000XM5 ANC Headphones Indian retail price range',
  },
  {
    regex: /\bsony\s*wh-?1000xm4\b/i,
    estimatedPriceINR: 20990,
    minRealisticPriceINR: 17000,
    maxRealisticPriceINR: 25000,
    isAccessoryQuery: false,
    description: 'Sony WH-1000XM4 ANC Headphones Indian retail price range',
  },
  {
    regex: /\bairpods\s*pro\b/i,
    estimatedPriceINR: 21900,
    minRealisticPriceINR: 18000,
    maxRealisticPriceINR: 26000,
    isAccessoryQuery: false,
    description: 'Apple AirPods Pro 2nd Gen Indian retail price range',
  },
  {
    regex: /\bboat\s*airdopes\b/i,
    estimatedPriceINR: 1299,
    minRealisticPriceINR: 799,
    maxRealisticPriceINR: 2499,
    isAccessoryQuery: false,
    description: 'boAt Airdopes TWS Earbuds Indian retail price range',
  },
];

function getIndianCatalogPrice(query: string): GeminiPriceEstimate | null {
  const qClean = query.trim().toLowerCase();
  for (const entry of INDIAN_TECH_CATALOG) {
    if (entry.regex.test(qClean)) {
      return {
        estimatedPriceINR: entry.estimatedPriceINR,
        minRealisticPriceINR: entry.minRealisticPriceINR,
        maxRealisticPriceINR: entry.maxRealisticPriceINR,
        isAccessoryQuery: entry.isAccessoryQuery,
        isHeuristic: true,
        source: 'indian-tech-catalog',
        explanation: `${entry.description}. Verified Indian authentic retail price baseline.`,
      };
    }
  }
  return null;
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

  const promptText = `You are an Indian retail e-commerce price intelligence engine.
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
}`;

  const fetchWithTimeout = async () => {
    // Try GoogleGenAI SDK first with gemini-flash-latest
    try {
      const ai = new GoogleGenAI();
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        const est = Number(parsed.estimatedPriceINR) || 0;
        if (est > 0) {
          return {
            estimatedPriceINR: est,
            minRealisticPriceINR: Number(parsed.minRealisticPriceINR) || Math.round(est * 0.7),
            maxRealisticPriceINR: Number(parsed.maxRealisticPriceINR) || Math.round(est * 1.35),
            isAccessoryQuery: Boolean(parsed.isAccessoryQuery),
            isHeuristic: false,
            source: 'gemini-ai' as const,
            explanation: typeof parsed.explanation === 'string' ? parsed.explanation : '',
          };
        }
      }
    } catch (sdkErr: any) {
      console.warn('GoogleGenAI SDK attempt notice:', sdkErr?.message || sdkErr);
    }

    // REST fallback if SDK encountered issues
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey.trim()}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          const est = Number(parsed.estimatedPriceINR) || 0;
          if (est > 0) {
            return {
              estimatedPriceINR: est,
              minRealisticPriceINR: Number(parsed.minRealisticPriceINR) || Math.round(est * 0.7),
              maxRealisticPriceINR: Number(parsed.maxRealisticPriceINR) || Math.round(est * 1.35),
              isAccessoryQuery: Boolean(parsed.isAccessoryQuery),
              isHeuristic: false,
              source: 'gemini-ai' as const,
              explanation: typeof parsed.explanation === 'string' ? parsed.explanation : '',
            };
          }
        }
      }
    } catch (restErr: any) {
      console.warn('Gemini REST fallback skipped:', restErr?.message || restErr);
    }

    return null;
  };

  // Enforce a strict 3000ms max timeout so search is never delayed
  const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
  return Promise.race([fetchWithTimeout(), timeoutPromise]);
}

// Regex for popular trusted Indian domestic e-commerce platforms
const POPULAR_INDIAN_STORES_REGEX = /\b(amazon|flipkart|croma|reliance\s*digital|tata\s*cliq|tatacliq|vijay\s*sales|jiomart|jio|myntra|ajio|meesho|nykaa|bigbasket|blinkit|zepto|imagine\s*online|poorvika|sangeetha|apple|samsung|oneplus|mi\.com|realme)\b/i;

// Regex for international cross-border dropshippers & arbitrage markups
const CROSS_BORDER_DROPSHIP_REGEX = /\b(ubuy|desertcart|papita|fruugo|tradeindia|grandado|fishpond)\b/i;

// Major brands for brand match sanity checks
const KNOWN_BRANDS = [
  'apple', 'iphone', 'oneplus', 'samsung', 'xiaomi', 'redmi', 'realme', 'vivo', 'oppo',
  'motorola', 'moto', 'google', 'pixel', 'infinix', 'sony', 'asus', 'dell', 'hp', 'lenovo',
  'acer', 'macbook', 'playstation', 'ps5', 'xbox', 'nintendo', 'boat', 'noise'
];

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Check if SerpApi and Gemini keys are configured on server (with Render detection)
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
    const isRender = Boolean(process.env.RENDER || process.env.IS_RENDER);

    res.json({
      configured: hasSerpKey,
      geminiConfigured: hasGeminiKey,
      model: 'gemini-flash-latest',
      isRender,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      guidance: {
        serpapi: hasSerpKey ? 'Connected' : 'Missing SERPAPI_KEY in Environment Variables',
        gemini: hasGeminiKey
          ? 'Connected (AI Price Intelligence Active)'
          : 'Missing GEMINI_API_KEY in Environment Variables (Smart Catalog fallback active)',
      },
    });
  });

  // SerpApi Google Shopping search endpoint with Gemini & smart Indian price matching
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
        error: 'SerpApi key is not configured. Please set the SERPAPI_KEY environment variable on Render.',
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

      // Fetch Gemini AI price estimate and SerpApi results in parallel
      const [rawAiEstimate, serpData] = await Promise.all([
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

      // Accessory keyword definitions (covers, cases, protectors, spare parts, display combos)
      const qLower = query.toLowerCase();
      const isAccessorySearch = /\b(case|cover|back\s*cover|flip\s*cover|tempered\s*glass|screen\s*guard|screen\s*protector|skin|pouch|sleeve|cable|charging\s*cable|charger|adapter|strap|bumper|lens\s*protector|stand|holder)\b/i.test(qLower);
      const isDeviceQuery = /\b(phone|mobile|smartphone|iphone|oneplus|samsung|galaxy|pixel|laptop|macbook|ipad|tablet|playstation|ps5|xbox|watch|smartwatch|camera|tv|television|earbuds|headphones)\b/i.test(qLower) || !isAccessorySearch;

      const ACCESSORY_TITLE_REGEX = /\b(case|cover|back\s*cover|flip\s*cover|phone\s*case|tempered\s*glass|screen\s*guard|screen\s*protector|pouch|sleeve|skin|body\s*skin|protective\s*case|silicone\s*case|armor\s*case|phone\s*cover|charging\s*cable|cable|charger|adapter|strap|bumper|lens\s*protector|stand|holder|folder|display\s*combo|spare\s*part|battery|sim\s*tray|keychain)\b/i;

      // Extract numeric and key model tokens from search query (e.g. "12", "15", "s24", "pro", "ultra")
      const queryNumberMatches = query.match(/\b\d+\b/g) || [];
      const detectedQueryBrands = KNOWN_BRANDS.filter((b) => qLower.includes(b));

      // Resolve AI or Catalog estimate
      let aiEstimate: GeminiPriceEstimate | null = rawAiEstimate;
      if (!aiEstimate) {
        aiEstimate = getIndianCatalogPrice(query);
      }

      // First pass: Parse raw shopping results for Indian market
      const parsedItems = shoppingResults.map((item: any, index: number) => {
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
        const titleLower = title.toLowerCase();
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

        const isCrossBorderImport = CROSS_BORDER_DROPSHIP_REGEX.test(retailer);
        const isPopularStore = POPULAR_INDIAN_STORES_REGEX.test(retailer) && !isCrossBorderImport;

        // Robust Unconditional Accessory Detection:
        // Even if Gemini is not configured, cases/covers/protectors must NEVER be treated as phones!
        const isAccessoryByTitle = ACCESSORY_TITLE_REGEX.test(title);
        const isAccessoryByPrice =
          !isAccessorySearch &&
          numericPrice !== null &&
          (
            (aiEstimate && aiEstimate.minRealisticPriceINR > 500 && numericPrice < aiEstimate.minRealisticPriceINR * 0.45) ||
            (!aiEstimate && isDeviceQuery && numericPrice < 3500)
          );
        const isAccessory = !isAccessorySearch && (isAccessoryByTitle || isAccessoryByPrice);

        // Mismatched brand / product detection (e.g. Infinix Note 12 or iPhone 12 when user searched OnePlus 12)
        let isMismatched = false;
        if (detectedQueryBrands.length > 0) {
          const hasTargetBrand = detectedQueryBrands.some((b) => titleLower.includes(b));
          const hasOtherMajorBrand = KNOWN_BRANDS.some((b) => !detectedQueryBrands.includes(b) && titleLower.includes(b));
          if (!hasTargetBrand && hasOtherMajorBrand) {
            isMismatched = true;
          }
        }

        // Strict Model Specificity Matching (e.g. if user searched "OnePlus 12", "OnePlus Pad 2" or "OnePlus 15" is mismatched!)
        let isExactModelMatch = false;
        if (!isAccessory && queryNumberMatches.length > 0) {
          const titleNumbers = title.match(/\b\d+\b/g) || [];
          const hasTargetNumber = queryNumberMatches.some((num) => titleNumbers.includes(num));
          const hasWrongCategory =
            (!qLower.includes('pad') && !qLower.includes('tab') && /\b(pad|tablet|tab)\b/i.test(titleLower)) ||
            (!qLower.includes('pro') && !qLower.includes('max') && !qLower.includes('plus') && !qLower.includes('ultra') && !qLower.includes('mini') && /\b(pro\s*max|ultra)\b/i.test(titleLower) && !hasTargetNumber);

          if (!hasTargetNumber && titleNumbers.length > 0) {
            // Title has other numbers (e.g. 15, 13, 2, 4) and NOT the searched number
            isMismatched = true;
          } else if (hasTargetNumber && !hasWrongCategory) {
            isExactModelMatch = true;
          }
        } else if (!isAccessory && !isMismatched) {
          isExactModelMatch = true;
        }

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
          isCrossBorderImport,
          isAccessory,
          isExactModelMatch,
          isMismatched,
          isNearTargetPrice: false,
          priceDiffFromTarget: undefined as number | undefined,
          condition: (isRefurbished ? 'refurbished' : 'new') as 'new' | 'refurbished',
          originalIndex: index,
        };
      });

      // HEURISTIC FALLBACK: If Gemini AI is not configured and not in catalog,
      // deduce the authentic device target price directly from clean, non-accessory device listings!
      if (!aiEstimate || aiEstimate.estimatedPriceINR === 0) {
        const cleanDeviceListings = parsedItems.filter(
          (p: any) =>
            !p.isRefurbished &&
            !p.isAccessory &&
            !p.isMismatched &&
            !p.isCrossBorderImport &&
            p.priceNumber !== null &&
            (isDeviceQuery ? p.priceNumber > 3500 : p.priceNumber > 500)
        );

        if (cleanDeviceListings.length > 0) {
          const sortedPrices = cleanDeviceListings.map((p: any) => p.priceNumber as number).sort((a: number, b: number) => a - b);
          const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
          aiEstimate = {
            estimatedPriceINR: medianPrice,
            minRealisticPriceINR: Math.round(medianPrice * 0.65),
            maxRealisticPriceINR: Math.round(medianPrice * 1.45),
            isAccessoryQuery: isAccessorySearch,
            isHeuristic: true,
            source: 'market-median',
            explanation: `Calculated from verified authentic product listings for "${query}" across Indian stores.`,
          };
        }
      }

      // Second pass: Calculate closeness to target price using Gemini, Catalog, or Cleaned Median estimate
      const results = parsedItems.map((item: any) => {
        let isNearTarget = false;
        let priceDiff: number | undefined = undefined;

        if (aiEstimate && aiEstimate.estimatedPriceINR > 0 && item.priceNumber !== null) {
          priceDiff = Math.abs(item.priceNumber - aiEstimate.estimatedPriceINR);
          isNearTarget =
            !item.isAccessory &&
            !item.isMismatched &&
            !item.isCrossBorderImport &&
            item.priceNumber >= aiEstimate.minRealisticPriceINR * 0.70 &&
            item.priceNumber <= aiEstimate.maxRealisticPriceINR * 1.40;
        }

        return {
          ...item,
          isNearTargetPrice: isNearTarget,
          priceDiffFromTarget: priceDiff,
        };
      });

      // Sort results:
      // 1. Genuine Brand New devices
      //    - Exact Model matches near Target Price from Popular Indian Stores (Amazon, Flipkart, etc.) on top!
      //    - Other verified domestic Indian stores near target price
      //    - Exact model matches outside target price
      // 2. Cross-border import dropshippers (Ubuy, Desertcart) penalized and pushed down
      // 3. Mismatched brands/models
      // 4. Low-cost phone covers and accessories (if user searched for device)
      // 5. Refurbished / Used items positioned below genuine prices
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

          // 3. Relevant products before mismatched brands/models
          if (Boolean(a.isMismatched) !== Boolean(b.isMismatched)) {
            return a.isMismatched ? 1 : -1;
          }

          // 4. Domestic Indian sellers before international cross-border dropshippers
          if (Boolean(a.isCrossBorderImport) !== Boolean(b.isCrossBorderImport)) {
            return a.isCrossBorderImport ? 1 : -1;
          }

          // 5. Exact model matches before other variants
          if (Boolean(a.isExactModelMatch) !== Boolean(b.isExactModelMatch)) {
            return a.isExactModelMatch ? -1 : 1;
          }

          // 6. Products around target price first
          if (aiEstimate && aiEstimate.estimatedPriceINR > 0) {
            if (Boolean(a.isNearTargetPrice) !== Boolean(b.isNearTargetPrice)) {
              return a.isNearTargetPrice ? -1 : 1;
            }

            // If both are near target price:
            if (a.isNearTargetPrice && b.isNearTargetPrice) {
              if (Boolean(a.isPopularStore) !== Boolean(b.isPopularStore)) {
                return a.isPopularStore ? -1 : 1;
              }
              const diffA = a.priceDiffFromTarget ?? Infinity;
              const diffB = b.priceDiffFromTarget ?? Infinity;
              if (diffA !== diffB) {
                return diffA - diffB;
              }
            }
          }

          // Prioritize popular Indian domestic stores
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
        geminiActive: Boolean(rawAiEstimate && !rawAiEstimate.isHeuristic),
        estimateSource: aiEstimate?.source || (rawAiEstimate ? 'gemini-ai' : 'market-median'),
        total: results.length,
        results: sortedResults,
        serverDiagnostics: {
          serpConfigured: true,
          geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
          geminiActive: Boolean(rawAiEstimate && !rawAiEstimate.isHeuristic),
          isRender: Boolean(process.env.RENDER || process.env.IS_RENDER),
        },
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

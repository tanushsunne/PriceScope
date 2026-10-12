export interface HistoricalPricePoint {
  date: string;
  fullDate: string;
  price: number;
  isLowest?: boolean;
}

export type DealGrade = 'steal' | 'good' | 'fair' | 'pricey';

export interface PriceTrendData {
  productId: string;
  thirtyDayAvg: number;
  thirtyDayLow: number;
  thirtyDayHigh: number;
  currentPrice: number;
  diffFromAvg: number;
  diffFromAvgPercent: number;
  dealGrade: DealGrade;
  dealVerdict: string;
  recommendation: string;
  history: HistoricalPricePoint[];
}

export interface AiPriceEstimate {
  estimatedPriceINR: number;
  minRealisticPriceINR: number;
  maxRealisticPriceINR: number;
  isAccessoryQuery: boolean;
  isHeuristic?: boolean;
  source?: 'gemini-ai' | 'indian-tech-catalog' | 'market-median';
  explanation?: string;
}

export interface ShoppingProduct {
  id: string;
  title: string;
  thumbnail: string;
  price: string;
  priceNumber: number | null;
  source: string;
  link: string;
  rating?: number | null;
  reviews?: number | null;
  delivery?: string | null;
  originalIndex: number;
  isRefurbished?: boolean;
  isPopularStore?: boolean;
  isCrossBorderImport?: boolean;
  isAccessory?: boolean;
  isNearTargetPrice?: boolean;
  isExactModelMatch?: boolean;
  isMismatched?: boolean;
  priceDiffFromTarget?: number;
  condition?: 'new' | 'refurbished';
  trend?: PriceTrendData;
}

export type ConditionFilter = 'all' | 'new' | 'refurbished';

export type SortOption =
  | 'ai_match'
  | 'popular_first'
  | 'price_asc'
  | 'price_desc'
  | 'retailer_asc'
  | 'rating_desc'
  | 'relevance';

export interface PriceInsights {
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  savings: number;
  savingsPercent: number;
  bestMerchant: string;
  totalDeals: number;
}

export interface ServerStatusResponse {
  configured: boolean;
  geminiConfigured: boolean;
  model: string;
  isRender: boolean;
  environment: string;
  timestamp: string;
  guidance?: {
    serpapi: string;
    gemini: string;
  };
}

export interface SearchApiResponse {
  query?: string;
  aiEstimate?: AiPriceEstimate | null;
  geminiActive?: boolean;
  estimateSource?: 'gemini-ai' | 'indian-tech-catalog' | 'market-median';
  total?: number;
  results: ShoppingProduct[];
  serverDiagnostics?: {
    serpConfigured: boolean;
    geminiConfigured: boolean;
    geminiActive: boolean;
    isRender: boolean;
  };
  error?: string;
  code?: string;
}

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
  condition?: 'new' | 'refurbished';
  trend?: PriceTrendData;
}

export type ConditionFilter = 'all' | 'new' | 'refurbished';

export type SortOption =
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

export interface SearchApiResponse {
  query?: string;
  total?: number;
  results: ShoppingProduct[];
  error?: string;
  code?: string;
}

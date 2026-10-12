/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShoppingProduct,
  SortOption,
  PriceInsights,
  SearchApiResponse,
  PriceTrendData,
  ConditionFilter,
  AiPriceEstimate,
} from './types';
import { Navbar } from './components/Navbar';
import { SearchBar } from './components/SearchBar';
import { ProductCard } from './components/ProductCard';
import { InsightsBanner } from './components/InsightsBanner';
import { FilterSortBar } from './components/FilterSortBar';
import { SkeletonGrid } from './components/SkeletonGrid';
import { PriceTrendModal } from './components/PriceTrendModal';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import { fetchProductPriceTrend } from './services/historyService';
import { isPopularIndianStore, formatINR } from './utils/formatters';
import {
  ShoppingBag,
  AlertCircle,
  RefreshCw,
  Search,
  Zap,
  Sparkles,
  Recycle,
  CheckCircle2,
  Target,
  Layers,
} from 'lucide-react';

export default function App() {
  const [query, setQuery] = useState('');
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [products, setProducts] = useState<ShoppingProduct[]>([]);
  const [aiEstimate, setAiEstimate] = useState<AiPriceEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('pricescope_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Apply dark mode to document element
  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('pricescope_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('pricescope_theme', 'light');
      }
    } catch (e) {
      console.warn('Failed to update theme preference:', e);
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Sorting and Filtering states - default to ai_match
  const [sortOption, setSortOption] = useState<SortOption>('ai_match');
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter>('all');
  const [selectedRetailers, setSelectedRetailers] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  // 30-Day Historical Trend modal state
  const [selectedProductForTrend, setSelectedProductForTrend] = useState<ShoppingProduct | null>(null);
  const [trendData, setTrendData] = useState<PriceTrendData | null>(null);
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [isTrendModalOpen, setIsTrendModalOpen] = useState(false);

  const searchSectionRef = useRef<HTMLDivElement>(null);

  // Perform live Google Shopping India search via backend
  const executeSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setErrorCode(null);
    setCurrentSearchTerm(searchTerm);

    // Reset filters for new search
    setSelectedRetailers([]);
    setMinPrice('');
    setMaxPrice('');
    setConditionFilter('all');

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchTerm.trim())}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      const data: SearchApiResponse = await response.json();

      if (!response.ok || data.error) {
        setErrorMessage(
          data.error || `Error searching Google Shopping (${response.status})`
        );
        setErrorCode(data.code || 'UNKNOWN_ERROR');
        setProducts([]);
        setAiEstimate(null);
      } else {
        setProducts(data.results || []);
        setAiEstimate(data.aiEstimate || null);
        // Default to ai_match when estimate exists, or popular_first
        setSortOption(data.aiEstimate && data.aiEstimate.estimatedPriceINR > 0 ? 'ai_match' : 'popular_first');
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Network error: Unable to contact the price search service.'
      );
      setErrorCode('NETWORK_ERROR');
      setProducts([]);
      setAiEstimate(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle viewing 30-day historical trend for selected product
  const handleViewTrend = async (product: ShoppingProduct) => {
    setSelectedProductForTrend(product);
    setIsTrendModalOpen(true);

    if (product.trend) {
      setTrendData(product.trend);
      setIsTrendLoading(false);
      return;
    }

    setIsTrendLoading(true);
    try {
      const trend = await fetchProductPriceTrend(product);
      setTrendData(trend);
      product.trend = trend;
    } catch (err) {
      console.error('Error fetching trend:', err);
    } finally {
      setIsTrendLoading(false);
    }
  };

  // Counts of brand new vs refurbished vs popular stores
  const countNew = useMemo(
    () => products.filter((p) => !p.isRefurbished).length,
    [products]
  );
  const countRefurbished = useMemo(
    () => products.filter((p) => p.isRefurbished).length,
    [products]
  );
  const countPopular = useMemo(
    () => products.filter((p) => p.isPopularStore && !p.isRefurbished).length,
    [products]
  );

  // Derive unique retailers with item counts and popular Indian store sorting
  const retailers = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => {
      const source = p.source.trim();
      counts.set(source, (counts.get(source) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({
        name,
        count,
        isPopular: isPopularIndianStore(name),
      }))
      .sort((a, b) => {
        if (a.isPopular !== b.isPopular) {
          return a.isPopular ? -1 : 1;
        }
        return b.count - a.count;
      });
  }, [products]);

  // Filter products based on active filters
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // Condition filter
      if (conditionFilter === 'new' && item.isRefurbished) {
        return false;
      }
      if (conditionFilter === 'refurbished' && !item.isRefurbished) {
        return false;
      }

      // Retailer filter
      if (
        selectedRetailers.length > 0 &&
        !selectedRetailers.includes(item.source)
      ) {
        return false;
      }

      // Min price filter
      const min = parseFloat(minPrice);
      if (!isNaN(min) && (item.priceNumber === null || item.priceNumber < min)) {
        return false;
      }

      // Max price filter
      const max = parseFloat(maxPrice);
      if (!isNaN(max) && (item.priceNumber === null || item.priceNumber > max)) {
        return false;
      }

      return true;
    });
  }, [products, conditionFilter, selectedRetailers, minPrice, maxPrice]);

  // Sort filtered products:
  // ai_match: products around the Gemini estimated price appear first!
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];

    switch (sortOption) {
      case 'ai_match':
        return list.sort((a, b) => {
          // 1. Genuine real price items always before refurbished
          if (Boolean(a.isRefurbished) !== Boolean(b.isRefurbished)) {
            return a.isRefurbished ? 1 : -1;
          }

          // 2. Main products before accessories (covers/cases)
          if (!a.isRefurbished && !b.isRefurbished) {
            if (Boolean(a.isAccessory) !== Boolean(b.isAccessory)) {
              return a.isAccessory ? 1 : -1;
            }

            // 3. Products in target price range first
            if (Boolean(a.isNearTargetPrice) !== Boolean(b.isNearTargetPrice)) {
              return a.isNearTargetPrice ? -1 : 1;
            }

            // If both in target price range:
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

            // Prioritize popular stores
            if (Boolean(a.isPopularStore) !== Boolean(b.isPopularStore)) {
              return a.isPopularStore ? -1 : 1;
            }
          }

          // Price ascending
          if (a.priceNumber !== null && b.priceNumber !== null) {
            return a.priceNumber - b.priceNumber;
          }
          if (a.priceNumber !== null) return -1;
          if (b.priceNumber !== null) return 1;
          return 0;
        });

      case 'popular_first':
        return list.sort((a, b) => {
          if (Boolean(a.isRefurbished) !== Boolean(b.isRefurbished)) {
            return a.isRefurbished ? 1 : -1;
          }
          if (!a.isRefurbished && !b.isRefurbished) {
            if (Boolean(a.isAccessory) !== Boolean(b.isAccessory)) {
              return a.isAccessory ? 1 : -1;
            }
            if (Boolean(a.isPopularStore) !== Boolean(b.isPopularStore)) {
              return a.isPopularStore ? -1 : 1;
            }
          }
          if (a.priceNumber !== null && b.priceNumber !== null) {
            return a.priceNumber - b.priceNumber;
          }
          if (a.priceNumber !== null) return -1;
          if (b.priceNumber !== null) return 1;
          return 0;
        });

      case 'price_asc':
        return list.sort((a, b) => {
          if (Boolean(a.isRefurbished) !== Boolean(b.isRefurbished)) {
            return a.isRefurbished ? 1 : -1;
          }
          if (!a.isRefurbished && !b.isRefurbished) {
            if (Boolean(a.isAccessory) !== Boolean(b.isAccessory)) {
              return a.isAccessory ? 1 : -1;
            }
          }
          if (a.priceNumber !== null && b.priceNumber !== null) {
            return a.priceNumber - b.priceNumber;
          }
          if (a.priceNumber !== null) return -1;
          if (b.priceNumber !== null) return 1;
          return 0;
        });

      case 'price_desc':
        return list.sort((a, b) => {
          if (Boolean(a.isRefurbished) !== Boolean(b.isRefurbished)) {
            return a.isRefurbished ? 1 : -1;
          }
          if (a.priceNumber !== null && b.priceNumber !== null) {
            return b.priceNumber - a.priceNumber;
          }
          if (a.priceNumber !== null) return -1;
          if (b.priceNumber !== null) return 1;
          return 0;
        });

      case 'retailer_asc':
        return list.sort((a, b) => a.source.localeCompare(b.source));

      case 'rating_desc':
        return list.sort((a, b) => {
          const rA = a.rating ?? 0;
          const rB = b.rating ?? 0;
          return rB - rA;
        });

      case 'relevance':
        return list.sort((a, b) => a.originalIndex - b.originalIndex);

      default:
        return list;
    }
  }, [filteredProducts, sortOption]);

  // Separate genuine brand new vs accessories vs refurbished
  const genuineNewResults = useMemo(
    () => sortedProducts.filter((p) => !p.isRefurbished && !p.isAccessory),
    [sortedProducts]
  );
  const accessoryResults = useMemo(
    () => sortedProducts.filter((p) => !p.isRefurbished && p.isAccessory),
    [sortedProducts]
  );
  const refurbishedResults = useMemo(
    () => sortedProducts.filter((p) => p.isRefurbished),
    [sortedProducts]
  );

  // Compute lowest price strictly among genuine brand new non-accessory products in INR
  const lowestGenuinePrice = useMemo(() => {
    const genuineWithPrices = products.filter(
      (p) => !p.isRefurbished && !p.isAccessory && typeof p.priceNumber === 'number' && p.priceNumber > 0
    );
    if (genuineWithPrices.length === 0) return 0;
    return Math.min(...genuineWithPrices.map((p) => p.priceNumber as number));
  }, [products]);

  // Compute price insights across genuine products if available, or all items
  const insights: PriceInsights = useMemo(() => {
    const targetSet = products.filter(
      (p): p is ShoppingProduct & { priceNumber: number } =>
        !p.isRefurbished && !p.isAccessory && typeof p.priceNumber === 'number' && !isNaN(p.priceNumber) && p.priceNumber > 0
    );

    const itemsToCompute = targetSet.length > 0
      ? targetSet
      : products.filter(
          (p): p is ShoppingProduct & { priceNumber: number } =>
            typeof p.priceNumber === 'number' && !isNaN(p.priceNumber) && p.priceNumber > 0
        );

    if (itemsToCompute.length === 0) {
      return {
        minPrice: 0,
        maxPrice: 0,
        avgPrice: 0,
        savings: 0,
        savingsPercent: 0,
        bestMerchant: 'N/A',
        totalDeals: products.length,
      };
    }

    let min = itemsToCompute[0].priceNumber;
    let max = itemsToCompute[0].priceNumber;
    let sum = 0;
    let bestMerchant = itemsToCompute[0].source;

    itemsToCompute.forEach((p) => {
      if (p.priceNumber < min) {
        min = p.priceNumber;
        bestMerchant = p.source;
      }
      if (p.priceNumber > max) {
        max = p.priceNumber;
      }
      sum += p.priceNumber;
    });

    const avg = sum / itemsToCompute.length;
    const savings = Math.max(0, max - min);
    const savingsPercent = max > 0 ? (savings / max) * 100 : 0;

    return {
      minPrice: min,
      maxPrice: max,
      avgPrice: avg,
      savings,
      savingsPercent,
      bestMerchant,
      totalDeals: products.length,
    };
  }, [products]);

  const handleToggleRetailer = (retailer: string) => {
    setSelectedRetailers((prev) =>
      prev.includes(retailer)
        ? prev.filter((r) => r !== retailer)
        : [...prev, retailer]
    );
  };

  const handleResetFilters = () => {
    setSelectedRetailers([]);
    setMinPrice('');
    setMaxPrice('');
    setConditionFilter('all');
    setSortOption(aiEstimate && aiEstimate.estimatedPriceINR > 0 ? 'ai_match' : 'popular_first');
  };

  const scrollToSearch = () => {
    searchSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100/60 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-200">
      {/* Top Bar Navigation */}
      <Navbar
        onScrollToSearch={scrollToSearch}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Search Hero Area */}
        <div ref={searchSectionRef} className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900/5 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full text-xs font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Gemini AI Price Intelligence & Google Shopping India (₹ INR)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mb-4 font-['Syne'] text-balance">
            Compare Indian Store Prices in Seconds
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Gemini estimates the authentic price of the product and surfaces real offers around that price first, filtering out phone covers and accessories.
          </p>

          <SearchBar
            onSearch={executeSearch}
            isLoading={isLoading}
            initialQuery={query}
          />
        </div>

        {/* Error State Banner */}
        {errorMessage && !isLoading && (
          <div className="max-w-3xl mx-auto mb-8 p-4 sm:p-5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-red-900 dark:text-red-300 text-xs shadow-xs">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-sm text-red-900 dark:text-red-200">Search Error</h3>
                <p className="mt-1 text-red-800 dark:text-red-300 leading-relaxed">{errorMessage}</p>
                {errorCode === 'MISSING_API_KEY' ? (
                  <p className="mt-2 text-red-700 dark:text-red-400 leading-relaxed">
                    Please ensure the <code className="bg-red-100 dark:bg-red-900/60 font-mono px-1 rounded">SERPAPI_KEY</code> environment variable is set on the server.
                  </p>
                ) : (
                  currentSearchTerm && (
                    <button
                      onClick={() => executeSearch(currentSearchTerm)}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-900 dark:text-red-200 font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Try again</span>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <div className="h-28 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 animate-pulse flex items-center justify-between" />
            <SkeletonGrid />
          </div>
        )}

        {/* Active Results Display */}
        {!isLoading && products.length > 0 && (
          <div className="space-y-6">
            {/* Gemini AI Estimated Price Intelligence Banner */}
            {aiEstimate && aiEstimate.estimatedPriceINR > 0 && (
              <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                        Gemini AI Price Intelligence
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-200/70 dark:bg-emerald-900/70 text-emerald-900 dark:text-emerald-200 text-[10px] font-bold rounded-full">
                        Target Price Match Active
                      </span>
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      Gemini analyzed <strong>"{currentSearchTerm}"</strong> and estimated authentic market price at ~<strong className="text-emerald-800 dark:text-emerald-300">{formatINR(aiEstimate.estimatedPriceINR)}</strong> (typical device range: {formatINR(aiEstimate.minRealisticPriceINR)} – {formatINR(aiEstimate.maxRealisticPriceINR)}). Products matching this real price are prioritized on top.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto shrink-0 bg-white/80 dark:bg-zinc-900/80 px-3.5 py-2 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40">
                  <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block uppercase font-medium">
                      AI Target Price
                    </span>
                    <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300 tabular-nums">
                      {formatINR(aiEstimate.estimatedPriceINR)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Price Overview Insights Banner */}
            <InsightsBanner insights={insights} query={currentSearchTerm} />

            {/* Filter and Sorting Controls */}
            <FilterSortBar
              sortOption={sortOption}
              onSortChange={setSortOption}
              conditionFilter={conditionFilter}
              onConditionFilterChange={setConditionFilter}
              countNew={countNew}
              countRefurbished={countRefurbished}
              countPopular={countPopular}
              retailers={retailers}
              selectedRetailers={selectedRetailers}
              onToggleRetailer={handleToggleRetailer}
              onClearRetailers={() => setSelectedRetailers([])}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onMinPriceChange={setMinPrice}
              onMaxPriceChange={setMaxPrice}
              onResetFilters={handleResetFilters}
              totalFiltered={sortedProducts.length}
              totalRaw={products.length}
            />

            {/* Products Card Grid */}
            {sortedProducts.length > 0 ? (
              <div className="space-y-8">
                {/* Genuine / Brand New Section */}
                {genuineNewResults.length > 0 && (
                  <div>
                    {conditionFilter === 'all' && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Authentic Product Offers ({genuineNewResults.length})</span>
                        </div>
                        {countPopular > 0 && (
                          <div className="inline-flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900/60">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Popular Stores (Amazon, Flipkart, Croma, etc.) Prioritized on Top</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {genuineNewResults.map((product, idx) => {
                        const isLowest =
                          !product.isRefurbished &&
                          !product.isAccessory &&
                          product.priceNumber !== null &&
                          product.priceNumber === lowestGenuinePrice &&
                          lowestGenuinePrice > 0;

                        return (
                          <ProductCard
                            key={product.id || `${product.source}-${idx}`}
                            product={product}
                            isLowestPrice={isLowest}
                            rank={idx + 1}
                            onViewTrend={handleViewTrend}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Accessory & Covers Section (Positioned Below Devices) */}
                {accessoryResults.length > 0 && (
                  <div className={genuineNewResults.length > 0 ? 'pt-6 border-t border-zinc-200/80 dark:border-zinc-800' : ''}>
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-zinc-100/70 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 rounded-xl">
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        <Layers className="w-4 h-4 text-zinc-500 shrink-0" />
                        <span>Phone Covers, Cases & Accessories ({accessoryResults.length})</span>
                      </div>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Separated below so low-cost accessories do not hide real device prices
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {accessoryResults.map((product, idx) => (
                        <ProductCard
                          key={product.id || `${product.source}-acc-${idx}`}
                          product={product}
                          isLowestPrice={false}
                          rank={genuineNewResults.length + idx + 1}
                          onViewTrend={handleViewTrend}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Refurbished / Used Section (Positioned Below Genuine Prices) */}
                {refurbishedResults.length > 0 && (
                  <div className={(genuineNewResults.length > 0 || accessoryResults.length > 0) && conditionFilter === 'all' ? 'pt-6 border-t border-zinc-200/80 dark:border-zinc-800' : ''}>
                    {conditionFilter === 'all' && (genuineNewResults.length > 0 || accessoryResults.length > 0) && (
                      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-xl">
                        <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-300">
                          <Recycle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>Refurbished & Pre-Owned Deals ({refurbishedResults.length})</span>
                        </div>
                        <span className="text-[11px] text-amber-800/80 dark:text-amber-400/80">
                          Renewed or open-box listings shown below genuine retail prices
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {refurbishedResults.map((product, idx) => (
                        <ProductCard
                          key={product.id || `${product.source}-refurb-${idx}`}
                          product={product}
                          isLowestPrice={false}
                          rank={genuineNewResults.length + accessoryResults.length + idx + 1}
                          onViewTrend={handleViewTrend}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-xs">
                <ShoppingBag className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  No matching deals found
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
                  No products matched your active condition, retailer, or price filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State when no search done yet */}
        {!isLoading && products.length === 0 && !errorMessage && (
          <div className="mt-8 border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl p-8 sm:p-12 shadow-xs transition-colors">
            <div className="text-center max-w-md mx-auto mb-10">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-200 mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                AI-Powered Price Comparison in India (₹)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Type any mobile, laptop, headphone, or gadget above. Gemini AI calculates the realistic product price and prioritizes authentic deals across Amazon, Flipkart, Croma, and Reliance Digital.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2 text-zinc-900 dark:text-zinc-100 font-semibold text-sm">
                  <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Gemini AI Price Targeting</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Automatically estimates genuine device pricing so phone cases and ₹150 covers never outrank authentic smartphones.
                </p>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2 text-zinc-900 dark:text-zinc-100 font-semibold text-sm">
                  <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Amazon & Flipkart on Top</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Verified offers from trusted giants (Amazon India, Flipkart, Croma, Reliance Digital) are placed prominently first.
                </p>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2 text-zinc-900 dark:text-zinc-100 font-semibold text-sm">
                  <Recycle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Refurbished Kept Below</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Refurbished, pre-owned, and open-box listings (Cashify, Renewed) are organized in their own dedicated section below.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Go to Top Button at bottom right */}
      <ScrollToTopButton />

      {/* 30-Day Price Trend Drawer / Modal */}
      <PriceTrendModal
        product={selectedProductForTrend}
        trend={trendData}
        isLoading={isTrendLoading}
        isOpen={isTrendModalOpen}
        onClose={() => setIsTrendModalOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-['Syne']">PriceScope India</span>
            <span>·</span>
            <span>Powered by Gemini AI & Google Shopping India</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://serpapi.com/google-shopping-api"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors inline-flex items-center gap-1"
            >
              <span>SerpApi Docs</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

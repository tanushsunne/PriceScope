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
import {
  ShoppingBag,
  AlertCircle,
  RefreshCw,
  Search,
  Zap,
  Globe2,
  Sparkles,
  Recycle,
} from 'lucide-react';

export default function App() {
  const [query, setQuery] = useState('');
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [products, setProducts] = useState<ShoppingProduct[]>([]);
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

  // Sorting and Filtering states
  const [sortOption, setSortOption] = useState<SortOption>('price_asc');
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

  // Perform live Google Shopping search via backend
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
      } else {
        setProducts(data.results || []);
        // Reset sort to default price_asc on fresh search
        setSortOption('price_asc');
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Network error: Unable to contact the price search service.'
      );
      setErrorCode('NETWORK_ERROR');
      setProducts([]);
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

  // Counts of brand new vs refurbished
  const countNew = useMemo(
    () => products.filter((p) => !p.isRefurbished).length,
    [products]
  );
  const countRefurbished = useMemo(
    () => products.filter((p) => p.isRefurbished).length,
    [products]
  );

  // Derive unique retailers with item counts
  const retailers = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => {
      const source = p.source.trim();
      counts.set(source, (counts.get(source) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
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

  // Sort filtered products: Genuine real price items FIRST, Refurbished / Used items BELOW
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];

    switch (sortOption) {
      case 'price_asc':
        return list.sort((a, b) => {
          // Genuine real price items first
          if (Boolean(a.isRefurbished) !== Boolean(b.isRefurbished)) {
            return a.isRefurbished ? 1 : -1;
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

  // Separate genuine brand new vs refurbished in the sorted results
  const genuineNewResults = useMemo(
    () => sortedProducts.filter((p) => !p.isRefurbished),
    [sortedProducts]
  );
  const refurbishedResults = useMemo(
    () => sortedProducts.filter((p) => p.isRefurbished),
    [sortedProducts]
  );

  // Compute lowest price strictly among genuine brand new products
  const lowestGenuinePrice = useMemo(() => {
    const genuineWithPrices = products.filter(
      (p) => !p.isRefurbished && typeof p.priceNumber === 'number' && p.priceNumber > 0
    );
    if (genuineWithPrices.length === 0) return 0;
    return Math.min(...genuineWithPrices.map((p) => p.priceNumber as number));
  }, [products]);

  // Compute price insights across genuine products if available, or all items
  const insights: PriceInsights = useMemo(() => {
    // Focus insights primarily on genuine products so users see true retail comparison
    const targetSet = products.filter(
      (p): p is ShoppingProduct & { priceNumber: number } =>
        !p.isRefurbished && typeof p.priceNumber === 'number' && !isNaN(p.priceNumber) && p.priceNumber > 0
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
    setSortOption('price_asc');
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
            <Globe2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Live Google Shopping Intelligence via SerpApi</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mb-4 font-['Syne'] text-balance">
            Compare Live Retailer Prices in Seconds
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Genuine brand new prices prioritized first, with refurbished and pre-owned deals clearly separated below.
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
                    {refurbishedResults.length > 0 && conditionFilter === 'all' && (
                      <div className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Genuine Brand New Offers ({genuineNewResults.length})</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {genuineNewResults.map((product, idx) => {
                        const isLowest =
                          !product.isRefurbished &&
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

                {/* Refurbished / Used Section (Positioned Below Genuine Prices) */}
                {refurbishedResults.length > 0 && (
                  <div className={genuineNewResults.length > 0 && conditionFilter === 'all' ? 'pt-6 border-t border-zinc-200/80 dark:border-zinc-800' : ''}>
                    {conditionFilter === 'all' && genuineNewResults.length > 0 && (
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
                          rank={genuineNewResults.length + idx + 1}
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
                Real-Time Shopping Comparison & Price Trends
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Type any consumer electronic, fashion item, appliance, or gadget above to stream live pricing and historical 30-day deal analysis.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2 text-zinc-900 dark:text-zinc-100 font-semibold text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Genuine Price Prioritization</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Real brand-new retail prices always appear at the top, preventing refurbished items from masking genuine deals.
                </p>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2 text-zinc-900 dark:text-zinc-100 font-semibold text-sm">
                  <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Live Google Shopping Feed</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Direct connection to Google Shopping engine ensuring live prices, stock statuses, and seller links per query.
                </p>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2 text-zinc-900 dark:text-zinc-100 font-semibold text-sm">
                  <Recycle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Refurbished Separation</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Pre-owned, renewed, and refurbished options are clearly badged and organized below genuine retail prices.
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
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-['Syne']">PriceScope</span>
            <span>·</span>
            <span>Powered by SerpApi Google Shopping API</span>
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

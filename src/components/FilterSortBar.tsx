import React, { useState } from 'react';
import { SortOption, ConditionFilter } from '../types';
import { ArrowUpDown, SlidersHorizontal, RotateCcw, Check, Sparkles } from 'lucide-react';

interface FilterSortBarProps {
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  conditionFilter: ConditionFilter;
  onConditionFilterChange: (cond: ConditionFilter) => void;
  countNew: number;
  countRefurbished: number;
  retailers: { name: string; count: number }[];
  selectedRetailers: string[];
  onToggleRetailer: (retailer: string) => void;
  onClearRetailers: () => void;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (val: string) => void;
  onMaxPriceChange: (val: string) => void;
  onResetFilters: () => void;
  totalFiltered: number;
  totalRaw: number;
}

export const FilterSortBar: React.FC<FilterSortBarProps> = ({
  sortOption,
  onSortChange,
  conditionFilter,
  onConditionFilterChange,
  countNew,
  countRefurbished,
  retailers,
  selectedRetailers,
  onToggleRetailer,
  onClearRetailers,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  onResetFilters,
  totalFiltered,
  totalRaw,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    selectedRetailers.length > 0 || minPrice !== '' || maxPrice !== '' || conditionFilter !== 'all';

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 mb-6 shadow-xs transition-colors space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Count and Quick Filter Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {totalFiltered === totalRaw ? (
              <span>{totalRaw} Results Found</span>
            ) : (
              <span>
                {totalFiltered} of {totalRaw} Results
              </span>
            )}
          </span>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              showFilters || hasActiveFilters
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                : 'bg-zinc-50 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 ml-0.5" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Condition Filter Segmented Tabs & Sort Dropdown */}
        <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
          {/* Condition Segmented Controls */}
          {countRefurbished > 0 && (
            <div className="inline-flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => onConditionFilterChange('all')}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                  conditionFilter === 'all'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                All ({totalRaw})
              </button>
              <button
                type="button"
                onClick={() => onConditionFilterChange('new')}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  conditionFilter === 'new'
                    ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Brand New ({countNew})</span>
              </button>
              <button
                type="button"
                onClick={() => onConditionFilterChange('refurbished')}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                  conditionFilter === 'refurbished'
                    ? 'bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-400 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Refurbished ({countRefurbished})
              </button>
            </div>
          )}

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
              <span>Sort:</span>
            </label>
            <select
              id="sort-select"
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-800 dark:focus:ring-zinc-400 transition-colors cursor-pointer"
            >
              <option value="price_asc">Price: Low to High (Genuine First)</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="retailer_asc">Retailer Name (A-Z)</option>
              <option value="rating_desc">Highest Rated</option>
              <option value="relevance">Google Shopping Ranking</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expandable Filter Tray */}
      {showFilters && (
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Price Range Filter */}
          <div>
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-2">
              Price Range ($)
            </span>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 dark:text-zinc-500">
                  $
                </span>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => onMinPriceChange(e.target.value)}
                  className="w-full text-xs pl-6 pr-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-zinc-800 dark:focus:border-zinc-400 bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100"
                  min="0"
                />
              </div>
              <span className="text-zinc-400 dark:text-zinc-600 text-xs">—</span>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 dark:text-zinc-500">
                  $
                </span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => onMaxPriceChange(e.target.value)}
                  className="w-full text-xs pl-6 pr-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-zinc-800 dark:focus:border-zinc-400 bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Retailer Multi-select Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Filter by Retailer ({retailers.length})
              </span>
              {selectedRetailers.length > 0 && (
                <button
                  type="button"
                  onClick={onClearRetailers}
                  className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Clear ({selectedRetailers.length})
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {retailers.map((r) => {
                const isSelected = selectedRetailers.includes(r.name);
                return (
                  <button
                    key={r.name}
                    type="button"
                    onClick={() => onToggleRetailer(r.name)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium'
                        : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span className="truncate max-w-[120px]">{r.name}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400 dark:text-zinc-500'}`}>
                      ({r.count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

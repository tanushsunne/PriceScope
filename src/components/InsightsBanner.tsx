import React from 'react';
import { PriceInsights } from '../types';
import { TrendingDown, BarChart3 } from 'lucide-react';

interface InsightsBannerProps {
  insights: PriceInsights;
  query: string;
}

export const InsightsBanner: React.FC<InsightsBannerProps> = ({
  insights,
  query,
}) => {
  if (insights.totalDeals === 0) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 shadow-xs mb-6 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Market Price Overview</span>
          </div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Price comparison for <span className="text-emerald-700 dark:text-emerald-400">"{query}"</span>
          </h2>
        </div>

        {insights.savings > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-xs font-medium text-emerald-800 dark:text-emerald-300 self-start md:self-auto">
            <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              Save up to <strong className="font-bold tabular-nums">${insights.savings.toFixed(2)}</strong> ({insights.savingsPercent.toFixed(0)}%) by comparing retailers
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Lowest Price */}
        <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100/80 dark:border-emerald-900/40">
          <span className="text-xs text-emerald-800 dark:text-emerald-400 font-medium block mb-1">
            Lowest Price
          </span>
          <span className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
            ${insights.minPrice.toFixed(2)}
          </span>
          <span className="text-[11px] text-emerald-600/90 dark:text-emerald-400/80 block truncate mt-0.5">
            via {insights.bestMerchant}
          </span>
        </div>

        {/* Highest Price */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-200/60 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium block mb-1">
            Highest Price
          </span>
          <span className="text-xl sm:text-2xl font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">
            ${insights.maxPrice.toFixed(2)}
          </span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block mt-0.5">
            Range high
          </span>
        </div>

        {/* Average Price */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-200/60 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium block mb-1">
            Average Market Price
          </span>
          <span className="text-xl sm:text-2xl font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">
            ${insights.avgPrice.toFixed(2)}
          </span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block mt-0.5">
            Across all offers
          </span>
        </div>

        {/* Offers Compared */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-200/60 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium block mb-1">
            Retailers Compared
          </span>
          <span className="text-xl sm:text-2xl font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">
            {insights.totalDeals}
          </span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block mt-0.5">
            Live Google Shopping
          </span>
        </div>
      </div>
    </div>
  );
};

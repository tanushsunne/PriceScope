import React, { useState } from 'react';
import { ShoppingProduct, PriceTrendData } from '../types';
import {
  X,
  TrendingDown,
  TrendingUp,
  Minus,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';

interface PriceTrendModalProps {
  product: ShoppingProduct | null;
  trend: PriceTrendData | null;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const PriceTrendModal: React.FC<PriceTrendModalProps> = ({
  product,
  trend,
  isLoading,
  isOpen,
  onClose,
}) => {
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  if (!isOpen || !product) return null;

  // Chart dimensions
  const chartWidth = 600;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const history = trend?.history || [];
  const minPrice = trend ? Math.min(trend.thirtyDayLow * 0.98, trend.currentPrice * 0.98) : 0;
  const maxPrice = trend ? Math.max(trend.thirtyDayHigh * 1.02, trend.currentPrice * 1.02) : 100;
  const priceRange = maxPrice - minPrice || 1;

  // Generate SVG coordinates
  const points = history.map((pt, index) => {
    const x = paddingX + (index / (history.length - 1 || 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - ((pt.price - minPrice) / priceRange) * (chartHeight - paddingY * 2);
    return { x, y, pt, index };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, curr, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`, '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : '';

  const avgY = trend
    ? chartHeight - paddingY - ((trend.thirtyDayAvg - minPrice) / priceRange) * (chartHeight - paddingY * 2)
    : 0;

  const hoveredPoint = hoveredPointIndex !== null ? points[hoveredPointIndex] : null;

  // Deal badge styling
  const getGradeStyle = () => {
    switch (trend?.dealGrade) {
      case 'steal':
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
          icon: <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          title: 'All-Time 30-Day Low',
        };
      case 'good':
        return {
          bg: 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 border-teal-500/30',
          icon: <TrendingDown className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
          title: 'Good Deal — Below Average',
        };
      case 'fair':
        return {
          bg: 'bg-zinc-500/10 dark:bg-zinc-500/20 text-zinc-700 dark:text-zinc-300 border-zinc-500/30',
          icon: <Minus className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />,
          title: 'Fair Market Price',
        };
      case 'pricey':
        return {
          bg: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/30',
          icon: <TrendingUp className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
          title: 'Priced Higher Than Usual',
        };
      default:
        return {
          bg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
          icon: <Info className="w-4 h-4" />,
          title: 'Analyzing Trend...',
        };
    }
  };

  const gradeInfo = getGradeStyle();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/60 dark:bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-100 dark:border-zinc-700/60 flex items-center justify-center p-1 shrink-0 overflow-hidden">
              {product.thumbnail ? (
                <img
                  src={product.thumbnail}
                  alt={product.title}
                  className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal"
                />
              ) : (
                <Calendar className="w-6 h-6 text-zinc-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{product.source}</span>
                <span>·</span>
                <span>30-Day Historical Price Tracker</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                {product.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            aria-label="Close trend modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent dark:border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Fetching 30-day historical pricing data...
              </p>
            </div>
          ) : trend ? (
            <>
              {/* Verdict & Recommendation Banner */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${gradeInfo.bg}`}>
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/80 dark:bg-zinc-800/80 shrink-0">
                    {gradeInfo.icon}
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block">
                      {trend.dealVerdict}
                    </span>
                    <p className="text-xs mt-0.5 opacity-90 leading-relaxed font-normal">
                      {trend.recommendation}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span className="text-[11px] uppercase tracking-wider opacity-70 block">
                    Current Deal
                  </span>
                  <span className="text-xl font-extrabold tabular-nums tracking-tight">
                    ${trend.currentPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* 4 Stat Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200/70 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">30-Day Lowest</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    ${trend.thirtyDayLow.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Historical bottom</span>
                </div>

                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200/70 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">30-Day Average</span>
                  <span className="text-base font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">
                    ${trend.thirtyDayAvg.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Market baseline</span>
                </div>

                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200/70 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">30-Day Highest</span>
                  <span className="text-base font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">
                    ${trend.thirtyDayHigh.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Peak rate</span>
                </div>

                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200/70 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">vs 30-Day Avg</span>
                  <span
                    className={`text-base font-bold tabular-nums ${
                      trend.diffFromAvg <= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {trend.diffFromAvg <= 0 ? '' : '+'}
                    ${trend.diffFromAvg.toFixed(2)} ({trend.diffFromAvgPercent}%)
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    {trend.diffFromAvg <= 0 ? 'Below avg' : 'Above avg'}
                  </span>
                </div>
              </div>

              {/* Interactive Trend Chart */}
              <div className="bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Price Fluctuations (Past 30 Days)
                    </span>
                    <span className="text-[11px] text-zinc-400 hidden sm:inline">
                      Hover points for daily price
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-0.5 bg-emerald-500 rounded" />
                      <span>Price Line</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-0.5 border-t border-dashed border-zinc-400" />
                      <span>30-Day Avg (${trend.thirtyDayAvg.toFixed(2)})</span>
                    </div>
                  </div>
                </div>

                {/* SVG Visual */}
                <div className="relative w-full aspect-[2.6/1]">
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full h-full overflow-visible"
                  >
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Average Reference Line */}
                    <line
                      x1={paddingX}
                      y1={avgY}
                      x2={chartWidth - paddingX}
                      y2={avgY}
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      className="text-zinc-400/80 dark:text-zinc-500/80"
                    />

                    {/* Area under line */}
                    <path d={areaD} fill="url(#trendGradient)" />

                    {/* Price Trend Line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Data Points */}
                    {points.map((p) => {
                      const isHovered = hoveredPointIndex === p.index;
                      const isToday = p.index === points.length - 1;
                      const isLow = p.pt.isLowest;

                      return (
                        <g key={p.index}>
                          {/* Invisible hover hotspot */}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="12"
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredPointIndex(p.index)}
                            onMouseLeave={() => setHoveredPointIndex(null)}
                          />

                          {/* Visible point */}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isHovered ? 6 : isToday || isLow ? 4 : 2.5}
                            className={`transition-all duration-150 pointer-events-none ${
                              isHovered
                                ? 'fill-emerald-500 stroke-white dark:stroke-zinc-900 stroke-2'
                                : isToday
                                ? 'fill-emerald-600 stroke-white dark:stroke-zinc-900 stroke-2'
                                : isLow
                                ? 'fill-amber-500 stroke-white dark:stroke-zinc-900 stroke-1'
                                : 'fill-emerald-600/80'
                            }`}
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Tooltip */}
                  {hoveredPoint && (
                    <div
                      className="absolute pointer-events-none bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-2.5 py-1.5 rounded-lg text-xs shadow-xl border border-zinc-700 dark:border-zinc-200 z-20 whitespace-nowrap transform -translate-x-1/2 -translate-y-full mb-2"
                      style={{
                        left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                        top: `${(hoveredPoint.y / chartHeight) * 100}%`,
                      }}
                    >
                      <p className="font-bold tabular-nums">${hoveredPoint.pt.price.toFixed(2)}</p>
                      <p className="text-[10px] opacity-75">{hoveredPoint.pt.fullDate}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 pt-2 px-1">
                  <span>30 Days Ago ({history[0]?.date})</span>
                  <span>15 Days Ago</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Today ({history[history.length - 1]?.date})
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500">
              Unable to load historical trend for this product.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition-colors cursor-pointer"
          >
            Close
          </button>

          <a
            href={product.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <span>View Deal on {product.source}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

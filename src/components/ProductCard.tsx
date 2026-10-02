import React, { useState } from 'react';
import { ShoppingProduct } from '../types';
import { ExternalLink, Star, Truck, ShoppingBag, ShieldCheck, LineChart } from 'lucide-react';

interface ProductCardProps {
  product: ShoppingProduct;
  isLowestPrice: boolean;
  rank: number;
  onViewTrend: (product: ShoppingProduct) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isLowestPrice,
  rank,
  onViewTrend,
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`group relative flex flex-col justify-between bg-white dark:bg-zinc-900 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        isLowestPrice
          ? 'border-emerald-500/60 dark:border-emerald-500/50 ring-1 ring-emerald-500/20 shadow-xs'
          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
      }`}
    >
      {/* Top Banner for Lowest Genuine Price or Refurbished Status */}
      {isLowestPrice && !product.isRefurbished ? (
        <div className="absolute -top-3 left-4 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Lowest Brand New Price</span>
          </div>
        </div>
      ) : product.isRefurbished ? (
        <div className="absolute -top-3 left-4 z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 text-[11px] font-semibold rounded-full shadow-2xs">
            <span>Refurbished / Pre-Owned</span>
          </div>
        </div>
      ) : null}

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Retailer Header & Rank */}
        <div className="flex items-center justify-between gap-2 mb-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300 truncate">
            <span className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-600 group-hover:bg-emerald-500 transition-colors shrink-0" />
            <span className="truncate">{product.source}</span>
          </div>
          <span className="text-zinc-400 dark:text-zinc-500 text-[11px] tabular-nums shrink-0">
            #{rank}
          </span>
        </div>

        {/* Thumbnail Showcase */}
        <div className="relative w-full aspect-square sm:aspect-[4/3] bg-zinc-50 dark:bg-zinc-800/50 rounded-lg overflow-hidden flex items-center justify-center p-3 mb-4 border border-zinc-100 dark:border-zinc-800 group-hover:bg-white dark:group-hover:bg-zinc-800/80 transition-colors">
          {product.thumbnail && !imageError ? (
            <img
              src={product.thumbnail}
              alt={product.title}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-600 gap-1.5">
              <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">No preview available</span>
            </div>
          )}
        </div>

        {/* Product Title */}
        <h3
          className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug mb-3 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors"
          title={product.title}
        >
          {product.title}
        </h3>

        {/* Clean Metadata Line (Zero-pill discipline) */}
        <div className="flex items-center flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-4 mt-auto pt-1">
          <span className={`font-medium ${product.isRefurbished ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {product.isRefurbished ? 'Refurbished' : 'Brand New'}
          </span>

          <span className="text-zinc-300 dark:text-zinc-600" aria-hidden="true">·</span>

          {product.rating !== null && product.rating !== undefined && (
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-500 dark:stroke-amber-400" />
              <span className="tabular-nums">{product.rating.toFixed(1)}</span>
              {product.reviews ? (
                <span className="text-zinc-400 dark:text-zinc-500 font-normal">
                  ({product.reviews.toLocaleString()})
                </span>
              ) : null}
            </div>
          )}

          {product.rating && product.delivery ? (
            <span className="text-zinc-300 dark:text-zinc-600" aria-hidden="true">·</span>
          ) : null}

          {product.delivery ? (
            <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
              <Truck className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
              <span className="truncate max-w-[140px]">{product.delivery}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Card Footer: Price & CTA Actions */}
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-zinc-50/75 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 rounded-b-xl flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-medium text-zinc-400 dark:text-zinc-500 tracking-wider">
            Price
          </span>
          <span
            className={`text-lg font-bold tabular-nums tracking-tight ${
              isLowestPrice ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'
            }`}
          >
            {product.price}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onViewTrend(product)}
            className="inline-flex items-center justify-center gap-1 px-2.5 py-2 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 transition-all cursor-pointer shadow-2xs"
            title="View 30-day price trend & deal rating"
          >
            <LineChart className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">30d Trend</span>
          </button>

          <a
            href={product.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              isLowestPrice
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white shadow-xs'
            }`}
            aria-label={`View deal for ${product.title} on ${product.source}`}
          >
            <span>View Deal</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>
        </div>
      </div>
    </div>
  );
};

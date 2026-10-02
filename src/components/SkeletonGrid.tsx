import React from 'react';

export const SkeletonGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 flex flex-col justify-between h-[380px] transition-colors"
        >
          <div>
            {/* Header / Merchant */}
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-24" />
              <div className="h-3 bg-zinc-100 dark:bg-zinc-800/60 rounded w-6" />
            </div>

            {/* Thumbnail Placeholder */}
            <div className="w-full aspect-[4/3] bg-zinc-100 dark:bg-zinc-800 rounded-lg mb-4" />

            {/* Title */}
            <div className="space-y-2 mb-3">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
            </div>

            {/* Meta */}
            <div className="flex items-center gap-2 mt-4">
              <div className="h-3 bg-zinc-100 dark:bg-zinc-800/60 rounded w-16" />
              <div className="h-3 bg-zinc-100 dark:bg-zinc-800/60 rounded w-20" />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-20" />
            <div className="h-8 bg-zinc-300 dark:bg-zinc-700 rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  );
};

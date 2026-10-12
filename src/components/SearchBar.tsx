import React, { useState } from 'react';
import { Search, Loader2, X, Sparkles } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  initialQuery?: string;
}

const POPULAR_QUERIES = [
  'iPhone 15',
  'OnePlus 12',
  'Samsung Galaxy S24',
  'MacBook Air M2',
  'Sony WH-1000XM5',
  'PlayStation 5',
  'boAt Airdopes',
];

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  isLoading,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  const handleChipClick = (term: string) => {
    setQuery(term);
    onSearch(term);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-1 sm:px-0">
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative flex items-center shadow-sm rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus-within:border-zinc-800 dark:focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-800/10 dark:focus-within:ring-zinc-400/10 transition-all p-1.5 sm:p-2 gap-1 sm:gap-2">
          {/* Search Icon */}
          <div className="pl-2 sm:pl-2.5 text-zinc-400 dark:text-zinc-500 flex items-center pointer-events-none shrink-0">
            {isLoading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-zinc-600 dark:text-zinc-300" />
            ) : (
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </div>

          {/* Text Input with min-w-0 flex-1 */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search prices across Indian stores..."
            disabled={isLoading}
            className="flex-1 min-w-0 py-2 sm:py-2.5 px-1.5 text-sm sm:text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 bg-transparent border-0 focus:outline-none focus:ring-0 disabled:opacity-60"
            autoComplete="off"
            spellCheck="false"
          />

          {/* Clear input button (integrated in flex flow, not hardcoded absolute) */}
          {query && !isLoading && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 sm:p-1.5 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
              aria-label="Clear input"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-3 sm:px-5 py-2 sm:py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white disabled:bg-zinc-300 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shadow-xs shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                <span className="hidden sm:inline">Searching...</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Compare Deals</span>
                <span className="sm:hidden">Search</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggested Search Chips */}
      <div className="mt-3 flex items-center flex-wrap gap-1.5 sm:gap-2 text-xs">
        <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1 font-medium mr-0.5 shrink-0">
          <Sparkles className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
          <span>Trending:</span>
        </span>
        {POPULAR_QUERIES.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => handleChipClick(term)}
            disabled={isLoading}
            className="px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 rounded-md transition-colors font-normal cursor-pointer disabled:opacity-50 shrink-0"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Search, Loader2, X, Sparkles } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  initialQuery?: string;
}

const POPULAR_QUERIES = [
  'iPhone 15',
  'Sony WH-1000XM5',
  'PlayStation 5',
  'MacBook Air M3',
  'Nintendo Switch OLED',
  'AirPods Pro 2',
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
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center shadow-sm rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus-within:border-zinc-800 dark:focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-800/10 dark:focus-within:ring-zinc-400/10 transition-all overflow-hidden">
          <div className="pl-4 pr-2 text-zinc-400 dark:text-zinc-500 flex items-center pointer-events-none">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-zinc-600 dark:text-zinc-300" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search live prices across retailers (e.g. iPhone 15, Sony WH-1000XM5)..."
            disabled={isLoading}
            className="w-full py-4 pl-1 pr-12 text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 bg-transparent border-0 focus:outline-none focus:ring-0 disabled:opacity-60"
            autoComplete="off"
            spellCheck="false"
          />

          {query && !isLoading && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-28 p-1.5 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="pr-2 py-2">
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white disabled:bg-zinc-300 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap shadow-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <span>Compare Deals</span>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Suggested Search Chips */}
      <div className="mt-3 flex items-center flex-wrap gap-2 text-xs">
        <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1 font-medium mr-1">
          <Sparkles className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
          Trending:
        </span>
        {POPULAR_QUERIES.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => handleChipClick(term)}
            disabled={isLoading}
            className="px-2.5 py-1 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 rounded-md transition-colors font-normal cursor-pointer disabled:opacity-50"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
};

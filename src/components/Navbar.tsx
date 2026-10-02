import React from 'react';
import { Search, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  onScrollToSearch: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onScrollToSearch,
  isDarkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <button
            onClick={onScrollToSearch}
            className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
            aria-label="PriceScope Home"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 font-bold text-base shadow-sm group-hover:bg-zinc-800 dark:group-hover:bg-white transition-colors">
              <span className="font-['Syne'] tracking-tighter">P$</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-['Syne']">
              PriceScope
            </span>
          </button>
        </div>

        {/* Navigation Zone */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <button
            onClick={onScrollToSearch}
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            Compare Deals
          </button>
        </nav>

        {/* Action Zone: Dark Mode Toggle & Search Action */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700" />
            )}
          </button>

          <button
            onClick={onScrollToSearch}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Prices</span>
          </button>
        </div>
      </div>
    </header>
  );
};

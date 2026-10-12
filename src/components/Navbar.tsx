import React from 'react';
import { Search, Sun, Moon, Server, Sparkles } from 'lucide-react';
import { ServerStatusResponse } from '../types';

interface NavbarProps {
  onScrollToSearch: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  serverStatus: ServerStatusResponse | null;
  onOpenRenderGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onScrollToSearch,
  isDarkMode,
  onToggleDarkMode,
  serverStatus,
  onOpenRenderGuide,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onScrollToSearch}
            className="flex items-center gap-2 text-left group focus:outline-none cursor-pointer shrink-0"
            aria-label="PriceScope Home"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 font-bold text-xs sm:text-sm shadow-sm group-hover:bg-zinc-800 dark:group-hover:bg-white transition-colors">
              <span className="font-['Syne'] tracking-tighter">P₹</span>
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-['Syne']">
              PriceScope
            </span>
          </button>
        </div>

        {/* Navigation & Status Zone */}
        <nav className="hidden md:flex items-center gap-4 text-xs font-medium">
          <button
            onClick={onOpenRenderGuide}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer border border-zinc-200/60 dark:border-zinc-700/60"
            title="View Render Deployment Status & Guide"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                serverStatus?.configured && serverStatus?.geminiConfigured
                  ? 'bg-emerald-500'
                  : serverStatus?.configured
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
            />
            <span className="font-semibold">
              {serverStatus?.configured && serverStatus?.geminiConfigured
                ? 'India Live + Gemini AI'
                : serverStatus?.configured
                ? 'Smart Catalog Active'
                : 'Render Setup Needed'}
            </span>
          </button>
        </nav>

        {/* Action Zone: Dark Mode Toggle & Search Action */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenRenderGuide}
            className="md:hidden inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
            title="Render Setup"
          >
            <Server className="w-3.5 h-3.5" />
            <span>Render</span>
          </button>

          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-1.5 sm:p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search Prices</span>
            <span className="sm:hidden">Search</span>
          </button>
        </div>
      </div>
    </header>
  );
};

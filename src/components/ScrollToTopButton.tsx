import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 280) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll back to top"
      title="Scroll to top"
      className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-11 h-11 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 border border-zinc-700/50 dark:border-zinc-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
    >
      <ArrowUp className="w-5 h-5 stroke-[2.2]" />
    </button>
  );
};

import React from 'react';
import { Fuel, Github } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800/80 px-6 py-8 mt-12 flex flex-col md:flex-row gap-6 items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-950 p-2 rounded-xl">
          <Fuel size={16} />
        </div>
        <div>
          <span className="text-sm font-bold font-display text-slate-850 dark:text-slate-200">
            Premium Petrol Finder
          </span>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            Crafting premium fuel station finders.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <span>© {new Date().getFullYear()} Premium Petrol Finder</span>
        <span>•</span>
        <a 
          href="https://github.com/yashita1309/xp100-finder" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-1 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
        >
          <Github size={14} />
          GitHub Repository
        </a>
      </div>
    </footer>
  );
};

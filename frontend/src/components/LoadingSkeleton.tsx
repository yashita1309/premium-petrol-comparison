import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div 
          key={idx}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[300px] animate-pulse"
        >
          <div>
            {/* Top row */}
            <div className="flex justify-between items-start gap-2 mb-4">
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-20" />
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-12" />
            </div>

            {/* Title */}
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4 mb-3" />

            {/* Address */}
            <div className="space-y-2 mb-6">
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-5/6" />
            </div>

            {/* Price panel */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100/50 dark:border-slate-850/50 mb-4">
              <div className="space-y-1">
                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-12" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" />
              </div>
              <div className="space-y-1">
                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-12" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl flex-1" />
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl flex-1" />
            </div>
            <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
          </div>
        </div>
      ))}
    </div>
  );
};
export default LoadingSkeleton;

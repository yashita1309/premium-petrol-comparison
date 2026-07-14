import React from 'react';
import { Database, AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorCardProps {
  message?: string;
  onRetry: () => void;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  message = 'Failed to connect to the backend services. Please ensure the Express server is running on port 3000.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/35 rounded-3xl shadow-lg">
      <div className="p-4 bg-rose-100 dark:bg-rose-950/30 rounded-2xl text-rose-500 mb-4 animate-bounce">
        <Database size={32} />
      </div>

      <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-200 font-display flex items-center gap-1.5 justify-center mb-2">
        <AlertTriangle size={18} className="text-amber-500" />
        Backend Service Offline
      </h3>

      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
        {message}
      </p>

      <button
        onClick={onRetry}
        className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-rose-600 text-white px-6 py-3 rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
      >
        <RefreshCw size={14} className="animate-spin-hover" />
        Retry Server Connection
      </button>
    </div>
  );
};

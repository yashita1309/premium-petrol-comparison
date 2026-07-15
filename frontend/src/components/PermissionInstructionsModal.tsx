import React from 'react';
import { X, ShieldAlert, RefreshCcw } from 'lucide-react';

interface PermissionInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PermissionInstructionsModal: React.FC<PermissionInstructionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header banner */}
        <div className="bg-gradient-to-r from-amber-500 to-rose-600 px-6 py-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider font-display">
                Location Access Blocked
              </h3>
              <p className="text-[11px] opacity-90 font-medium">
                Here is how to restore precision search
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/15 rounded-xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Instructions Body */}
        <div className="p-6 flex flex-col gap-5 text-slate-600 dark:text-slate-300 text-xs">
          
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200/40 dark:border-rose-900/30 font-medium">
            🔒 <span className="font-bold">Browser Security Rule:</span> Websites are blocked from programmatically prompting you for location once it has been set to "Block". You must manually unblock it using one of the quick steps below.
          </div>

          <div className="flex flex-col gap-4">
            
            {/* Method A (Primary & Easiest in Chrome) */}
            <div className="border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-2xl flex gap-3 items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                A
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1.5">
                  Method 1: Right-Side URL Icon (Recommended)
                </h4>
                <p className="leading-relaxed">
                  In Chrome, look at the **far-right** of your top web address bar (just to the left of the Bookmark Star ⭐). 
                </p>
                <p className="leading-relaxed mt-1 font-semibold text-slate-800 dark:text-slate-200">
                  Click the <span className="text-rose-500 font-bold">Crossed-out Location Pin ∅</span> icon, select <span className="text-emerald-500 font-bold">"Always allow..."</span>, and click <span className="font-bold">Done</span>.
                </p>
              </div>
            </div>

            {/* Method B (Alternative) */}
            <div className="border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-2xl flex gap-3 items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                B
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">
                  Method 2: Left-Side Sliders Icon
                </h4>
                <p className="leading-relaxed">
                  On the **far-left** of the web address bar (next to the website name), click the **Tune / Sliders** icon 🎛️ or lock icon 🔒.
                </p>
                <p className="leading-relaxed mt-1">
                  Find **Location** in the popup menu and toggle the switch to **Allow**.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3 items-center px-2 mt-1">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <p className="font-bold text-slate-800 dark:text-slate-100">
                Click "I Enabled It, Refresh Now" below to load coordinates.
              </p>
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200/50 dark:border-slate-800/80 flex justify-between items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 active:scale-95 transition-all cursor-pointer"
          >
            Close
          </button>
          
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:shadow-lg hover:shadow-rose-500/20 text-white text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCcw size={14} />
            I Enabled It, Refresh Now
          </button>
        </div>

      </div>
    </div>
  );
};

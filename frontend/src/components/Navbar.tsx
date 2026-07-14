import React from 'react';
import { Fuel, Sun, Moon, MapPin, RefreshCw } from 'lucide-react';

interface NavbarProps {
  isDark: boolean;
  toggleTheme: () => void;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  permissionStatus: string;
  onRefreshLocation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isDark,
  toggleTheme,
  latitude,
  longitude,
  city,
  permissionStatus,
  onRefreshLocation,
}) => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 flex flex-wrap items-center justify-between gap-4">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-tr from-amber-500 to-rose-600 p-2.5 rounded-2xl shadow-lg shadow-rose-500/20 text-white animate-pulse">
          <Fuel size={24} />
        </div>
        <div>
          <span className="text-xl font-extrabold font-display bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Premium Petrol Finder
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Discover Premium Fuel Outlets
          </p>
        </div>
      </div>

      {/* Geolocation Info and Controls */}
      <div className="flex items-center flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
          <MapPin size={16} className="text-rose-500 animate-bounce" />
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {city ? `${city}` : latitude && longitude ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : 'No Location Detected'}
          </span>
          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
            permissionStatus === 'granted'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
              : permissionStatus === 'denied'
              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400'
          }`}>
            {permissionStatus}
          </span>
        </div>

        {/* Locate Me button */}
        <button
          onClick={onRefreshLocation}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-rose-500/25 active:scale-95 transition-all cursor-pointer"
          title="Refresh Location"
        >
          <RefreshCw size={14} className="animate-spin-hover" />
          Locate Me
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </nav>
  );
};

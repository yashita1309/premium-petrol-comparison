import React from 'react';
import { MapPin, NavigationOff, Compass, Map } from 'lucide-react';
import { POPULAR_CITIES } from '../utils/cities';
import type { CityCoords } from '../utils/cities';

interface LocationCardProps {
  city: string | null;
  permissionStatus: string;
  onSelectCity: (city: CityCoords) => void;
  onRetry: () => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  city,
  permissionStatus,
  onSelectCity,
  onRetry,
}) => {
  const isBlocked = permissionStatus === 'denied';

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/80 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
      <div className="max-w-md">
        <div className="flex items-center gap-2 mb-2">
          {isBlocked ? (
            <div className="p-2 bg-rose-100 dark:bg-rose-950/30 rounded-xl text-rose-500">
              <NavigationOff size={18} />
            </div>
          ) : (
            <div className="p-2 bg-rose-100 dark:bg-rose-950/30 rounded-xl text-rose-500 animate-pulse">
              <MapPin size={18} />
            </div>
          )}
          <h3 className="font-extrabold text-slate-800 dark:text-slate-200 font-display">
            {isBlocked ? 'Location Permission Denied' : 'Current Location Intelligence'}
          </h3>
        </div>

        {isBlocked ? (
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
            Please enable browser location access for precise real-time distances. In the meantime, select one of the fallback cities below to check nearby prices.
          </p>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
            Your location has been successfully resolved. Prices are calculated dynamically based on your distance. You can select another city to explore premium pricing elsewhere.
          </p>
        )}
      </div>

      {/* Fallback Cities list */}
      <div className="flex flex-col gap-3 w-full md:w-auto min-w-[280px]">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Map size={12} /> Explore Premium Prices In:
        </span>
        <div className="flex flex-wrap gap-2">
          {POPULAR_CITIES.map((c) => (
            <button
              key={c.name}
              onClick={() => onSelectCity(c)}
              className={`px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl text-[11px] font-bold text-slate-600 hover:text-rose-500 dark:text-slate-300 dark:hover:text-rose-400 hover:border-rose-500/50 dark:hover:border-rose-400/50 active:scale-95 transition-all cursor-pointer ${
                city === c.name ? 'border-rose-500 ring-2 ring-rose-500/20 text-rose-500 dark:text-rose-400 dark:border-rose-400' : ''
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {isBlocked && (
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-1.5 w-full mt-2 py-2.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:shadow-lg hover:shadow-rose-500/20 text-white text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
          >
            <Compass size={14} className="animate-spin-hover" />
            Enable / Retry GPS Coordinates
          </button>
        )}
      </div>
    </div>
  );
};

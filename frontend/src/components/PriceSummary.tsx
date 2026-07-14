import React from 'react';
import { Award, Fuel, Percent, Check } from 'lucide-react';
import type { UnifiedStation } from '../types';

interface PriceSummaryProps {
  stations: UnifiedStation[];
}

export const PriceSummary: React.FC<PriceSummaryProps> = ({ stations }) => {
  // Helpers to calculate stats for each brand
  const getBrandStats = (brandName: 'IOCL' | 'HPCL' | 'BPCL' | 'Shell') => {
    const brandStations = stations.filter((s) => s.brand === brandName);

    if (brandName === 'IOCL') {
      const xp95Prices = brandStations
        .map((s) => s.xp95Price)
        .filter((p): p is number => typeof p === 'number' && p > 0);
      const xp100Prices = brandStations
        .map((s) => s.xp100Price)
        .filter((p): p is number => typeof p === 'number' && p > 0);

      return {
        count: brandStations.length,
        lowestXp95: xp95Prices.length > 0 ? Math.min(...xp95Prices) : null,
        lowestXp100: xp100Prices.length > 0 ? Math.min(...xp100Prices) : null,
      };
    } else if (brandName === 'HPCL') {
      const prices = brandStations
        .map((s) => s.power95Price)
        .filter((p): p is number => typeof p === 'number' && p > 0);
      return {
        count: brandStations.length,
        lowest: prices.length > 0 ? Math.min(...prices) : null,
      };
    } else if (brandName === 'BPCL') {
      const prices = brandStations
        .map((s) => s.speedPrice)
        .filter((p): p is number => typeof p === 'number' && p > 0);
      return {
        count: brandStations.length,
        lowest: prices.length > 0 ? Math.min(...prices) : null,
      };
    } else {
      // Shell V-Power
      // Note: Shell prices might be null or dynamic
      const prices = brandStations
        .map((s) => s.premiumFuelPrice)
        .filter((p): p is number => typeof p === 'number' && p > 0);
      return {
        count: brandStations.length,
        lowest: prices.length > 0 ? Math.min(...prices) : null,
      };
    }
  };

  const iocl = getBrandStats('IOCL');
  const hpcl = getBrandStats('HPCL');
  const bpcl = getBrandStats('BPCL');
  const shell = getBrandStats('Shell');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* IndianOil Card */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-slate-900 border border-orange-200/50 dark:border-orange-950/50 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]">
        <div>
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/50 px-2.5 py-1 rounded-lg">
              IndianOil
            </span>
            <Award size={18} className="text-orange-500" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">XP Premium Stations</h4>
        </div>
        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-500 dark:text-slate-400">Lowest XP95:</span>
            <span className="font-extrabold text-orange-600 dark:text-orange-400">
              {iocl.lowestXp95 ? `₹${iocl.lowestXp95.toFixed(2)}` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-500 dark:text-slate-400">Lowest XP100:</span>
            <span className="font-extrabold text-orange-600 dark:text-orange-400">
              {iocl.lowestXp100 ? `₹${iocl.lowestXp100.toFixed(2)}` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between text-xs pt-1 border-t border-orange-200/40 dark:border-orange-950/25">
            <span className="text-slate-400 font-semibold">Total Pumps:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{iocl.count}</span>
          </div>
        </div>
      </div>

      {/* HPCL Card */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-slate-900 border border-blue-200/50 dark:border-blue-950/50 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]">
        <div>
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg">
              HPCL
            </span>
            <Fuel size={18} className="text-blue-500" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Power95 Stations</h4>
        </div>
        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-500 dark:text-slate-400">Lowest Price:</span>
            <span className="font-extrabold text-blue-600 dark:text-blue-400">
              {hpcl.lowest ? `₹${hpcl.lowest.toFixed(2)}` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between text-xs pt-1 border-t border-blue-200/40 dark:border-blue-950/25">
            <span className="text-slate-400 font-semibold">Total Pumps:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{hpcl.count}</span>
          </div>
        </div>
      </div>

      {/* BPCL Card */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-slate-900 border border-emerald-200/50 dark:border-emerald-950/50 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]">
        <div>
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg">
              BPCL
            </span>
            <Percent size={18} className="text-emerald-500" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Speed97 Stations</h4>
        </div>
        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-500 dark:text-slate-400">Lowest Price:</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
              {bpcl.lowest ? `₹${bpcl.lowest.toFixed(2)}` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between text-xs pt-1 border-t border-emerald-200/40 dark:border-emerald-950/25">
            <span className="text-slate-400 font-semibold">Total Pumps:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{bpcl.count}</span>
          </div>
        </div>
      </div>

      {/* Shell Card */}
      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/20 dark:to-slate-900 border border-yellow-200/50 dark:border-yellow-950/50 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]">
        <div>
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-yellow-700 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-950/50 px-2.5 py-1 rounded-lg">
              Shell
            </span>
            <Check size={18} className="text-yellow-500 animate-spin-slow" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">V-Power Stations</h4>
        </div>
        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-500 dark:text-slate-400">Lowest Price:</span>
            <span className="font-extrabold text-yellow-600 dark:text-yellow-500">
              {shell.lowest ? `₹${shell.lowest.toFixed(2)}` : 'See outlet'}
            </span>
          </div>
          <div className="flex justify-between text-xs pt-1 border-t border-yellow-200/40 dark:border-yellow-950/25">
            <span className="text-slate-400 font-semibold">Total Pumps:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{shell.count}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

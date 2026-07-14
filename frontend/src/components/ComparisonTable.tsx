import { useState, useMemo } from 'react';
import { ArrowUpDown, Fuel, ExternalLink, MapPin } from 'lucide-react';
import type { UnifiedStation } from '../types';

interface ComparisonTableProps {
  stations: UnifiedStation[];
  onClose: () => void;
}

type SortColumn = 'brand' | 'distance' | 'price' | 'petrol' | 'diesel';

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ stations, onClose }) => {
  const [sortCol, setSortCol] = useState<SortColumn>('distance');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Filter stations that have a valid premium price or coordinate listing
  const compareData = useMemo(() => {
    return stations.map((s) => {
      // Find the active premium fuel price for unified display
      let premiumPrice: number | null = null;
      let fuelTypeDesc = s.fuelType;

      if (s.brand === 'IOCL') {
        // Show XP100 price if available, otherwise XP95
        if (s.xp100Price && s.xp100Price > 0) {
          premiumPrice = s.xp100Price;
          fuelTypeDesc = 'XP100';
        } else if (s.xp95Price) {
          premiumPrice = s.xp95Price;
          fuelTypeDesc = 'XP95';
        }
      } else if (s.brand === 'HPCL') {
        premiumPrice = s.power95Price ?? null;
      } else if (s.brand === 'BPCL') {
        premiumPrice = s.speedPrice ?? null;
      } else if (s.brand === 'Shell') {
        premiumPrice = s.premiumFuelPrice ?? null;
      }

      return {
        ...s,
        resolvedPremiumPrice: premiumPrice,
        fuelTypeDesc,
      };
    });
  }, [stations]);

  // Sort comparison matrix
  const sortedCompareData = useMemo(() => {
    const sorted = [...compareData];
    sorted.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortCol === 'brand') {
        valA = a.brand;
        valB = b.brand;
      } else if (sortCol === 'distance') {
        valA = a.distance ?? 9999;
        valB = b.distance ?? 9999;
      } else if (sortCol === 'price') {
        valA = a.resolvedPremiumPrice ?? 9999;
        valB = b.resolvedPremiumPrice ?? 9999;
      } else if (sortCol === 'petrol') {
        valA = a.petrolPrice ?? 9999;
        valB = b.petrolPrice ?? 9999;
      } else if (sortCol === 'diesel') {
        valA = a.dieselPrice ?? 9999;
        valB = b.dieselPrice ?? 9999;
      }

      if (valA === valB) return 0;
      const order = sortAsc ? 1 : -1;
      return valA > valB ? order : -order;
    });
    return sorted;
  }, [compareData, sortCol, sortAsc]);

  const toggleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800/80 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Fuel size={20} className="text-rose-500 animate-pulse" />
            <h2 className="text-lg font-extrabold font-display">Premium Price Comparison Matrix</h2>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
          >
            Close Matrix
          </button>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/80 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th 
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 select-none"
                  onClick={() => toggleSort('brand')}
                >
                  <div className="flex items-center gap-1">
                    <span>Brand</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-6 py-4">Fuel Type</th>
                <th className="px-6 py-4">Station Name</th>
                <th 
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 select-none"
                  onClick={() => toggleSort('price')}
                >
                  <div className="flex items-center gap-1">
                    <span>Premium Price</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 select-none"
                  onClick={() => toggleSort('petrol')}
                >
                  <div className="flex items-center gap-1">
                    <span>Petrol Price</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 select-none"
                  onClick={() => toggleSort('diesel')}
                >
                  <div className="flex items-center gap-1">
                    <span>Diesel Price</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 select-none"
                  onClick={() => toggleSort('distance')}
                >
                  <div className="flex items-center gap-1">
                    <span>Distance</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-6 py-4 text-center">Navigate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
              {sortedCompareData.map((row, idx) => (
                <tr 
                  key={`${row.brand}-${row.stationId}-${idx}`}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all"
                >
                  {/* Brand */}
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black ${
                      row.brand === 'IOCL' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400' :
                      row.brand === 'HPCL' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400' :
                      row.brand === 'BPCL' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                      'bg-yellow-100 text-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-500'
                    }`}>
                      {row.brand}
                    </span>
                  </td>

                  {/* Fuel Type */}
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-semibold text-xs">
                    {row.fuelTypeDesc}
                  </td>

                  {/* Station Name */}
                  <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[200px]" title={row.stationName}>
                    {row.stationName}
                  </td>

                  {/* Premium Price */}
                  <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-slate-100">
                    {row.resolvedPremiumPrice ? `₹${row.resolvedPremiumPrice.toFixed(2)}` : <span className="text-slate-400 font-normal">N/A</span>}
                  </td>

                  {/* Petrol Price */}
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-semibold">
                    {row.petrolPrice ? `₹${row.petrolPrice}` : <span className="text-slate-400 font-normal">N/A</span>}
                  </td>

                  {/* Diesel Price */}
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-semibold">
                    {row.dieselPrice ? `₹${row.dieselPrice}` : <span className="text-slate-400 font-normal">N/A</span>}
                  </td>

                  {/* Distance */}
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                    {row.distance !== undefined ? `${row.distance.toFixed(2)} km` : 'N/A'}
                  </td>

                  {/* Navigate */}
                  <td className="px-6 py-4 text-center">
                    <a
                      href={row.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/20 text-xs font-semibold text-slate-400 text-center flex items-center justify-center gap-1 border-t border-slate-100 dark:border-slate-800/80">
          <MapPin size={12} className="text-rose-500 animate-pulse" />
          Showing {compareData.length} stations. Click columns headers to sort.
        </div>
      </div>
    </div>
  );
};

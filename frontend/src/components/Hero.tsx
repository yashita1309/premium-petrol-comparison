import React from 'react';
import { Compass, Info } from 'lucide-react';

interface HeroProps {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  totalStations: number;
  lastUpdated: string;
}

export const Hero: React.FC<HeroProps> = ({
  latitude,
  longitude,
  city,
  totalStations,
  lastUpdated,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white px-8 py-10 shadow-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4 uppercase tracking-wider">
            <Compass size={12} className="animate-spin-slow" /> Premium Fuel Intelligence
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold font-display leading-tight tracking-tight mb-4">
            Compare Premium Petrol Prices Around You
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
            Locate high-octane premium petrol pumps across IndianOil (XP95/100), HPCL, Shell, and BPCL, complete with live coordinates and direct navigations.
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col gap-4 min-w-[280px]">
          <div>
            <h3 className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">Current Coordinates</h3>
            {latitude && longitude ? (
              <div className="font-mono text-sm font-semibold text-slate-200">
                <p>Lat: {latitude.toFixed(6)}</p>
                <p>Lng: {longitude.toFixed(6)}</p>
                {city && <p className="text-amber-400 mt-1 font-sans font-bold">{city}</p>}
              </div>
            ) : (
              <p className="text-slate-400 text-xs">Awaiting location permissions...</p>
            )}
          </div>

          <div className="h-px bg-white/10" />

          <div className="flex justify-between items-center text-sm">
            <div>
              <p className="text-slate-400 text-xs font-semibold">Nearby Outlets</p>
              <p className="text-2xl font-black text-white font-display mt-0.5">{totalStations}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold">Pricing Status</p>
              <p className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live
              </p>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
            <Info size={10} />
            <span>Updated: {lastUpdated}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Navigation, 
  MapPin, 
  Phone, 
  Clock, 
  Heart, 
  Share2, 
  Copy, 
  Check, 
  Map 
} from 'lucide-react';
import type { UnifiedStation } from '../types';

interface StationCardProps {
  station: UnifiedStation;
  onToggleFavorite: (id: string, brand: string) => void;
  isFavorite: boolean;
}

export const StationCard: React.FC<StationCardProps> = ({
  station,
  onToggleFavorite,
  isFavorite,
}) => {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [shared, setShared] = useState(false);

  // Clipboard copy handlers
  const handleCopyAddress = () => {
    const fullText = `${station.stationName}, ${station.address || ''}, ${station.city}`;
    navigator.clipboard.writeText(fullText);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCopyCoords = () => {
    const coords = `${station.latitude},${station.longitude}`;
    navigator.clipboard.writeText(coords);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const handleShare = () => {
    const shareText = `Check out ${station.stationName} in ${station.city} serving premium petrol. Coordinates: ${station.latitude}, ${station.longitude}`;
    if (navigator.share) {
      navigator.share({
        title: station.stationName,
        text: shareText,
        url: station.googleMapsUrl || window.location.href,
      }).catch((e) => console.log('Share aborted', e));
    } else {
      navigator.clipboard.writeText(shareText + ' ' + (station.googleMapsUrl || ''));
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  // Brand-specific style configurations
  const getBrandConfig = () => {
    switch (station.brand) {
      case 'IOCL':
        return {
          pill: 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200/50 dark:border-orange-900/35',
          border: 'hover:border-orange-500/40 dark:hover:border-orange-500/30',
          gradient: 'from-orange-500 to-amber-600',
        };
      case 'HPCL':
        return {
          pill: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/35',
          border: 'hover:border-blue-500/40 dark:hover:border-blue-500/30',
          gradient: 'from-blue-600 to-cyan-600',
        };
      case 'BPCL':
        return {
          pill: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/35',
          border: 'hover:border-emerald-500/40 dark:hover:border-emerald-500/30',
          gradient: 'from-emerald-600 to-teal-600',
        };
      case 'Shell':
        return {
          pill: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-500 border border-yellow-200/50 dark:border-yellow-900/35',
          border: 'hover:border-yellow-500/40 dark:hover:border-yellow-500/30',
          gradient: 'from-red-500 to-yellow-500',
        };
    }
  };

  const brandStyle = getBrandConfig();

  return (
    <div className={`relative flex flex-col justify-between bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm hover:shadow-xl dark:shadow-none border border-slate-100 dark:border-slate-800/80 transition-all duration-300 ${brandStyle.border} group`}>
      <div>
        {/* Top Header Row */}
        <div className="flex justify-between items-start gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg ${brandStyle.pill}`}>
              {station.brand}
            </span>
            {station.distance !== undefined && (
              <span className="text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg">
                {station.distance.toFixed(1)} km lat-long
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Share button */}
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title={shared ? 'Share text copied!' : 'Share Station'}
            >
              {shared ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
            </button>

            {/* Favorite button */}
            <button
              onClick={() => onToggleFavorite(station.stationId, station.brand)}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                isFavorite
                  ? 'text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Station Name */}
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-rose-500 transition-all">
          {station.stationName}
        </h3>

        {/* Address */}
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 flex items-start gap-1">
          <MapPin size={12} className="shrink-0 mt-0.5 text-slate-400" />
          <span>{station.address || 'Address not listed'}</span>
        </p>

        {/* Dynamic price panel based on brand */}
        <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50 mb-4">
          {station.brand === 'IOCL' && (
            <>
              {/* XP95 */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">XP95 Price</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                  {station.xp95Price ? `₹${station.xp95Price.toFixed(2)}` : 'N/A'}
                </span>
              </div>
              {/* XP100 */}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">XP100 Price</span>
                {station.xp100Price && station.xp100Price > 0 ? (
                  <span className="text-sm font-black text-rose-500 dark:text-rose-400">
                    ₹{station.xp100Price.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-200/80 dark:bg-slate-800/80 dark:text-slate-500 px-1.5 py-0.5 rounded-md mt-1 w-max">
                    XP100 Not Available
                  </span>
                )}
              </div>
            </>
          )}

          {station.brand === 'HPCL' && (
            <>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Power95</span>
                <span className="text-sm font-black text-blue-500 dark:text-blue-400">
                  {station.power95Price ? `₹${station.power95Price.toFixed(2)}` : 'N/A'}
                </span>
              </div>
              {station.turboJetPrice && (
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">TurboJet</span>
                  <span className="text-sm font-black text-cyan-600 dark:text-cyan-400">
                    ₹{station.turboJetPrice.toFixed(2)}
                  </span>
                </div>
              )}
            </>
          )}

          {station.brand === 'BPCL' && (
            <div className="flex flex-col col-span-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Speed97 Price</span>
              <span className="text-sm font-black text-emerald-500 dark:text-emerald-400">
                {station.speedPrice ? `₹${station.speedPrice.toFixed(2)}` : 'N/A'}
              </span>
            </div>
          )}

          {station.brand === 'Shell' && (
            <div className="flex flex-col col-span-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">V-Power Petrol</span>
              <span className="text-sm font-black text-yellow-600 dark:text-yellow-400">
                {station.premiumFuelPrice ? `₹${station.premiumFuelPrice.toFixed(2)}` : 'Varies'}
              </span>
            </div>
          )}

          {/* Regular Fuels Row */}
          <div className="flex justify-between col-span-2 pt-2 border-t border-slate-200/50 dark:border-slate-800 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            <span>Petrol: <strong className="text-slate-700 dark:text-slate-300">{station.petrolPrice ? `₹${station.petrolPrice}` : 'N/A'}</strong></span>
            <span>Diesel: <strong className="text-slate-700 dark:text-slate-300">{station.dieselPrice ? `₹${station.dieselPrice}` : 'N/A'}</strong></span>
          </div>
        </div>

        {/* Station Metadata (Timings, Phone, Amenities) */}
        <div className="flex flex-col gap-1.5 mb-6 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
          {station.openingHours && (
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-slate-400" />
              <span>{station.openingHours}</span>
            </div>
          )}
          {station.phone && (
            <div className="flex items-center gap-1.5">
              <Phone size={12} className="text-slate-400" />
              <span>{station.phone}</span>
            </div>
          )}
          {/* Shell Amenities */}
          {station.brand === 'Shell' && station.amenities && station.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {station.amenities.slice(0, 3).map((amenity) => (
                <span 
                  key={amenity} 
                  className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase"
                >
                  {amenity.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Copy Actions / Action Buttons */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center gap-2">
          {/* Copy Address */}
          <button
            onClick={handleCopyAddress}
            className="flex items-center justify-center gap-1 flex-1 py-2 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-800/80 transition-all cursor-pointer"
          >
            {copiedAddress ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            <span>{copiedAddress ? 'Address Copied' : 'Copy Address'}</span>
          </button>

          {/* Copy Coords */}
          <button
            onClick={handleCopyCoords}
            className="flex items-center justify-center gap-1 flex-1 py-2 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-800/80 transition-all cursor-pointer"
          >
            {copiedCoords ? <Check size={12} className="text-emerald-500" /> : <Map size={12} />}
            <span>{copiedCoords ? 'Coords Copied' : 'Copy Coords'}</span>
          </button>
        </div>

        {/* Main Map Navigation Link */}
        <a
          href={station.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-2 w-full py-3 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all active:scale-98 bg-gradient-to-r ${brandStyle.gradient} hover:shadow-${station.brand === 'Shell' ? 'red' : 'blue'}-500/25`}
        >
          <Navigation size={14} className="animate-pulse" />
          Open in Google Maps
        </a>
      </div>
    </div>
  );
};

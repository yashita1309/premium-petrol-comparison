import { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FilterBar } from './components/FilterBar';
import { PriceSummary } from './components/PriceSummary';
import { LocationCard } from './components/LocationCard';
import { StationCard } from './components/StationCard';
import { ComparisonTable } from './components/ComparisonTable';
import { ErrorCard } from './components/ErrorCard';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { Footer } from './components/Footer';
import { useGeolocation } from './hooks/useGeolocation';
import { useTheme } from './hooks/useTheme';
import { PetrolFinderAPI } from './services/api';
import type { UnifiedStation } from './types';
import type { CityCoords } from './utils/cities';
import { Heart, Table } from 'lucide-react';


export default function App() {
  const { toggleTheme, isDark } = useTheme();
  const { latitude, longitude, city, permissionStatus, retry, setCustomLocation } = useGeolocation();

  // Search, filter, sorting, compare state
  const [search, setSearch] = useState('');
  const [radius, setRadius] = useState(10);
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'name'>('distance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showComparison, setShowComparison] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Data fetching and UI status state
  const [stations, setStations] = useState<UnifiedStation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  // Favorites state (stored in localStorage)
  const [favorites, setFavorites] = useState<{ id: string; brand: string }[]>(() => {
    try {
      const saved = localStorage.getItem('premium_petrol_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save favorites when state changes
  useEffect(() => {
    localStorage.setItem('premium_petrol_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const handleToggleFavorite = (id: string, brand: string) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === id && f.brand === brand);
      if (exists) {
        return prev.filter((f) => !(f.id === id && f.brand === brand));
      } else {
        return [...prev, { id, brand }];
      }
    });
  };

  // Debounced search term
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Main data fetcher
  const loadData = useCallback(async () => {
    // If coords are not loaded yet, wait
    const targetLat = latitude ?? 28.6139; // fallback to Delhi if location is denied/prompt
    const targetLng = longitude ?? 77.2090;

    setIsLoading(true);
    setIsError(false);

    try {
      // 1. Run health check first
      await PetrolFinderAPI.checkHealth();

      // 2. Fetch full lists from endpoints (with search filter)
      const [allIocl, allHpcl, allBpcl, allShell] = await Promise.all([
        PetrolFinderAPI.getIOCLStations({ search: debouncedSearch }),
        PetrolFinderAPI.getHPCLStations({ search: debouncedSearch }),
        PetrolFinderAPI.getBPCLStations({ search: debouncedSearch }),
        PetrolFinderAPI.getShellStations({ search: debouncedSearch }),
      ]);

      // 3. Fetch nearby lists containing computed distances
      const [nearbyIocl, nearbyHpcl, nearbyBpcl, nearbyShell] = await Promise.all([
        PetrolFinderAPI.getIOCLNearbyStations({ lat: targetLat, lng: targetLng, radius }),
        PetrolFinderAPI.getHPCLNearbyStations({ lat: targetLat, lng: targetLng, radius }),
        PetrolFinderAPI.getBPCLNearbyStations({ lat: targetLat, lng: targetLng, radius }),
        PetrolFinderAPI.getShellNearbyStations({ lat: targetLat, lng: targetLng, radius }),
      ]);

      // 4. Consolidate and merge datasets
      const consolidated: UnifiedStation[] = [];

      // A. IOCL Merge
      for (const nearby of nearbyIocl) {
        const full = allIocl.find((s) => s.roCode === nearby.roCode);
        if (full) {
          consolidated.push({
            brand: 'IOCL',
            fuelType: full.fuelType || 'XP95/XP100',
            stationId: full.roCode,
            stationName: full.stationName,
            address: full.address || 'Address Not Available',
            city: full.city,
            state: full.state || 'Unknown',
            phone: full.phone,
            latitude: full.latitude,
            longitude: full.longitude,
            distance: nearby.distance,
            googleMapsUrl: full.googleMapsUrl,
            openingHours: full.openingHours,
            petrolPrice: full.petrolPrice,
            dieselPrice: full.dieselPrice,
            xp95Price: full.xp95Price,
            xp100Price: full.xp100Price,
            premiumFuelPrice: full.xp100Price && full.xp100Price > 0 ? full.xp100Price : full.xp95Price,
            stateOffice: full.stateOffice,
            divisionalOffice: full.divisionalOffice,
            salesArea: full.salesArea,
            stationUrl: full.stationUrl,
          });
        }
      }

      // B. HPCL Merge
      for (const nearby of nearbyHpcl) {
        const full = allHpcl.find((s) => s.roCode === nearby.roCode || s.stationName === nearby.stationName);
        consolidated.push({
          brand: 'HPCL',
          fuelType: 'Power95',
          stationId: full?.roCode || nearby.roCode || 'HPCL-' + nearby.stationName,
          stationName: nearby.stationName,
          address: full?.address || 'Address Not Available',
          city: nearby.city,
          state: nearby.state || 'Unknown',
          phone: full?.phone || null,
          latitude: nearby.latitude,
          longitude: nearby.longitude,
          distance: nearby.distance,
          googleMapsUrl: nearby.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${nearby.latitude},${nearby.longitude}`,
          openingHours: full?.openingHours || 'Open 06:00 AM - 11:00 PM',
          petrolPrice: nearby.petrolPrice,
          dieselPrice: nearby.dieselPrice,
          power95Price: nearby.power95Price,
          turboJetPrice: nearby.turboJetPrice,
          premiumFuelPrice: nearby.power95Price,
          stateOffice: full?.stateOffice,
          divisionalOffice: full?.divisionalOffice,
          salesArea: full?.salesArea,
          stationUrl: nearby.stationUrl,
        });
      }

      // C. BPCL Merge
      for (const nearby of nearbyBpcl) {
        const full = allBpcl.find((s) => s.roId === nearby.roId);
        consolidated.push({
          brand: 'BPCL',
          fuelType: 'Speed97',
          stationId: nearby.roId,
          stationName: nearby.stationName,
          address: full?.address || 'Address Not Available',
          city: nearby.city,
          state: nearby.state || 'Unknown',
          phone: full?.phone || null,
          latitude: nearby.latitude,
          longitude: nearby.longitude,
          distance: nearby.distance,
          googleMapsUrl: nearby.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${nearby.latitude},${nearby.longitude}`,
          openingHours: full?.openingHours || null,
          petrolPrice: nearby.petrolPrice,
          dieselPrice: nearby.dieselPrice,
          speedPrice: nearby.speedPrice,
          premiumFuelPrice: nearby.speedPrice,
        });
      }

      // D. Shell Merge
      for (const nearby of nearbyShell) {
        const full = allShell.find((s) => s.stationId === nearby.roCode);
        consolidated.push({
          brand: 'Shell',
          fuelType: 'V-Power',
          stationId: nearby.roCode || 'Shell-' + nearby.stationName,
          stationName: nearby.stationName,
          address: full?.address || 'Address Not Available',
          city: nearby.city,
          state: nearby.state || 'Unknown',
          phone: full?.phone || null,
          latitude: nearby.latitude,
          longitude: nearby.longitude,
          distance: nearby.distance,
          googleMapsUrl: nearby.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${nearby.latitude},${nearby.longitude}`,
          openingHours: full?.openingHours || 'Open 06:00 AM - 11:00 PM',
          petrolPrice: full?.petrolPrice || null,
          dieselPrice: full?.dieselPrice || null,
          premiumFuelPrice: full?.xp95Price || null, // Shell uses cached premium petrol price
          fuels: full?.fuels,
          amenities: full?.amenities,
        });
      }

      setStations(consolidated);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error: any) {
      console.error('[App] Failed loading data:', error);
      setIsError(true);
      setErrorMessage(error.message || 'Server connectivity issues.');
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, radius, debouncedSearch]);

  // Load data immediately on coordinates update
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter & Sort station results
  const filteredAndSortedStations = useMemo(() => {
    // 1. Filter by brand
    let results = stations;
    if (selectedBrand !== 'All') {
      results = results.filter((s) => s.brand === selectedBrand);
    }

    // 2. Filter by favorites
    if (showFavoritesOnly) {
      results = results.filter((s) =>
        favorites.some((f) => f.id === s.stationId && f.brand === s.brand)
      );
    }

    // 3. Sort
    return [...results].sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortBy === 'distance') {
        valA = a.distance ?? 9999;
        valB = b.distance ?? 9999;
      } else if (sortBy === 'price') {
        valA = a.premiumFuelPrice ?? 9999;
        valB = b.premiumFuelPrice ?? 9999;
      } else if (sortBy === 'name') {
        valA = a.stationName;
        valB = b.stationName;
      }

      if (valA === valB) return 0;
      const orderSign = sortOrder === 'desc' ? -1 : 1;
      return valA > valB ? orderSign : -orderSign;
    });
  }, [stations, selectedBrand, sortBy, sortOrder, showFavoritesOnly, favorites]);

  // Split unified list back into separate components for layout groups
  const ioclStations = useMemo(
    () => filteredAndSortedStations.filter((s) => s.brand === 'IOCL'),
    [filteredAndSortedStations]
  );
  const hpclStations = useMemo(
    () => filteredAndSortedStations.filter((s) => s.brand === 'HPCL'),
    [filteredAndSortedStations]
  );
  const bpclStations = useMemo(
    () => filteredAndSortedStations.filter((s) => s.brand === 'BPCL'),
    [filteredAndSortedStations]
  );
  const shellStations = useMemo(
    () => filteredAndSortedStations.filter((s) => s.brand === 'Shell'),
    [filteredAndSortedStations]
  );

  const handleSelectCity = (c: CityCoords) => {
    setCustomLocation(c.lat, c.lng, c.name);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      {/* Top Navbar */}
      <Navbar
        isDark={isDark}
        toggleTheme={toggleTheme}
        latitude={latitude}
        longitude={longitude}
        city={city}
        permissionStatus={permissionStatus}
        onRefreshLocation={retry}
      />

      {/* Main Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Connection Offline view */}
        {isError ? (
          <div className="my-12">
            <ErrorCard message={errorMessage} onRetry={loadData} />
          </div>
        ) : (
          <>
            {/* Intro Hero Section */}
            <Hero
              latitude={latitude}
              longitude={longitude}
              city={city}
              totalStations={stations.length}
              lastUpdated={lastUpdated || 'Never'}
            />

            {/* Geolocation Card (Explains block fallback state) */}
            <LocationCard
              city={city}
              permissionStatus={permissionStatus}
              onSelectCity={handleSelectCity}
              onRetry={retry}
            />

            {/* Analytics summary rows */}
            <PriceSummary stations={stations} />

            {/* Sticky Filtering controls */}
            <FilterBar
              search={search}
              setSearch={setSearch}
              radius={radius}
              setRadius={setRadius}
              selectedBrand={selectedBrand}
              setSelectedBrand={setSelectedBrand}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
            />

            {/* Matrix comparison button */}
            <div className="flex gap-3 justify-end items-center flex-wrap">
              {/* Toggle Favorites list */}
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border active:scale-95 cursor-pointer ${
                  showFavoritesOnly
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Heart size={14} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
                {showFavoritesOnly ? 'Showing Favorites' : 'Favorites Only'}
              </button>

              {/* Toggle Comparison matrix */}
              <button
                onClick={() => setShowComparison(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-slate-900/10 dark:shadow-none hover:bg-slate-800 dark:hover:bg-slate-50 hover:shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <Table size={14} />
                Compare Prices
              </button>
            </div>

            {/* Compare Prices Modal */}
            {showComparison && (
              <ComparisonTable
                stations={filteredAndSortedStations}
                onClose={() => setShowComparison(false)}
              />
            )}

            {/* Main Outlet sections loading */}
            {isLoading ? (
              <div className="space-y-12 my-6">
                <div>
                  <div className="h-6 w-48 bg-slate-200 dark:bg-slate-850 rounded mb-4" />
                  <LoadingSkeleton />
                </div>
                <div>
                  <div className="h-6 w-48 bg-slate-200 dark:bg-slate-850 rounded mb-4" />
                  <LoadingSkeleton />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-12">
                {/* 1. INDIANOIL XP PREMIUM */}
                {(selectedBrand === 'All' || selectedBrand === 'IOCL') && (
                  <section className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800/80 pb-3">
                      <div className="bg-orange-500 text-white p-1.5 rounded-lg text-xs font-black">IOC</div>
                      <h2 className="text-xl font-extrabold font-display text-slate-900 dark:text-slate-100">
                        IndianOil XP Premium Outlets
                      </h2>
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full ml-1">
                        {ioclStations.length}
                      </span>
                    </div>

                    {ioclStations.length === 0 ? (
                      <div className="bg-slate-50 dark:bg-slate-900/30 p-8 rounded-3xl text-center text-xs text-slate-400 font-semibold border border-dashed border-slate-200 dark:border-slate-800">
                        No premium petrol stations found nearby.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {ioclStations.map((st) => (
                          <StationCard
                            key={'IOCL-' + st.stationId}
                            station={st}
                            isFavorite={favorites.some((f) => f.id === st.stationId && f.brand === 'IOCL')}
                            onToggleFavorite={handleToggleFavorite}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* 2. HPCL POWER95 */}
                {(selectedBrand === 'All' || selectedBrand === 'HPCL') && (
                  <section className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800/80 pb-3">
                      <div className="bg-blue-600 text-white p-1.5 rounded-lg text-xs font-black">HP</div>
                      <h2 className="text-xl font-extrabold font-display text-slate-900 dark:text-slate-100">
                        HPCL Power95 Outlets
                      </h2>
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full ml-1">
                        {hpclStations.length}
                      </span>
                    </div>

                    {hpclStations.length === 0 ? (
                      <div className="bg-slate-50 dark:bg-slate-900/30 p-8 rounded-3xl text-center text-xs text-slate-400 font-semibold border border-dashed border-slate-200 dark:border-slate-800">
                        No premium petrol stations found nearby.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {hpclStations.map((st) => (
                          <StationCard
                            key={'HPCL-' + st.stationId}
                            station={st}
                            isFavorite={favorites.some((f) => f.id === st.stationId && f.brand === 'HPCL')}
                            onToggleFavorite={handleToggleFavorite}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* 3. BPCL SPEED97 */}
                {(selectedBrand === 'All' || selectedBrand === 'BPCL') && (
                  <section className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800/80 pb-3">
                      <div className="bg-emerald-600 text-white p-1.5 rounded-lg text-xs font-black">BP</div>
                      <h2 className="text-xl font-extrabold font-display text-slate-900 dark:text-slate-100">
                        BPCL Speed97 Outlets
                      </h2>
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full ml-1">
                        {bpclStations.length}
                      </span>
                    </div>

                    {bpclStations.length === 0 ? (
                      <div className="bg-slate-50 dark:bg-slate-900/30 p-8 rounded-3xl text-center text-xs text-slate-400 font-semibold border border-dashed border-slate-200 dark:border-slate-800">
                        No premium petrol stations found nearby.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {bpclStations.map((st) => (
                          <StationCard
                            key={'BPCL-' + st.stationId}
                            station={st}
                            isFavorite={favorites.some((f) => f.id === st.stationId && f.brand === 'BPCL')}
                            onToggleFavorite={handleToggleFavorite}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* 4. SHELL V-POWER */}
                {(selectedBrand === 'All' || selectedBrand === 'Shell') && (
                  <section className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800/80 pb-3">
                      <div className="bg-yellow-500 text-slate-900 p-1.5 rounded-lg text-xs font-black">SH</div>
                      <h2 className="text-xl font-extrabold font-display text-slate-900 dark:text-slate-100">
                        Shell V-Power Outlets
                      </h2>
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full ml-1">
                        {shellStations.length}
                      </span>
                    </div>

                    {shellStations.length === 0 ? (
                      <div className="bg-slate-50 dark:bg-slate-900/30 p-8 rounded-3xl text-center text-xs text-slate-400 font-semibold border border-dashed border-slate-200 dark:border-slate-800">
                        No premium petrol stations found nearby.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {shellStations.map((st) => (
                          <StationCard
                            key={'Shell-' + st.stationId}
                            station={st}
                            isFavorite={favorites.some((f) => f.id === st.stationId && f.brand === 'Shell')}
                            onToggleFavorite={handleToggleFavorite}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

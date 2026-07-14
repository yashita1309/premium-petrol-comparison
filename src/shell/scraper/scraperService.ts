import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import { ShellStation, ShellScraperStats } from '../types/station';

dotenv.config();

const BASE_API_URL = 'https://shellretaillocator.geoapp.me/api/v2/locations/nearest_to';
const DEFAULT_OUTPUT_PATH = path.resolve(process.cwd(), 'data/shellPremiumPetrol.json');

// Default search grids for major cities to compile a wide dataset
const DEFAULT_GRIDS = [
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { name: 'Delhi', lat: 28.6139, lng: 77.209 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
];

/**
 * Normalizes scraped text fields: trims and compresses multiple spaces.
 */
function cleanField(val: string): string {
  if (!val) return '';
  return val.trim().replace(/\s+/g, ' ');
}

/**
 * Directly queries Shell's backend nearest_to JSON API.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchShellApi(lat: number, lng: number, limit = 50): Promise<any[]> {
  try {
    const url = `${BASE_API_URL}?lat=${lat}&lng=${lng}&limit=${limit}&with_any[fuel_type][]=conventional&with_any[fuel_type][]=ev&locale=en_IN&format=json&driving_distances=false`;
    console.log(`[Shell API] Querying: lat=${lat}, lng=${lng}, limit=${limit}`);

    const res = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      timeout: 10000,
    });

    if (res.data && Array.isArray(res.data.locations)) {
      return res.data.locations;
    }
    return [];
  } catch (error) {
    console.error(
      `[Shell API] Request failed for coordinates ${lat}, ${lng}: ${(error as Error).message}`,
    );
    return [];
  }
}

/**
 * Scrapes and formats Shell stations near specified coordinates.
 */
export async function scrapeNearbyShellStations(
  lat: number,
  lng: number,
  limit = 50,
): Promise<ShellStation[]> {
  const locations = await fetchShellApi(lat, lng, limit);
  const stations: ShellStation[] = [];

  for (const loc of locations) {
    try {
      if (loc.lat === undefined || loc.lng === undefined || loc.lat === null || loc.lng === null) {
        console.warn(
          `[Shell Scraper] Location ${loc.id || 'unknown'} skipped: Missing coordinates.`,
        );
        continue;
      }

      const stationLat = parseFloat(loc.lat);
      const stationLng = parseFloat(loc.lng);
      if (isNaN(stationLat) || isNaN(stationLng)) {
        console.warn(`[Shell Scraper] Location ${loc.id} skipped: Invalid coordinates format.`);
        continue;
      }

      // Check if station has premium gasoline/petrol
      const fuelsList = loc.fuels || [];
      const hasPremiumPetrol = fuelsList.some((f: string) => {
        const fuelLower = f.toLowerCase();
        return (
          fuelLower === 'premium_gasoline' ||
          fuelLower === 'premium_petrol' ||
          fuelLower === 'premium gasoline' ||
          fuelLower.includes('v-power') ||
          fuelLower.includes('vpower')
        );
      });

      if (!hasPremiumPetrol) {
        // Discard stations without Premium Petrol
        continue;
      }

      const stationId = String(loc.id);
      const stationName = cleanField(loc.name);
      const address = cleanField(loc.address);
      const city = cleanField(loc.city);
      const state = cleanField(loc.state) || 'Unknown';
      const postcode = cleanField(loc.postcode);
      const phone = cleanField(loc.telephone);
      const distance = loc.distance !== undefined ? parseFloat(loc.distance) : 0;
      const website = cleanField(loc.website_url);
      const openingHours = cleanField(loc.open_status) || 'Open';
      const amenities = loc.amenities || [];
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${stationLat},${stationLng}`;

      stations.push({
        brand: 'Shell',
        fuelType: 'PremiumPetrol',
        stationId,
        stationName,
        address,
        city,
        state,
        postcode,
        phone,
        latitude: stationLat,
        longitude: stationLng,
        distance,
        website,
        openingHours,
        fuels: fuelsList,
        amenities,
        googleMapsUrl,
        lastUpdated: new Date().toISOString(),
        roCode: stationId,
        stateOffice: state || null,
        divisionalOffice: null,
        salesArea: null,
      });
    } catch (locError) {
      console.error(
        `[Shell Scraper] Error parsing location ${loc.id || 'unknown'}: ${(locError as Error).message}. Continuing...`,
      );
    }
  }

  return stations;
}

/**
 * Runs a coordinate grid search to build a broad Shell Premium Petrol dataset,
 * deduplicates stations, sorts them by distance, and writes output to the JSON database.
 */
export async function scrapeShellDataset(
  grids = DEFAULT_GRIDS,
  outputPath = DEFAULT_OUTPUT_PATH,
): Promise<ShellScraperStats> {
  const startTime = Date.now();
  let totalRows = 0;
  let parsed = 0;
  let skipped = 0;

  console.log(`[Shell Scraper] Initiating search across ${grids.length} grid coordinates...`);

  // Map to hold unique stations by key (stationId)
  const uniqueStations = new Map<string, ShellStation>();

  for (const grid of grids) {
    console.log(`[Shell Scraper] Scrape started for grid: ${grid.name}`);
    try {
      const results = await scrapeNearbyShellStations(grid.lat, grid.lng, 50);
      totalRows += results.length;

      for (const station of results) {
        const key = station.stationId;
        if (!uniqueStations.has(key)) {
          uniqueStations.set(key, station);
          parsed++;
        } else {
          skipped++;
        }
      }
    } catch (gridError) {
      console.error(
        `[Shell Scraper] Grid ${grid.name} scraping failed: ${(gridError as Error).message}. Continuing...`,
      );
    }
  }

  const stationsArray = Array.from(uniqueStations.values());

  // Sort by the API returned distance value ascending (as per requirement 8: "Verify the JSON is sorted by the API distance")
  stationsArray.sort((a, b) => a.distance - b.distance);

  // Ensure output directory exists
  const dirPath = path.dirname(outputPath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(stationsArray, null, 2), 'utf-8');
  console.log(
    `[Shell Scraper] Scrape complete. Saved ${stationsArray.length} Premium Petrol stations to ${outputPath}.`,
  );

  const endTime = Date.now();
  const timeTakenSec = ((endTime - startTime) / 1000).toFixed(1);

  return {
    totalRows,
    parsed,
    skipped,
    timeTaken: `${timeTakenSec}s`,
  };
}

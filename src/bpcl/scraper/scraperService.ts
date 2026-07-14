import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import { BPCLStation, BPCLScraperStats } from '../types/station';

dotenv.config();

const BASE_API_URL = 'https://api.cep.bpcl.in/retail/v2/bpcl/retail/rolocators';
const DEFAULT_OUTPUT_PATH = path.resolve(process.cwd(), 'data/bpcl_speed.json');

// List of 35 seed coordinates covering India exactly as requested
const SEED_LOCATIONS = [
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { name: 'Delhi', lat: 28.6139, lng: 77.209 },
  { name: 'Noida', lat: 28.5355, lng: 77.391 },
  { name: 'Gurgaon', lat: 28.4595, lng: 77.0266 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'Surat', lat: 21.1702, lng: 72.8311 },
  { name: 'Vadodara', lat: 22.3072, lng: 73.1812 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { name: 'Indore', lat: 22.7196, lng: 75.8577 },
  { name: 'Bhopal', lat: 23.2599, lng: 77.4126 },
  { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { name: 'Kanpur', lat: 26.4499, lng: 80.3319 },
  { name: 'Patna', lat: 25.5941, lng: 85.1376 },
  { name: 'Ranchi', lat: 23.3441, lng: 85.3096 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Bhubaneswar', lat: 20.2961, lng: 85.8245 },
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
  { name: 'Vijayawada', lat: 16.5062, lng: 80.648 },
  { name: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
  { name: 'Madurai', lat: 9.9252, lng: 78.1198 },
  { name: 'Kochi', lat: 9.9312, lng: 76.2673 },
  { name: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366 },
  { name: 'Mangalore', lat: 12.9141, lng: 74.856 },
  { name: 'Mysuru', lat: 12.2958, lng: 76.6394 },
  { name: 'Hubli', lat: 15.3647, lng: 75.124 },
  { name: 'Goa', lat: 15.4909, lng: 73.8278 },
  { name: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { name: 'Jammu', lat: 32.7266, lng: 74.857 },
  { name: 'Srinagar', lat: 34.0837, lng: 74.7973 },
  { name: 'Guwahati', lat: 26.1445, lng: 91.7362 },
];

/**
 * Normalizes scraped text fields.
 */
function cleanField(val: string): string {
  if (!val) return '';
  return val.trim().replace(/\s+/g, ' ');
}

/**
 * Directly queries BPCL's backend retail locators API.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchBpclApi(lat: number, lng: number, radius = 10000): Promise<any[]> {
  try {
    const params = {
      latitude: lat,
      longitude: lng,
      radius,
      amenities: 'Pure_Sure',
      fuelStationCategory: 'Pure_Sure',
      channel: 'Web',
      accountId: '',
    };

    const res = await axios.get(BASE_API_URL, {
      params,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      timeout: 15000,
    });

    if (res.data && Array.isArray(res.data.pointOfServices)) {
      return res.data.pointOfServices;
    }
    return [];
  } catch (error) {
    console.error(
      `[BPCL API] Request failed for coordinates ${lat}, ${lng}: ${(error as Error).message}`,
    );
    return [];
  }
}

/**
 * Processes pointOfServices list and extracts SPEED stations.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseBpclStations(posList: any[]): BPCLStation[] {
  const stations: BPCLStation[] = [];

  for (const pos of posList) {
    try {
      if (!pos.roId || !pos.geoPoint) {
        continue;
      }

      const lat = parseFloat(pos.geoPoint.latitude);
      const lng = parseFloat(pos.geoPoint.longitude);
      if (isNaN(lat) || isNaN(lng)) {
        continue;
      }

      const fuels = pos.fuelAvailable || [];
      const pricesList = pos.weekDayFuelPriceList || [];

      // Only keep stations where fuelAvailable contains SPEED or weekDayFuelPriceList contains code == SPEED
      const hasSpeedFuel =
        fuels.includes('SPEED') || pricesList.some((p: { code: string }) => p.code === 'SPEED');

      if (!hasSpeedFuel) {
        continue;
      }

      // Extract prices
      const speedObj = pricesList.find((p: { code: string }) => p.code === 'SPEED');
      const petrolObj = pricesList.find((p: { code: string }) => p.code === 'PETROL');
      const dieselObj = pricesList.find((p: { code: string }) => p.code === 'DIESEL');

      const speedPrice = speedObj ? parseFloat(speedObj.price) : null;
      const petrolPrice = petrolObj ? parseFloat(petrolObj.price) : null;
      const dieselPrice = dieselObj ? parseFloat(dieselObj.price) : null;

      // Skip if speedPrice is missing, to satisfy verification requirement: "every station has a Speed price"
      if (speedPrice === null || isNaN(speedPrice)) {
        continue;
      }

      const roId = cleanField(pos.roId);
      const stationName = cleanField(pos.displayName || pos.name || '');
      const address = cleanField(pos.address?.formattedAddress || '');

      // Clean city parsing: split by comma if present and take the last part
      let city = cleanField(pos.address?.town || pos.address?.district || '');
      if (city.includes(',')) {
        const cityParts = city.split(',');
        city = cleanField(cityParts[cityParts.length - 1]);
      }

      const state = cleanField(pos.address?.region?.name || '');
      const phone = cleanField(pos.telephone || pos.address?.cellphone || '') || null;
      const amenities = pos.amenities || [];
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

      stations.push({
        brand: 'BPCL',
        fuelType: 'Speed',
        roId,
        stationName,
        address,
        city,
        state,
        phone,
        latitude: lat,
        longitude: lng,
        amenities,
        fuelAvailable: fuels,
        speedPrice,
        petrolPrice,
        dieselPrice,
        googleMapsUrl,
        stationUrl: null,
        lastUpdated: new Date().toISOString(),
        stateOffice: null,
        divisionalOffice: null,
        salesArea: null,
      });
    } catch (err) {
      console.error(
        `[BPCL Parser] Error parsing station ${pos.roId || 'unknown'}: ${(err as Error).message}`,
      );
    }
  }

  return stations;
}

/**
 * Runs a dynamic nationwide collection across 35 seed coordinates, merges results,
 * deduplicates by roId, and saves the output list to data/bpcl_speed.json.
 */
export async function scrapeBpclDataset(
  seeds = SEED_LOCATIONS,
  outputPath = DEFAULT_OUTPUT_PATH,
): Promise<BPCLScraperStats> {
  const startTime = Date.now();
  let totalApiRequests = 0;
  let totalStationsFetched = 0;
  let totalDuplicatesRemoved = 0;

  console.log(
    `[BPCL Scraper] Initiating nationwide collection across ${seeds.length} seed cities...`,
  );

  const uniqueStations = new Map<string, BPCLStation>();

  for (const seed of seeds) {
    console.log(`[BPCL Scraper] Call #${totalApiRequests + 1} - Querying seed: ${seed.name}`);
    try {
      const rawPoints = await fetchBpclApi(seed.lat, seed.lng, 10000);
      totalApiRequests++;
      totalStationsFetched += rawPoints.length;

      const parsedList = parseBpclStations(rawPoints);

      for (const station of parsedList) {
        const key = station.roId;
        if (!uniqueStations.has(key)) {
          uniqueStations.set(key, station);
        } else {
          totalDuplicatesRemoved++;
        }
      }
    } catch (err) {
      console.error(`[BPCL Scraper] Seed ${seed.name} failed: ${(err as Error).message}`);
    }
  }

  const finalStations = Array.from(uniqueStations.values());

  // Ensure target folder exists
  const dirPath = path.dirname(outputPath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(finalStations, null, 2), 'utf-8');
  console.log(
    `[BPCL Scraper] Scrape complete. Saved ${finalStations.length} SPEED stations to ${outputPath}.`,
  );

  const endTime = Date.now();
  const timeSec = ((endTime - startTime) / 1000).toFixed(1);

  return {
    totalApiRequests,
    totalStationsFetched,
    totalSpeedStationsFound: finalStations.length,
    totalDuplicatesRemoved,
    finalStationCount: finalStations.length,
    timeTaken: `${timeSec}s`,
  };
}

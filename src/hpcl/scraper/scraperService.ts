import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { HPCLStation, HPCLScraperStats } from '../types/station';

dotenv.config();

const BASE_URL = 'https://petrolpump.hpretail.in/';
const DEFAULT_OUTPUT_PATH = path.resolve(process.cwd(), 'data/hpcl_power95.json');

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
 * Normalizes scraped text fields: trims, compresses multiple spaces, preserves casing, and removes leading '**'.
 */
function cleanField(val: string): string {
  let cleaned = val.trim();
  if (cleaned.startsWith('**')) {
    cleaned = cleaned.substring(2).trim();
  }
  return cleaned.replace(/\s+/g, ' ');
}

/**
 * Scrapes HPCL retail stations near the specified latitude and longitude coordinates.
 */
export async function scrapeNearbyStations(lat: number, lng: number): Promise<HPCLStation[]> {
  const searchUrl = `${BASE_URL}?lat=${lat}&long=${lng}&shared=1`;
  console.log(`[HPCL Scraper] Querying coordinates: lat=${lat}, long=${lng}`);

  const response = await axios.get(searchUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
  });

  const $ = cheerio.load(response.data);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cards = $('.store-info-box') as any;
  const masterOutletId = ($('#jsMasterOutletId').val() as string) || '96681';

  const stations: HPCLStation[] = [];

  // Use a synchronous loops/sequence to avoid overwhelming the site or running into rate limits
  for (let i = 0; i < cards.length; i++) {
    const card = cards.eq(i);
    let stationName = '';
    try {
      stationName = cleanField(card.find('li:has(.icn-outlet) .info-text').text());
      const address = cleanField(card.find('.outlet-address .info-text').text());
      const phone = cleanField(card.find('.outlet-phone .info-text a').text());
      const openingHours = cleanField(card.find('.outlet-timings .info-text').text());

      let stationUrl =
        card.find('.btn-website').attr('href') || card.find('li.outlet-name a').attr('href') || '';
      stationUrl = cleanField(stationUrl);
      if (stationUrl && !stationUrl.startsWith('http')) {
        stationUrl = new URL(stationUrl, BASE_URL).toString();
      }

      const city = cleanField(card.find('.btn-website').attr('data-track-event-city') || '');
      const state = cleanField(card.find('.btn-website').attr('data-track-event-state') || '');

      const latVal = card.find('.outlet-latitude').val() as string;
      const lngVal = card.find('.outlet-longitude').val() as string;

      if (!latVal || !lngVal) {
        console.warn(`[HPCL Scraper] Card ${i + 1} skipped: Coordinates are missing in HTML.`);
        continue;
      }

      const stationLat = parseFloat(latVal);
      const stationLng = parseFloat(lngVal);

      if (isNaN(stationLat) || isNaN(stationLng)) {
        console.warn(`[HPCL Scraper] Card ${i + 1} skipped: Invalid coordinates format.`);
        continue;
      }

      const timingsId = card.find('.outlet-timings').attr('id') || '';
      const outletId = timingsId.replace('storelocater_id_', '');

      if (!outletId) {
        console.warn(`[HPCL Scraper] Card ${i + 1} skipped: Missing timings outlet ID.`);
        continue;
      }

      // Generate Google Maps navigation URL
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${stationLat},${stationLng}`;

      // Fetch Today's Fuel Prices via AJAX endpoint
      const priceUrl = `${BASE_URL}getPetrolPricesForHPCL.php?master_outlet_id=${masterOutletId}&outlet_id=${outletId}`;
      let power95Price: number | null = null;
      let petrolPrice: number | null = null;
      let dieselPrice: number | null = null;
      let turboJetPrice: number | null = null;

      try {
        const priceRes = await axios.get(priceUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest',
          },
          timeout: 5000,
        });

        const $price = cheerio.load(priceRes.data);
        $price('.fule-price-card').each((_, priceCard) => {
          const name = $price(priceCard).find('.fuel_Name').text().trim().toLowerCase();
          const textVal = $price(priceCard).find('.fuel-text').text().trim();
          const priceMatch = textVal.match(/(\d+(?:\.\d+)?)/);
          const price = priceMatch ? parseFloat(priceMatch[1]) : null;

          if (name.includes('power95')) {
            power95Price = price;
          } else if (name.includes('petrol')) {
            petrolPrice = price;
          } else if (name.includes('diesel')) {
            dieselPrice = price;
          } else if (name.includes('turbojet')) {
            turboJetPrice = price;
          }
        });
      } catch (priceError) {
        console.warn(
          `[HPCL Scraper] Could not fetch prices for station ${stationName} (Outlet ID: ${outletId}): ${(priceError as Error).message}`,
        );
      }

      stations.push({
        brand: 'HPCL',
        fuelType: 'Power95',
        roCode: outletId,
        stationName,
        address,
        city,
        state: state || 'Unknown',
        phone,
        latitude: stationLat,
        longitude: stationLng,
        openingHours,
        stationUrl,
        googleMapsUrl,
        power95Price,
        petrolPrice,
        dieselPrice,
        turboJetPrice,
        stateOffice: state || null,
        divisionalOffice: null,
        salesArea: null,
        lastUpdated: new Date().toISOString(),
      });
    } catch (cardError) {
      console.error(
        `[HPCL Scraper] Error parsing card ${i + 1} (${stationName || 'Unknown'}): ${(cardError as Error).message}. Continuing...`,
      );
    }
  }

  return stations;
}

/**
 * Runs a coordinate grid search to build a broad HPCL Power95 dataset,
 * deduplicates stations, and writes output to the JSON database.
 */
export async function scrapeHpclDataset(
  grids = DEFAULT_GRIDS,
  outputPath = DEFAULT_OUTPUT_PATH,
): Promise<HPCLScraperStats> {
  const startTime = Date.now();
  let totalRows = 0;
  let parsed = 0;
  let skipped = 0;

  console.log(`[HPCL Scraper] Initiating search across ${grids.length} grid coordinates...`);

  // Map to hold unique stations by key
  const uniqueStations = new Map<string, HPCLStation>();

  for (const grid of grids) {
    console.log(`[HPCL Scraper] Scrape started for grid: ${grid.name}`);
    try {
      const results = await scrapeNearbyStations(grid.lat, grid.lng);
      totalRows += results.length;

      for (const station of results) {
        // Primary key: stationUrl. Fallback key: stationName + address
        const key = station.stationUrl || `${station.stationName}|${station.address}`;

        // Exclude stations that do not have Power95 premium petrol
        if (station.power95Price === null) {
          skipped++;
          continue;
        }

        if (!uniqueStations.has(key)) {
          uniqueStations.set(key, station);
          parsed++;
        } else {
          skipped++;
        }
      }
    } catch (gridError) {
      console.error(
        `[HPCL Scraper] Grid ${grid.name} scraping failed: ${(gridError as Error).message}. Continuing...`,
      );
    }
  }

  const stationsArray = Array.from(uniqueStations.values());

  // Ensure output directory exists
  const dirPath = path.dirname(outputPath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(stationsArray, null, 2), 'utf-8');
  console.log(
    `[HPCL Scraper] Scrape complete. Saved ${stationsArray.length} Power95 stations to ${outputPath}.`,
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

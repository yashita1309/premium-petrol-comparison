import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import axios from 'axios';
import { fetchHtmlWithChallenge } from '../utils/challengeSolver';
import { Station, ScraperStats } from '../types/station';

dotenv.config();

const URL = process.env.IOCL_XP100_URL || 'https://iocl.com/xp100';
const DEFAULT_OUTPUT_PATH = path.resolve(
  process.cwd(),
  process.env.DATA_FILE_PATH || 'data/xp100_stations.json',
);

/**
 * Trims whitespace, removes leading symbols like "**", replaces multiple spaces with a single space,
 * and preserves original casing.
 */
function cleanField(val: string): string {
  let cleaned = val.trim();
  if (cleaned.startsWith('**')) {
    cleaned = cleaned.substring(2).trim();
  }
  return cleaned.replace(/\s+/g, ' ');
}

/**
 * Scrapes the XP100 petrol pump stations from the official IOCL website.
 * Saves the output to a local JSON file and returns performance statistics.
 */
export async function scrapeXP100Stations(outputPath = DEFAULT_OUTPUT_PATH): Promise<ScraperStats> {
  const startTime = Date.now();
  let totalRows = 0;
  let parsed = 0;
  let skipped = 0;

  console.log(`[Scraper] Starting scrape of ${URL}...`);
  const html = await fetchHtmlWithChallenge(URL);

  const $ = cheerio.load(html);

  // Try table tbody tr, and fall back to checking all trs containing tds if necessary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows = $('table tbody tr') as any;
  if (rows.length === 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rows = $('tr').has('td') as any;
  }

  if (rows.length === 0) {
    throw new Error(
      'Missing table: No rows containing table data could be found on the target webpage.',
    );
  }

  totalRows = rows.length;
  console.log(`[Scraper] Found ${totalRows} table rows to process.`);

  const stations: Station[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows.each((index: number, element: any) => {
    try {
      const cells = $(element).find('td');

      // If table row has fewer cells than columns (9 columns total), we skip or treat as parsing failure
      if (cells.length < 9) {
        console.warn(
          `[Scraper] Row ${index + 1} skipped: Expected at least 9 columns, found ${cells.length}.`,
        );
        skipped++;
        return;
      }

      const stateOffice = cleanField($(cells[1]).text());
      const divisionalOffice = cleanField($(cells[2]).text());
      const salesArea = cleanField($(cells[3]).text());
      const roCode = cleanField($(cells[4]).text());
      const stationName = cleanField($(cells[5]).text());
      const city = cleanField($(cells[6]).text());
      const latStr = $(cells[7]).text().trim();
      const lngStr = $(cells[8]).text().trim();

      // Coordinates validation
      if (!latStr || !lngStr) {
        console.warn(`[Scraper] Row ${index + 1} skipped: Missing latitude or longitude values.`);
        skipped++;
        return;
      }

      const latitude = parseFloat(latStr);
      const longitude = parseFloat(lngStr);

      if (isNaN(latitude) || isNaN(longitude)) {
        console.warn(
          `[Scraper] Row ${index + 1} skipped: Invalid numerical coordinate format (lat: "${latStr}", lng: "${lngStr}").`,
        );
        skipped++;
        return;
      }

      // Check basic coordinate range limits (lat: -90 to 90, lng: -180 to 180)
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        console.warn(
          `[Scraper] Row ${index + 1} skipped: Coordinates out of bounds (lat: ${latitude}, lng: ${longitude}).`,
        );
        skipped++;
        return;
      }

      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

      stations.push({
        roCode,
        stationName,
        stateOffice,
        divisionalOffice,
        salesArea,
        city,
        latitude,
        longitude,
        googleMapsUrl,
      });

      parsed++;
    } catch (rowError) {
      const err = rowError as Error;
      console.error(
        `[Scraper] Unexpected parsing error in row ${index + 1}: ${err.message}. Continuing...`,
      );
      skipped++;
    }
  });

  console.log(
    `[Scraper] Table parsed successfully. Fetching price details for ${stations.length} stations...`,
  );
  const priceCache = new Map<
    string,
    {
      petrolPrice: number | null;
      dieselPrice: number | null;
      xp95Price: number | null;
      xp100Price: number | null;
    }
  >();
  const urlToRoCode = new Map<string, string>();

  // Pre-seed cache from iocl_xp95.json to avoid duplicate lookups
  const xp95Path = path.resolve(process.cwd(), 'data/iocl_xp95.json');
  if (fs.existsSync(xp95Path)) {
    try {
      const xp95Stations = JSON.parse(fs.readFileSync(xp95Path, 'utf-8'));
      if (Array.isArray(xp95Stations)) {
        for (const s of xp95Stations) {
          if (s.roCode) {
            priceCache.set(s.roCode, {
              petrolPrice: s.petrolPrice,
              dieselPrice: s.dieselPrice,
              xp95Price: s.xp95Price,
              xp100Price: s.xp100Price,
            });
            if (s.stationUrl) {
              urlToRoCode.set(s.stationUrl, s.roCode);
            }
          }
        }
        console.log(
          `[Scraper] Pre-seeded price cache with ${priceCache.size} stations and URLs from XP95 database.`,
        );
      }
    } catch (e) {
      // ignore
    }
  }

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  // Utility to check if a URL slug matches target name keywords
  const isUrlMatch = (url: string, name: string): boolean => {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const nameWords = cleanName.split(/\s+/).filter((w) => w.length > 2);
    if (nameWords.length === 0) return true;
    const urlLower = url.toLowerCase();
    return nameWords.every((word) => urlLower.includes(word));
  };

  let count = 0;
  for (const station of stations) {
    count++;
    console.log(
      `[Scraper] Fetching price details ${count}/${stations.length}: ${station.stationName} (RO: ${station.roCode})`,
    );

    const targetRoCode = station.roCode;

    if (priceCache.has(targetRoCode)) {
      const cached = priceCache.get(targetRoCode)!;
      station.petrolPrice = cached.petrolPrice;
      station.dieselPrice = cached.dieselPrice;
      station.xp95Price = cached.xp95Price;
      station.xp100Price = cached.xp100Price;
      continue;
    }

    let petrolPrice: number | null = null;
    let dieselPrice: number | null = null;
    let xp95Price: number | null = null;
    let xp100Price: number | null = null;

    try {
      const searchUrl = `https://locator.iocl.com/?lat=${station.latitude}&long=${station.longitude}&shared=1`;
      const searchRes = await axios.get(searchUrl, { headers, timeout: 15000 });
      const search$ = cheerio.load(searchRes.data);
      const candidateUrls = new Set<string>();

      // Scan anchors
      search$('a').each((_, elem) => {
        const href = search$(elem).attr('href');
        if (href && href.includes('/indianoil-') && href.includes('/Home')) {
          const absolute = href.startsWith('http')
            ? href
            : `https://locator.iocl.com${href.startsWith('/') ? '' : '/'}${href}`;
          candidateUrls.add(absolute);
        }
      });

      // Scan mapInfoWindowContentJsonEncoded
      const infoVal = search$('.mapInfoWindowContentJsonEncoded').val();
      if (infoVal && typeof infoVal === 'string') {
        try {
          const info = JSON.parse(infoVal);
          const htmlStrings = Array.isArray(info) ? info : Object.values(info);
          for (const htmlStr of htmlStrings) {
            if (typeof htmlStr === 'string') {
              const sub$ = cheerio.load(htmlStr);
              sub$('a').each((_, elem) => {
                const href = sub$(elem).attr('href');
                if (href && href.includes('/indianoil-') && href.includes('/Home')) {
                  const absolute = href.startsWith('http')
                    ? href
                    : `https://locator.iocl.com${href.startsWith('/') ? '' : '/'}${href}`;
                  candidateUrls.add(absolute);
                }
              });
            }
          }
        } catch (e) {
          // ignore
        }
      }

      // Prioritize candidate URLs by sorting the ones matching target name keywords to the front
      const sortedCandidates = Array.from(candidateUrls).sort((a, b) => {
        const matchA = isUrlMatch(a, station.stationName) ? 1 : 0;
        const matchB = isUrlMatch(b, station.stationName) ? 1 : 0;
        return matchB - matchA;
      });

      // Check candidate URLs in parallel
      const checkPromises = sortedCandidates.map(async (detailUrl) => {
        try {
          // If we already know the RO code for this URL and it has cached prices, return it immediately
          if (urlToRoCode.has(detailUrl)) {
            const roCode = urlToRoCode.get(detailUrl)!;
            if (priceCache.has(roCode)) {
              return { roCode, outletId: '', masterOutletId: '', detailUrl, isCached: true };
            }
          }

          const detailRes = await axios.get(detailUrl, { headers, timeout: 15000 });
          const detail$ = cheerio.load(detailRes.data);
          const outletId = detail$('#jsOutletId').val() as string;
          const roCode = (detail$('#jsActualClientStoreId').val() || outletId) as string;
          if (!roCode) return null;

          const masterOutletId = (detail$('#jsMasterOutletId').val() || '99528') as string;
          urlToRoCode.set(detailUrl, roCode);

          return { roCode, outletId, masterOutletId, detailUrl, isCached: false };
        } catch (e) {
          return null;
        }
      });

      const detailResults = await Promise.all(checkPromises);
      for (const info of detailResults) {
        if (!info) continue;

        const { roCode, outletId, masterOutletId, detailUrl, isCached } = info;

        if (!priceCache.has(roCode) && !isCached) {
          let currPetrol: number | null = null;
          let currDiesel: number | null = null;
          let currXp95: number | null = null;
          let currXp100: number | null = null;

          if (outletId) {
            try {
              const priceUrl = `https://locator.iocl.com/getPetrolPricesForIOCL.php?master_outlet_id=${masterOutletId}&outlet_id=${outletId}`;
              const priceRes = await axios.get(priceUrl, {
                headers: {
                  ...headers,
                  Referer: detailUrl,
                  'X-Requested-With': 'XMLHttpRequest',
                },
                timeout: 10000,
              });

              const price$ = cheerio.load(priceRes.data);
              price$('.fule-price-card').each((_, card) => {
                const icon = price$(card).find('.fuel-icon');
                const priceText = price$(card).find('.fuel-text').text().trim();
                const priceVal = parseFloat(priceText.replace(/[^\d.]/g, ''));
                if (!isNaN(priceVal)) {
                  if (icon.hasClass('icn-petrol')) currPetrol = priceVal;
                  else if (icon.hasClass('icn-diesel')) currDiesel = priceVal;
                  else if (icon.hasClass('icn-xptwo')) currXp95 = priceVal;
                  else if (icon.hasClass('icn-xp')) currXp100 = priceVal;
                }
              });
            } catch (err: unknown) {
              const error = err as Error;
              console.warn(`[Scraper] Price query failed for ${detailUrl}: ${error.message}`);
            }
          }

          priceCache.set(roCode, {
            petrolPrice: currPetrol,
            dieselPrice: currDiesel,
            xp95Price: currXp95,
            xp100Price: currXp100,
          });
        }

        if (roCode === targetRoCode) {
          const match = priceCache.get(roCode);
          if (match) {
            petrolPrice = match.petrolPrice;
            dieselPrice = match.dieselPrice;
            xp95Price = match.xp95Price;
            xp100Price = match.xp100Price;
          }
          break; // Found the matching station, no need to process other candidates
        }
      }
    } catch (searchErr: unknown) {
      const error = searchErr as Error;
      console.warn(
        `[Scraper] Locator search failed for coordinate (${station.latitude}, ${station.longitude}): ${error.message}`,
      );
    }

    station.petrolPrice = petrolPrice;
    station.dieselPrice = dieselPrice;
    station.xp95Price = xp95Price;
    station.xp100Price = xp100Price;

    await new Promise((r) => setTimeout(r, 200));
  }

  // Ensure target folder exists and write results to JSON output
  const dirPath = path.dirname(outputPath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(stations, null, 2), 'utf-8');
  console.log(`[Scraper] Scrape completed. Saved ${stations.length} stations to ${outputPath}.`);

  const endTime = Date.now();
  const timeTakenSec = ((endTime - startTime) / 1000).toFixed(1);

  return {
    totalRows,
    parsed,
    skipped,
    timeTaken: `${timeTakenSec}s`,
  };
}

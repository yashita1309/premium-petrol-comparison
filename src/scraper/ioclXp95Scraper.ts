import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { IOCLXP95Station } from '../types/station';

const SEED_CITIES = [
  { name: 'Delhi', lat: 28.6139, lng: 77.209 },
  { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { name: 'Patna', lat: 25.5941, lng: 85.1376 },
  { name: 'Bhopal', lat: 23.2599, lng: 77.4126 },
  { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
  { name: 'Kochi', lat: 9.9312, lng: 76.2673 },
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
  { name: 'Guwahati', lat: 26.1445, lng: 91.7362 },
];

const OUTPUT_PATH = path.resolve(process.cwd(), 'data/iocl_xp95.json');

/**
 * Scrapes IOCL stations to discover and compile those that offer XP95 petrol.
 */
export async function scrapeIOCLXP95Stations(): Promise<void> {
  const startTime = Date.now();
  const discoveredUrls = new Set<string>();
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  console.log('[XP95 Scraper] Starting station discovery phase across 15 coordinates...');

  // Phase 1: Discover unique station page URLs
  for (const seed of SEED_CITIES) {
    try {
      const url = `https://locator.iocl.com/?lat=${seed.lat}&long=${seed.lng}&shared=1`;
      const res = await axios.get(url, { headers, timeout: 15000 });
      const $ = cheerio.load(res.data);

      // Scan page anchors
      $('a').each((_, elem) => {
        const href = $(elem).attr('href');
        if (href && href.includes('/indianoil-') && href.includes('/Home')) {
          const absolute = href.startsWith('http')
            ? href
            : `https://locator.iocl.com${href.startsWith('/') ? '' : '/'}${href}`;
          discoveredUrls.add(absolute);
        }
      });

      // Scan mapInfoWindowContentJsonEncoded inputs
      const infoVal = $('.mapInfoWindowContentJsonEncoded').val();
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
                  discoveredUrls.add(absolute);
                }
              });
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.warn(
        `[XP95 Scraper] Discovery warning: Failed to query seed ${seed.name}: ${error.message}`,
      );
    }
    // Sequential pause to respect rate limits
    await new Promise((r) => setTimeout(r, 400));
  }

  const uniqueUrls = Array.from(discoveredUrls);
  console.log(`[XP95 Scraper] Discovery phase done. Found ${uniqueUrls.length} unique candidates.`);

  // Phase 2: Crawl every station page to check details and prices
  let pagesVisited = 0;
  let stationsWithXp95Count = 0;
  let duplicateCount = 0;
  const stationsMap = new Map<string, IOCLXP95Station>();

  for (const stationUrl of uniqueUrls) {
    pagesVisited++;
    console.log(
      `[XP95 Scraper] Visiting station page ${pagesVisited}/${uniqueUrls.length}: ${stationUrl}`,
    );

    try {
      const res = await axios.get(stationUrl, { headers, timeout: 15000 });
      const $ = cheerio.load(res.data);

      const masterOutletId = $('#jsMasterOutletId').val() || '99528';
      const outletId = $('#jsOutletId').val();
      const roCode = ($('#jsActualClientStoreId').val() || outletId) as string;

      if (!outletId) {
        console.warn(`[XP95 Scraper] Missing jsOutletId for ${stationUrl}. Skipping.`);
        continue;
      }

      let latitude = parseFloat($('#jsOutletLatitude').val() as string);
      let longitude = parseFloat($('#jsOutletLongitude').val() as string);

      let stationName = $('.info-head').first().text().trim();
      if (!stationName) {
        const parts = $('title').text().trim().split(',');
        stationName = parts.length > 1 ? parts[1].trim() : parts[0].trim();
      }

      let state = '';
      let city = '';
      let address: string | null = null;
      let phone: string | null = null;
      let openingHours: string | null = null;

      // Extract details from JSON-LD schema
      $('script[type="application/ld+json"]').each((_, elem) => {
        try {
          const obj = JSON.parse($(elem).html() || '{}');
          const items = Array.isArray(obj) ? obj : [obj];
          for (const item of items) {
            if (item['@type'] === 'BreadcrumbList' && Array.isArray(item.itemListElement)) {
              const stateNode = item.itemListElement.find(
                (n: { position: number; item?: { name: string } }) => n.position === 2,
              );
              if (stateNode && stateNode.item) state = stateNode.item.name;
              const cityNode = item.itemListElement.find(
                (n: { position: number; item?: { name: string } }) => n.position === 3,
              );
              if (cityNode && cityNode.item) city = cityNode.item.name;
            }
            if (
              item['@type'] === 'GasStation' ||
              item['@type'] === 'LocalBusiness' ||
              item['@type'] === 'AutomotiveBusiness'
            ) {
              if (item.address) {
                const addr = Array.isArray(item.address) ? item.address[0] : item.address;
                if (addr) {
                  const street = addr.streetAddress || '';
                  const locality = addr.addressLocality || '';
                  const region = addr.addressRegion || '';
                  const pc = addr.postalCode || '';
                  const country = addr.addressCountry || 'India';
                  if (!address) {
                    address = `${street}, ${locality}, ${region} - ${pc}, ${country}`
                      .replace(/\s+/g, ' ')
                      .trim();
                  }
                  if (!city && region) city = region;
                }
              }
              if (
                item.geo &&
                !isNaN(parseFloat(item.geo.latitude)) &&
                !isNaN(parseFloat(item.geo.longitude))
              ) {
                if (isNaN(latitude)) latitude = parseFloat(item.geo.latitude);
                if (isNaN(longitude)) longitude = parseFloat(item.geo.longitude);
              }
              if (item.telephone) {
                const tel = Array.isArray(item.telephone) ? item.telephone[0] : item.telephone;
                if (tel) phone = String(tel).trim();
              }
              if (item.openingHoursSpecification) {
                const specs = Array.isArray(item.openingHoursSpecification)
                  ? item.openingHoursSpecification
                  : [item.openingHoursSpecification];
                if (specs.length > 0 && specs[0].opens) {
                  openingHours = `Open ${specs[0].opens} - ${specs[0].closes || '11:59 PM'}`;
                }
              }
            }
          }
        } catch (e) {
          // Ignore JSON errors
        }
      });

      // Address / City / State Fallbacks
      if (!city) {
        city = 'Unknown';
      }
      if (!state) {
        state = 'Unknown';
      }

      // Coordinates validation
      if (isNaN(latitude) || isNaN(longitude)) {
        console.warn(`[XP95 Scraper] Skipped ${stationUrl}: Invalid or missing coordinates.`);
        continue;
      }
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        console.warn(
          `[XP95 Scraper] Skipped ${stationUrl}: Coordinates out of bounds (${latitude}, ${longitude}).`,
        );
        continue;
      }

      // Telephone Fallback
      if (!phone) {
        const telHref = $('a[href^="tel:"]').first().attr('href');
        if (telHref) {
          phone = telHref.replace('tel:', '').trim();
        }
      }

      // Opening hours Fallback
      if (!openingHours) {
        const timingText = $('.timeShow').text().trim();
        if (timingText) {
          openingHours = timingText;
        }
      }

      // Fetch dynamic price page
      const priceUrl = `https://locator.iocl.com/getPetrolPricesForIOCL.php?master_outlet_id=${masterOutletId}&outlet_id=${outletId}`;
      let petrolPrice: number | null = null;
      let dieselPrice: number | null = null;
      let xp95Price: number | null = null;
      let xp100Price: number | null = null;

      try {
        const ajaxRes = await axios.get(priceUrl, {
          headers: {
            'User-Agent': headers['User-Agent'],
            Referer: stationUrl,
            'X-Requested-With': 'XMLHttpRequest',
          },
          timeout: 10000,
        });

        const sub$ = cheerio.load(ajaxRes.data);
        sub$('.fule-price-card').each((_, card) => {
          const icon = sub$(card).find('.fuel-icon');
          const priceText = sub$(card).find('.fuel-text').text().trim();
          const priceVal = parseFloat(priceText.replace(/[^\d.]/g, ''));
          if (!isNaN(priceVal)) {
            if (icon.hasClass('icn-petrol')) {
              petrolPrice = priceVal;
            } else if (icon.hasClass('icn-diesel')) {
              dieselPrice = priceVal;
            } else if (icon.hasClass('icn-xptwo')) {
              xp95Price = priceVal;
            } else if (icon.hasClass('icn-xp')) {
              xp100Price = priceVal;
            }
          }
        });
      } catch (err: unknown) {
        const error = err as Error;
        console.warn(`[XP95 Scraper] Price query failed for ${stationUrl}: ${error.message}`);
      }

      // XP95 Filter requirement
      if (xp95Price === null || isNaN(xp95Price)) {
        console.log(`[XP95 Scraper] Skipped ${stationUrl}: No XP95 price displayed.`);
        continue;
      }

      stationsWithXp95Count++;

      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

      const stationObj: IOCLXP95Station = {
        brand: 'IOCL',
        fuelType: 'XP95',
        roCode,
        stationName,
        address,
        city,
        state,
        phone,
        latitude,
        longitude,
        openingHours,
        stationUrl,
        googleMapsUrl,
        xp95Price,
        petrolPrice,
        dieselPrice,
        xp100Price,
        lastUpdated: new Date().toISOString(),
        stateOffice: null,
        divisionalOffice: null,
        salesArea: null,
      };

      if (stationsMap.has(roCode)) {
        duplicateCount++;
      }
      stationsMap.set(roCode, stationObj);
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`[XP95 Scraper] Error scraping page ${stationUrl}: ${error.message}`);
    }

    // Delay to preserve performance of locator servers
    await new Promise((r) => setTimeout(r, 400));
  }

  const finalStations = Array.from(stationsMap.values());

  // Ensure directory exists and write results
  const dirPath = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalStations, null, 2), 'utf-8');

  const endTime = Date.now();
  const timeTakenSec = ((endTime - startTime) / 1000).toFixed(1);

  console.log(`\n====================================================`);
  console.log(`SCRAPING RESULTS SUMMARY`);
  console.log(`====================================================`);
  console.log(`Total stations discovered: ${uniqueUrls.length}`);
  console.log(`Total station pages visited: ${pagesVisited}`);
  console.log(`Stations with XP95: ${stationsWithXp95Count}`);
  console.log(`Duplicates removed: ${duplicateCount}`);
  console.log(`Final station count: ${finalStations.length}`);
  console.log(`Time taken: ${timeTakenSec}s`);
  console.log(`====================================================\n`);
}

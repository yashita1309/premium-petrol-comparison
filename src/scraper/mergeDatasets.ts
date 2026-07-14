import * as fs from 'fs';
import * as path from 'path';
import { calculateDistance } from '../utils/distance';
import { Station, IOCLXP95Station } from '../types/station';

const XP95_PATH = path.resolve(process.cwd(), 'data/iocl_xp95.json');
const XP100_PATH = path.resolve(process.cwd(), 'data/xp100_stations.json');
const OUTPUT_PATH = path.resolve(process.cwd(), 'data/iocl_premium.json');

// Interface representing the unified station format
interface MergedStation {
  brand: string;
  fuelType: string; // Keep or set appropriately (e.g. combined or original)
  roCode: string;
  stationName: string;
  address: string | null;
  city: string;
  state: string | null;
  phone: string | null;
  latitude: number;
  longitude: number;
  openingHours: string | null;
  stationUrl: string | null;
  googleMapsUrl: string;
  xp95Price: number | null;
  xp100Price: number | null;
  petrolPrice: number | null;
  dieselPrice: number | null;
  lastUpdated: string;
  stateOffice: string | null;
  divisionalOffice: string | null;
  salesArea: string | null;
}

function cleanString(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Checks if two station names are similar by comparing their alphanumeric words.
 */
function areNamesSimilar(name1: string, name2: string): boolean {
  const n1 = cleanString(name1);
  const n2 = cleanString(name2);
  if (!n1 || !n2) return false;
  return n1.includes(n2) || n2.includes(n1);
}

export async function mergeIOCLDatasets(): Promise<void> {
  console.log('[Merge] Starting merge of IOCL XP95 and XP100 datasets...');

  if (!fs.existsSync(XP95_PATH)) {
    throw new Error(`XP95 dataset not found at: ${XP95_PATH}`);
  }
  if (!fs.existsSync(XP100_PATH)) {
    throw new Error(`XP100 dataset not found at: ${XP100_PATH}`);
  }

  const xp95Raw = JSON.parse(fs.readFileSync(XP95_PATH, 'utf-8')) as IOCLXP95Station[];
  const xp100Raw = JSON.parse(fs.readFileSync(XP100_PATH, 'utf-8')) as Station[];

  console.log(`[Merge] Loaded ${xp95Raw.length} stations from XP95.`);
  console.log(`[Merge] Loaded ${xp100Raw.length} stations from XP100.`);

  const mergedStations: MergedStation[] = [];
  const mergedXp100RoCodes = new Set<string>();
  const mergedXp100Indices = new Set<number>();

  // Process all stations in the XP95 dataset first
  for (const xp95 of xp95Raw) {
    let matchIdx = -1;

    // 1. Primary match: roCode
    if (xp95.roCode) {
      matchIdx = xp100Raw.findIndex(
        (x) => x.roCode && x.roCode.trim().toLowerCase() === xp95.roCode.trim().toLowerCase(),
      );
    }

    // 2. Secondary fallback match: coordinates & stationName similarity
    if (matchIdx === -1 && xp95.latitude && xp95.longitude) {
      matchIdx = xp100Raw.findIndex((x, idx) => {
        if (mergedXp100Indices.has(idx)) return false;
        if (!x.latitude || !x.longitude) return false;

        const dist = calculateDistance(xp95.latitude, xp95.longitude, x.latitude, x.longitude);
        if (dist <= 0.05) {
          // If coords are within 50m, check name similarity
          return areNamesSimilar(xp95.stationName, x.stationName);
        }
        return false;
      });
    }

    // Start with a clean copy of the XP95 record
    const merged: MergedStation = {
      brand: xp95.brand || 'IOCL',
      fuelType: xp95.fuelType || 'XP95',
      roCode: xp95.roCode,
      stationName: xp95.stationName,
      address: xp95.address || null,
      city: xp95.city,
      state: xp95.state || null,
      phone: xp95.phone || null,
      latitude: xp95.latitude,
      longitude: xp95.longitude,
      openingHours: xp95.openingHours || null,
      stationUrl: xp95.stationUrl || null,
      googleMapsUrl: xp95.googleMapsUrl,
      xp95Price: xp95.xp95Price || null,
      xp100Price: xp95.xp100Price || null,
      petrolPrice: xp95.petrolPrice || null,
      dieselPrice: xp95.dieselPrice || null,
      lastUpdated: xp95.lastUpdated || new Date().toISOString(),
      stateOffice: xp95.stateOffice || null,
      divisionalOffice: xp95.divisionalOffice || null,
      salesArea: xp95.salesArea || null,
    };

    if (matchIdx !== -1) {
      const xp100 = xp100Raw[matchIdx];
      mergedXp100Indices.add(matchIdx);
      if (xp100.roCode) {
        mergedXp100RoCodes.add(xp100.roCode.trim().toLowerCase());
      }

      // Merge fields from XP100, taking care not to overwrite non-null values with nulls
      if (xp100.stateOffice && !merged.stateOffice) merged.stateOffice = xp100.stateOffice;
      if (xp100.divisionalOffice && !merged.divisionalOffice) {
        merged.divisionalOffice = xp100.divisionalOffice;
      }
      if (xp100.salesArea && !merged.salesArea) merged.salesArea = xp100.salesArea;

      // Merge prices
      if (xp100.petrolPrice !== undefined && xp100.petrolPrice !== null && !merged.petrolPrice) {
        merged.petrolPrice = xp100.petrolPrice;
      }
      if (xp100.dieselPrice !== undefined && xp100.dieselPrice !== null && !merged.dieselPrice) {
        merged.dieselPrice = xp100.dieselPrice;
      }
      if (xp100.xp95Price !== undefined && xp100.xp95Price !== null && !merged.xp95Price) {
        merged.xp95Price = xp100.xp95Price;
      }
      if (xp100.xp100Price !== undefined && xp100.xp100Price !== null) {
        merged.xp100Price = xp100.xp100Price;
      }

      // Indicate combined fuelType availability
      merged.fuelType = 'XP95/XP100';
    }

    mergedStations.push(merged);
  }

  // Process all stations in the XP100 dataset that were NOT merged
  let onlyXp100Count = 0;
  for (let i = 0; i < xp100Raw.length; i++) {
    if (mergedXp100Indices.has(i)) continue;

    const xp100 = xp100Raw[i];
    if (xp100.roCode && mergedXp100RoCodes.has(xp100.roCode.trim().toLowerCase())) {
      // Safety guard against duplicate RO Code records across datasets
      continue;
    }

    const merged: MergedStation = {
      brand: 'IOCL',
      fuelType: 'XP100',
      roCode: xp100.roCode,
      stationName: xp100.stationName,
      address: null,
      city: xp100.city,
      state: null,
      phone: null,
      latitude: xp100.latitude,
      longitude: xp100.longitude,
      openingHours: null,
      stationUrl: null,
      googleMapsUrl: xp100.googleMapsUrl,
      xp95Price: xp100.xp95Price || null,
      xp100Price: xp100.xp100Price || null,
      petrolPrice: xp100.petrolPrice || null,
      dieselPrice: xp100.dieselPrice || null,
      lastUpdated: new Date().toISOString(),
      stateOffice: xp100.stateOffice || null,
      divisionalOffice: xp100.divisionalOffice || null,
      salesArea: xp100.salesArea || null,
    };

    mergedStations.push(merged);
    onlyXp100Count++;
  }

  // --- Verification Checks ---
  const finalRoCodes = new Set<string>();
  const duplicateCodes: string[] = [];

  for (const s of mergedStations) {
    if (s.roCode) {
      const codeLower = s.roCode.trim().toLowerCase();
      if (finalRoCodes.has(codeLower)) {
        duplicateCodes.push(s.roCode);
      }
      finalRoCodes.add(codeLower);
    }
  }

  const expectedUniqueCount = xp95Raw.length + onlyXp100Count;

  console.log(`\n====================================================`);
  console.log(`MERGE VERIFICATION RESULTS`);
  console.log(`====================================================`);
  console.log(`XP95 Source Stations: ${xp95Raw.length}`);
  console.log(`XP100 Source Stations: ${xp100Raw.length}`);
  console.log(`XP100 Stations merged into XP95 records: ${mergedXp100Indices.size}`);
  console.log(`XP100 Stations added separately (no match): ${onlyXp100Count}`);
  console.log(`Total Merged Stations: ${mergedStations.length}`);
  console.log(`Expected Unique Stations: ${expectedUniqueCount}`);
  console.log(
    `Merge check: ${mergedStations.length === expectedUniqueCount ? 'PASS' : 'FAIL (Count mismatch)'}`,
  );
  console.log(
    `Duplicate roCode check: ${duplicateCodes.length === 0 ? 'PASS' : `FAIL (${duplicateCodes.length} duplicates found: ${duplicateCodes.join(', ')})`}`,
  );
  console.log(`====================================================\n`);

  if (duplicateCodes.length > 0) {
    throw new Error('Merge aborted due to duplicate RO Code entries in final output.');
  }

  // Ensure target folder exists and write results
  const dirPath = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mergedStations, null, 2), 'utf-8');
  console.log(`[Merge] Saved merged dataset successfully to: ${OUTPUT_PATH}`);
}

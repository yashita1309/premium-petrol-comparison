import * as fs from 'fs';
import * as path from 'path';
import { IOCLXP95Station, IOCLXP95NearbyStationResponse } from '../types/station';
import { calculateDistance } from '../utils/distance';

const DATA_FILE_PATH = path.resolve(process.cwd(), 'data/iocl_xp95.json');

export class IOCLXP95Service {
  /**
   * Reads all XP95 stations from the JSON database.
   */
  public static getAllRawStations(): IOCLXP95Station[] {
    if (!fs.existsSync(DATA_FILE_PATH)) {
      console.warn(
        `[IOCLXP95Service] Data file not found at ${DATA_FILE_PATH}. Returning empty list.`,
      );
      return [];
    }
    try {
      const rawData = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      return JSON.parse(rawData) as IOCLXP95Station[];
    } catch (error) {
      throw new Error(`JSON parsing failure for IOCL XP95: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves, filters, and paginates XP95 stations.
   */
  public static getStations(params: {
    page?: number;
    limit?: number;
    city?: string;
    search?: string;
  }):
    | {
        stations: IOCLXP95Station[];
        pagination?: { total: number; page: number; limit: number; totalPages: number };
      }
    | IOCLXP95Station[] {
    let stations = this.getAllRawStations();

    // 1. Filter by city (case-insensitive exact match)
    if (params.city) {
      const cityLower = params.city.trim().toLowerCase();
      stations = stations.filter((s) => s.city.toLowerCase() === cityLower);
    }

    // 2. Filter by search query (case-insensitive substring match across stationName, city, state, roCode)
    if (params.search) {
      const searchLower = params.search.trim().toLowerCase();
      stations = stations.filter(
        (s) =>
          s.stationName.toLowerCase().includes(searchLower) ||
          s.city.toLowerCase().includes(searchLower) ||
          s.state.toLowerCase().includes(searchLower) ||
          s.roCode.toLowerCase().includes(searchLower),
      );
    }

    // 3. Paginate if page or limit parameters are specified
    if (params.page !== undefined || params.limit !== undefined) {
      const total = stations.length;
      const page = params.page && params.page > 0 ? params.page : 1;
      const limit = params.limit && params.limit > 0 ? params.limit : 10;
      const totalPages = Math.ceil(total / limit);

      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedStations = stations.slice(startIndex, endIndex);

      return {
        stations: paginatedStations,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    }

    return stations;
  }

  /**
   * Finds stations within a given radius, supporting custom sorting (sortBy = distance or price).
   */
  public static getNearbyStations(params: {
    lat: number;
    lng: number;
    radius?: number;
    limit?: number;
    sortBy?: 'distance' | 'price';
  }): IOCLXP95NearbyStationResponse[] {
    const stations = this.getAllRawStations();
    const radius = params.radius && params.radius > 0 ? params.radius : 10;
    const limit = params.limit && params.limit > 0 ? params.limit : 10;
    const sortBy = params.sortBy || 'distance';

    const results: IOCLXP95NearbyStationResponse[] = [];

    for (const station of stations) {
      const distance = calculateDistance(
        params.lat,
        params.lng,
        station.latitude,
        station.longitude,
      );
      if (distance <= radius) {
        results.push({
          brand: station.brand,
          fuelType: station.fuelType,
          stationName: station.stationName,
          roCode: station.roCode,
          city: station.city,
          state: station.state,
          latitude: station.latitude,
          longitude: station.longitude,
          distance,
          xp95Price: station.xp95Price,
          petrolPrice: station.petrolPrice,
          dieselPrice: station.dieselPrice,
          xp100Price: station.xp100Price,
          stationUrl: station.stationUrl,
          googleMapsUrl: station.googleMapsUrl,
        });
      }
    }

    // Sort accordingly
    if (sortBy === 'price') {
      results.sort((a, b) => a.xp95Price - b.xp95Price);
    } else {
      results.sort((a, b) => a.distance - b.distance);
    }

    return results.slice(0, limit);
  }

  /**
   * Finds a single station by its unique RO Code (roCode).
   */
  public static getStationByRoCode(roCode: string): IOCLXP95Station | undefined {
    const stations = this.getAllRawStations();
    return stations.find((s) => s.roCode === roCode);
  }
}

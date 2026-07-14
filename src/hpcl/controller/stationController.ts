import { Request, Response, NextFunction } from 'express';
import { HPCLStationService } from '../service/stationService';
import { scrapeHpclDataset } from '../scraper/scraperService';

/**
 * Controller to handle all HTTP requests for HPCL stations.
 */
export class HPCLStationController {
  /**
   * GET /hpcl/stations
   * Retrieves, filters, sorts, and paginates HPCL stations.
   */
  public static getStations(req: Request, res: Response, next: NextFunction): void {
    try {
      const {
        page,
        limit,
        city,
        state,
        search,
        fuelType,
        priceMin,
        priceMax,
        sortBy,
        order,
        lat,
        lng,
      } = req.query;

      const parsedPage = page ? parseInt(page as string, 10) : undefined;
      const parsedLimit = limit ? parseInt(limit as string, 10) : undefined;

      const filterCity = city ? (city as string) : undefined;
      const filterState = state ? (state as string) : undefined;
      const searchQuery = search ? (search as string) : undefined;
      const filterFuel = fuelType ? (fuelType as string) : undefined;

      const parsedPriceMin = priceMin ? parseFloat(priceMin as string) : undefined;
      if (priceMin !== undefined && isNaN(parsedPriceMin!)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'priceMin parameter must be a valid number.',
        });
        return;
      }

      const parsedPriceMax = priceMax ? parseFloat(priceMax as string) : undefined;
      if (priceMax !== undefined && isNaN(parsedPriceMax!)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'priceMax parameter must be a valid number.',
        });
        return;
      }

      const sortField = sortBy ? (sortBy as string) : undefined;
      const sortOrder = order ? (order as string) : undefined;

      const centerLat = lat ? parseFloat(lat as string) : undefined;
      const centerLng = lng ? parseFloat(lng as string) : undefined;

      if (sortField === 'distance') {
        if (centerLat === undefined || isNaN(centerLat) || centerLat < -90 || centerLat > 90) {
          res.status(400).json({
            error: 'Bad Request',
            message:
              'A valid lat (latitude between -90 and 90) is required when sorting by distance.',
          });
          return;
        }
        if (centerLng === undefined || isNaN(centerLng) || centerLng < -180 || centerLng > 180) {
          res.status(400).json({
            error: 'Bad Request',
            message:
              'A valid lng (longitude between -180 and 180) is required when sorting by distance.',
          });
          return;
        }
      }

      const result = HPCLStationService.getStations({
        page: parsedPage,
        limit: parsedLimit,
        city: filterCity,
        state: filterState,
        search: searchQuery,
        fuelType: filterFuel,
        priceMin: parsedPriceMin,
        priceMax: parsedPriceMax,
        sortBy: sortField,
        order: sortOrder,
        lat: centerLat,
        lng: centerLng,
      });

      const isEmpty = Array.isArray(result) ? result.length === 0 : result.stations.length === 0;

      if (isEmpty) {
        res.status(404).json({
          error: 'Not Found',
          message: 'No stations found.',
        });
        return;
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /hpcl/stations/nearby
   * Finds HPCL stations within a given radius from specified coordinates.
   */
  public static getNearbyStations(req: Request, res: Response, next: NextFunction): void {
    try {
      const { lat, lng, radius, limit, sortBy, order } = req.query;

      if (lat === undefined || lat === '') {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Missing latitude',
        });
        return;
      }

      if (lng === undefined || lng === '') {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Missing longitude',
        });
        return;
      }

      const latitude = parseFloat(lat as string);
      if (isNaN(latitude) || latitude < -90 || latitude > 90) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid latitude',
        });
        return;
      }

      const longitude = parseFloat(lng as string);
      if (isNaN(longitude) || longitude < -180 || longitude > 180) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid longitude',
        });
        return;
      }

      const searchRadius = radius ? parseFloat(radius as string) : 100;
      const maxResults = limit ? parseInt(limit as string, 10) : 10;

      if (isNaN(searchRadius) || searchRadius < 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Radius parameter must be a valid positive number.',
        });
        return;
      }

      if (isNaN(maxResults) || maxResults <= 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Limit parameter must be a valid positive integer.',
        });
        return;
      }

      const sortField = sortBy ? (sortBy as string) : undefined;
      const sortOrder = order ? (order as string) : undefined;

      if (
        sortField &&
        !['distance', 'power95Price', 'petrolPrice', 'dieselPrice', 'turboJetPrice'].includes(
          sortField,
        )
      ) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid sortBy parameter.',
        });
        return;
      }

      const results = HPCLStationService.getNearbyStations({
        lat: latitude,
        lng: longitude,
        radius: searchRadius,
        limit: maxResults,
        sortBy: sortField,
        order: sortOrder,
      });

      if (results.length === 0) {
        res.status(404).json({
          error: 'Not Found',
          message: 'No nearby stations found within the requested radius.',
        });
        return;
      }

      res.json(results);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /hpcl/stations/:roCode
   * Finds a single HPCL station by its unique RO Code (outlet ID).
   */
  public static getStationByRoCode(req: Request, res: Response, next: NextFunction): void {
    try {
      const { roCode } = req.params;

      if (!roCode) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'RO Code parameter is required.',
        });
        return;
      }

      const station = HPCLStationService.getStationByRoCode(roCode);

      if (!station) {
        res.status(404).json({
          error: 'Not Found',
          message: `Station with RO Code "${roCode}" was not found.`,
        });
        return;
      }

      res.json(station);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /hpcl/admin/scrape
   * Triggers the HPCL scraper manually, reloading data/hpcl_power95.json.
   */
  public static async triggerScrape(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      console.log('[HPCLStationController] Manual scrape requested via API.');
      const stats = await scrapeHpclDataset();

      res.json({
        totalRows: stats.totalRows,
        parsed: stats.parsed,
        skipped: stats.skipped,
        timeTaken: stats.timeTaken,
      });
    } catch (error) {
      console.error('[HPCLStationController] Scrape trigger failed:', (error as Error).message);
      next(new Error(`Scraper failure: ${(error as Error).message}`));
    }
  }
}

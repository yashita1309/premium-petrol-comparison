import { Request, Response, NextFunction } from 'express';
import { BPCLStationService } from '../service/stationService';
import { scrapeBpclDataset } from '../scraper/scraperService';

/**
 * Controller to handle all HTTP requests for BPCL stations.
 */
export class BPCLStationController {
  /**
   * GET /bpcl/stations
   * Retrieves, filters, sorts, and paginates BPCL stations.
   */
  public static getStations(req: Request, res: Response, next: NextFunction): void {
    try {
      const { page, limit, city, search, sortBy, order, lat, lng } = req.query;

      const parsedPage = page ? parseInt(page as string, 10) : undefined;
      const parsedLimit = limit ? parseInt(limit as string, 10) : undefined;

      const filterCity = city ? (city as string) : undefined;
      const searchQuery = search ? (search as string) : undefined;

      const sortField = sortBy ? (sortBy as string) : undefined;
      const sortOrder = order ? (order as string) : undefined;

      const centerLat = lat ? parseFloat(lat as string) : undefined;
      const centerLng = lng ? parseFloat(lng as string) : undefined;

      if (
        sortField &&
        !['stationName', 'city', 'state', 'distance', 'roId', 'price'].includes(sortField)
      ) {
        res.status(400).json({
          error: 'Bad Request',
          message:
            'Invalid sortBy parameter. Must be one of: stationName, city, state, distance, roId, price.',
        });
        return;
      }

      if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid order parameter. Must be asc or desc.',
        });
        return;
      }

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

      const result = BPCLStationService.getStations({
        page: parsedPage,
        limit: parsedLimit,
        city: filterCity,
        search: searchQuery,
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
   * GET /bpcl/stations/nearby
   * Finds BPCL stations within a given radius using client coordinates.
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
      const maxResults = limit ? parseInt(limit as string, 10) : 20;

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

      if (sortField && !['distance', 'price'].includes(sortField)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid sortBy parameter. Must be one of: distance, price.',
        });
        return;
      }

      if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid order parameter. Must be asc or desc.',
        });
        return;
      }

      const results = BPCLStationService.getNearbyStations({
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
   * GET /bpcl/station/:roId
   * Finds a single BPCL station by its unique RO Code (roId).
   */
  public static getStationByRoId(req: Request, res: Response, next: NextFunction): void {
    try {
      const { roId } = req.params;

      if (!roId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'roId parameter is required.',
        });
        return;
      }

      const station = BPCLStationService.getStationByRoId(roId);

      if (!station) {
        res.status(404).json({
          error: 'Not Found',
          message: `Station with roId "${roId}" was not found.`,
        });
        return;
      }

      res.json(station);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /bpcl/admin/scrape
   * Triggers the BPCL scraper manually, reloading data/bpcl_speed.json.
   */
  public static async triggerScrape(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      console.log('[BPCLStationController] Manual scrape requested via API.');
      const stats = await scrapeBpclDataset();

      res.json({
        totalApiRequests: stats.totalApiRequests,
        totalStationsFetched: stats.totalStationsFetched,
        totalSpeedStationsFound: stats.totalSpeedStationsFound,
        totalDuplicatesRemoved: stats.totalDuplicatesRemoved,
        finalStationCount: stats.finalStationCount,
        timeTaken: stats.timeTaken,
      });
    } catch (error) {
      console.error('[BPCLStationController] Scrape trigger failed:', (error as Error).message);
      next(new Error(`Scraper failure: ${(error as Error).message}`));
    }
  }
}

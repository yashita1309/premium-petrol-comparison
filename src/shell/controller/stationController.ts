import { Request, Response, NextFunction } from 'express';
import { ShellStationService } from '../service/stationService';
import { scrapeShellDataset } from '../scraper/scraperService';

/**
 * Controller to handle all HTTP requests for Shell stations.
 */
export class ShellStationController {
  /**
   * GET /shell/stations
   * Retrieves, filters, sorts, and paginates Shell stations from cached database.
   */
  public static getStations(req: Request, res: Response, next: NextFunction): void {
    try {
      const { page, limit, city, state, search, sortBy, order } = req.query;

      const parsedPage = page ? parseInt(page as string, 10) : undefined;
      const parsedLimit = limit ? parseInt(limit as string, 10) : undefined;

      const filterCity = city ? (city as string) : undefined;
      const filterState = state ? (state as string) : undefined;
      const searchQuery = search ? (search as string) : undefined;

      const sortField = sortBy ? (sortBy as string) : undefined;
      const sortOrder = order ? (order as string) : undefined;

      if (
        sortField &&
        !['stationName', 'city', 'state', 'distance', 'stationId'].includes(sortField)
      ) {
        res.status(400).json({
          error: 'Bad Request',
          message:
            'Invalid sortBy parameter. Must be one of: stationName, city, state, distance, stationId.',
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

      const result = ShellStationService.getStations({
        page: parsedPage,
        limit: parsedLimit,
        city: filterCity,
        state: filterState,
        search: searchQuery,
        sortBy: sortField,
        order: sortOrder,
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
   * GET /shell/stations/nearby
   * Finds Shell stations within a given radius using the live Shell API.
   */
  public static async getNearbyStations(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { lat, lng, radius, limit, order } = req.query;

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

      const sortOrder = order ? (order as string) : undefined;
      if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid order parameter. Must be asc or desc.',
        });
        return;
      }

      const results = await ShellStationService.getNearbyStations({
        lat: latitude,
        lng: longitude,
        radius: searchRadius,
        limit: maxResults,
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
   * GET /shell/stations/:stationId
   * Finds a single Shell station by its unique Station ID.
   */
  public static getStationById(req: Request, res: Response, next: NextFunction): void {
    try {
      const { stationId } = req.params;

      if (!stationId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Station ID parameter is required.',
        });
        return;
      }

      const station = ShellStationService.getStationById(stationId);

      if (!station) {
        res.status(404).json({
          error: 'Not Found',
          message: `Station with ID "${stationId}" was not found.`,
        });
        return;
      }

      res.json(station);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /shell/admin/scrape
   * Triggers the Shell scraper manually, reloading data/shellPremiumPetrol.json.
   */
  public static async triggerScrape(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      console.log('[ShellStationController] Manual scrape requested via API.');
      const stats = await scrapeShellDataset();

      res.json({
        totalRows: stats.totalRows,
        parsed: stats.parsed,
        skipped: stats.skipped,
        timeTaken: stats.timeTaken,
      });
    } catch (error) {
      console.error('[ShellStationController] Scrape trigger failed:', (error as Error).message);
      next(new Error(`Scraper failure: ${(error as Error).message}`));
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { StationService } from '../services/stationService';

/**
 * Controller to handle all HTTP requests for stations.
 */
export class StationController {
  /**
   * GET /stations
   * Retrieves, filters, and paginates stations.
   */
  public static getStations(req: Request, res: Response, next: NextFunction): void {
    try {
      const { page, limit, city, search } = req.query;

      const parsedPage = page ? parseInt(page as string, 10) : undefined;
      const parsedLimit = limit ? parseInt(limit as string, 10) : undefined;
      const filterCity = city ? (city as string) : undefined;
      const searchQuery = search ? (search as string) : undefined;

      const result = StationService.getStations({
        page: parsedPage,
        limit: parsedLimit,
        city: filterCity,
        search: searchQuery,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /stations/nearby
   * Finds stations within a given radius from specified coordinates.
   */
  public static getNearbyStations(req: Request, res: Response, next: NextFunction): void {
    try {
      const { lat, lng, radius, limit } = req.query;

      if (!lat || !lng) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Both latitude (lat) and longitude (lng) query parameters are required.',
        });
        return;
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);

      if (isNaN(latitude) || isNaN(longitude)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Latitude and longitude must be valid floating point numbers.',
        });
        return;
      }

      const searchRadius = radius ? parseFloat(radius as string) : 50;
      const maxResults = limit ? parseInt(limit as string, 10) : 20;

      if (isNaN(searchRadius) || isNaN(maxResults)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Radius and limit parameters must be valid numbers.',
        });
        return;
      }

      const results = StationService.getNearbyStations(
        latitude,
        longitude,
        searchRadius,
        maxResults,
      );

      res.json(results);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /stations/:roCode
   * Finds a single station by its unique RO Code.
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

      const station = StationService.getStationByRoCode(roCode);

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
}

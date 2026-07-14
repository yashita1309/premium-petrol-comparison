import { Request, Response, NextFunction } from 'express';
import { IOCLXP95Service } from '../services/ioclXp95Service';
import { scrapeIOCLXP95Stations } from '../scraper/ioclXp95Scraper';

export class IOCLXP95Controller {
  /**
   * GET /iocl/xp95/stations
   */
  public static getStations = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const city = req.query.city ? (req.query.city as string).trim() : undefined;
      const search = req.query.search ? (req.query.search as string).trim() : undefined;

      const result = IOCLXP95Service.getStations({ page, limit, city, search });
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /iocl/xp95/stations/nearby
   */
  public static getNearbyStations = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { lat, lng, radius, limit, sortBy } = req.query;

      if (!lat || !lng) {
        res
          .status(400)
          .json({ error: 'Latitude (lat) and Longitude (lng) are required parameters.' });
        return;
      }

      const parsedLat = parseFloat(lat as string);
      const parsedLng = parseFloat(lng as string);

      if (isNaN(parsedLat) || isNaN(parsedLng)) {
        res.status(400).json({ error: 'Latitude and Longitude must be valid numbers.' });
        return;
      }

      const parsedRadius = radius ? parseFloat(radius as string) : undefined;
      const parsedLimit = limit ? parseInt(limit as string, 10) : undefined;

      if (sortBy && sortBy !== 'distance' && sortBy !== 'price') {
        res.status(400).json({ error: "sortBy must be either 'distance' or 'price'." });
        return;
      }

      const result = IOCLXP95Service.getNearbyStations({
        lat: parsedLat,
        lng: parsedLng,
        radius: parsedRadius,
        limit: parsedLimit,
        sortBy: sortBy as 'distance' | 'price' | undefined,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /iocl/xp95/station/:roCode
   */
  public static getStationByRoCode = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { roCode } = req.params;
      const station = IOCLXP95Service.getStationByRoCode(roCode);

      if (!station) {
        res.status(404).json({ error: `IOCL XP95 Station with RO Code '${roCode}' not found.` });
        return;
      }

      res.json(station);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /iocl/xp95/admin/scrape
   */
  public static triggerScrape = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      console.log('[Admin] Manual scraping trigger received for IOCL XP95.');
      // Scrape synchronously so endpoint completes when data is ready
      await scrapeIOCLXP95Stations();
      res.json({ message: 'IOCL XP95 scrape completed and dataset reloaded successfully.' });
    } catch (err) {
      next(err);
    }
  };
}

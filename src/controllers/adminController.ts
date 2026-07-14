import { Request, Response, NextFunction } from 'express';
import { scrapeXP100Stations } from '../scraper/scraperService';

/**
 * Controller to handle administrative commands.
 */
export class AdminController {
  /**
   * POST /admin/scrape
   * Triggers the scraper manually to download and parse the station list,
   * refreshing the JSON output file.
   */
  public static async triggerScrape(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      console.log('[AdminController] Manual scrape requested via API.');
      const stats = await scrapeXP100Stations();

      res.json({
        totalRows: stats.totalRows,
        parsed: stats.parsed,
        skipped: stats.skipped,
        timeTaken: stats.timeTaken,
      });
    } catch (error) {
      console.error('[AdminController] Scrape trigger failed:', (error as Error).message);
      next(error);
    }
  }
}

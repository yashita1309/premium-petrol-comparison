import { Router } from 'express';
import { ShellStationController } from '../controller/stationController';

const router = Router();

// Trigger manual Shell scraper and reload JSON database
router.post('/scrape', ShellStationController.triggerScrape);

export default router;

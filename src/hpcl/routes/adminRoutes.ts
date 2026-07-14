import { Router } from 'express';
import { HPCLStationController } from '../controller/stationController';

const router = Router();

// Trigger manual HPCL scraper and reload JSON database
router.post('/scrape', HPCLStationController.triggerScrape);

export default router;

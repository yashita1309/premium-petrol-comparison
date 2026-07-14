import { Router } from 'express';
import { BPCLStationController } from '../controller/stationController';

const router = Router();

// Trigger manual BPCL scraper and reload JSON database
router.post('/scrape', BPCLStationController.triggerScrape);

export default router;

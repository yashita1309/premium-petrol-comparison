import { Router } from 'express';
import { IOCLXP95Controller } from '../controllers/ioclXp95Controller';

const router = Router();

// Retrieve all IOCL XP95 stations (supports pagination, search, and city queries)
router.get('/stations', IOCLXP95Controller.getStations);

// Retrieve nearby IOCL XP95 stations using coordinates (lat and lng are required)
router.get('/stations/nearby', IOCLXP95Controller.getNearbyStations);

// Retrieve a single IOCL XP95 station by its unique RO Code (roCode)
router.get('/station/:roCode', IOCLXP95Controller.getStationByRoCode);

// Manual trigger route for admin scraper reloading
router.post('/admin/scrape', IOCLXP95Controller.triggerScrape);

export default router;

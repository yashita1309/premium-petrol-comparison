import { Router } from 'express';
import { StationController } from '../controllers/stationController';

const router = Router();

// Retrieve list of all stations (with optional pagination, search, or city filters)
router.get('/', StationController.getStations);

// Find stations within a specific radius (lat/lng coordinates are required query parameters)
router.get('/nearby', StationController.getNearbyStations);

// Retrieve details for a single station by its unique RO Code (e.g., /stations/370982)
router.get('/:roCode', StationController.getStationByRoCode);

export default router;

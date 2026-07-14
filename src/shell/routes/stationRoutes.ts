import { Router } from 'express';
import { ShellStationController } from '../controller/stationController';

const router = Router();

// Retrieve all Shell stations (supports pagination, search, and city queries)
router.get('/', ShellStationController.getStations);

// Retrieve nearby Shell stations using user coordinates (lat and lng are required)
router.get('/nearby', ShellStationController.getNearbyStations);

// Retrieve a single Shell station by its unique Station ID
router.get('/:stationId', ShellStationController.getStationById);

export default router;

import { Router } from 'express';
import { HPCLStationController } from '../controller/stationController';

const router = Router();

// Retrieve all HPCL stations (supports pagination, search, and city queries)
router.get('/', HPCLStationController.getStations);

// Retrieve nearby HPCL stations using user coordinates (lat and lng are required)
router.get('/nearby', HPCLStationController.getNearbyStations);

// Retrieve a single HPCL station by its unique RO Code (outlet ID)
router.get('/:roCode', HPCLStationController.getStationByRoCode);

export default router;

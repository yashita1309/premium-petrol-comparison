import { Router } from 'express';
import { BPCLStationController } from '../controller/stationController';

const router = Router();

// Retrieve all BPCL stations (supports pagination, search, and city queries)
router.get('/', BPCLStationController.getStations);

// Retrieve nearby BPCL stations using coordinates (lat and lng are required)
router.get('/nearby', BPCLStationController.getNearbyStations);

// Retrieve a single BPCL station by its unique RO Code (roId)
router.get('/:roId', BPCLStationController.getStationByRoId);

export default router;

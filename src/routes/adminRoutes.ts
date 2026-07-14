import { Router } from 'express';
import { AdminController } from '../controllers/adminController';

const router = Router();

// Endpoint to trigger manual scraping run
router.post('/scrape', AdminController.triggerScrape);

export default router;

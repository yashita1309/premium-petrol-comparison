import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import stationRoutes from './routes/stationRoutes';
import adminRoutes from './routes/adminRoutes';
import hpclStationRoutes from './hpcl/routes/stationRoutes';
import hpclAdminRoutes from './hpcl/routes/adminRoutes';
import shellStationRoutes from './shell/routes/stationRoutes';
import shellAdminRoutes from './shell/routes/adminRoutes';
import bpclStationRoutes from './bpcl/routes/stationRoutes';
import bpclAdminRoutes from './bpcl/routes/adminRoutes';
import ioclXp95Routes from './routes/ioclXp95Routes';
import { errorHandler } from './middleware/errorHandler';

const app: Express = express();

// Standard middleware
app.use(cors());
app.use(express.json());

// GET /health - basic system check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Register routers
app.use('/stations', stationRoutes);
app.use('/admin', adminRoutes);
app.use('/hpcl/stations', hpclStationRoutes);
app.use('/hpcl/admin', hpclAdminRoutes);
app.use('/shell/stations', shellStationRoutes);
app.use('/shell/admin', shellAdminRoutes);
app.use('/bpcl/stations', bpclStationRoutes);
app.use('/bpcl/admin', bpclAdminRoutes);
app.use('/iocl/xp95', ioclXp95Routes);

// Fallback 404 handler for unmatched routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested route or method is not defined.',
  });
});

// Global central error handler middleware
app.use(errorHandler);

export default app;

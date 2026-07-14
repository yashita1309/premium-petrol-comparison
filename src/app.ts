import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import stationRoutes from './routes/stationRoutes';
import adminRoutes from './routes/adminRoutes';
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

import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`[Server] IndianOil XP100 Petrol Pump Finder listening on port ${PORT}`);
});

// Handle graceful shutdowns
const graceClose = (signal: string) => {
  console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => graceClose('SIGTERM'));
process.on('SIGINT', () => graceClose('SIGINT'));

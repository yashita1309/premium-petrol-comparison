import { scrapeIOCLXP95Stations } from './ioclXp95Scraper';

async function run() {
  console.log('--- IOCL XP95 Premium Petrol Nationwide Scraper Runner ---');
  try {
    await scrapeIOCLXP95Stations();
    console.log('Scraper finished successfully.');
    process.exit(0);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Fatal Scraper Error:', err.message);
    process.exit(1);
  }
}

run();

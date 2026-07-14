import { scrapeShellDataset } from './scraperService';

async function main() {
  console.log('--- Shell Premium Petrol Petrol Pump Scraper Standalone Runner ---');
  try {
    const stats = await scrapeShellDataset();
    console.log('\nScraping results:');
    console.log(`- Total Rows Found (cumulative): ${stats.totalRows}`);
    console.log(`- Unique Premium Petrol Outlets Saved: ${stats.parsed}`);
    console.log(`- Duplicate Outlets Skipped: ${stats.skipped}`);
    console.log(`- Time Taken: ${stats.timeTaken}`);
    console.log('\nDone!');
  } catch (error) {
    console.error('Scraper runner failed:', (error as Error).message);
    process.exit(1);
  }
}

main();

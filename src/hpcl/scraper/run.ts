import { scrapeHpclDataset } from './scraperService';

async function main() {
  console.log('--- HPCL Power95 Petrol Pump Scraper Standalone Runner ---');
  try {
    const stats = await scrapeHpclDataset();
    console.log('\nScraping results:');
    console.log(`- Total Rows Found (cumulative): ${stats.totalRows}`);
    console.log(`- Unique Power95 Outlets Saved: ${stats.parsed}`);
    console.log(`- Duplicate or Non-Power95 Outlets Skipped: ${stats.skipped}`);
    console.log(`- Time Taken: ${stats.timeTaken}`);
    console.log('\nDone!');
    process.exit(0);
  } catch (error) {
    const err = error as Error;
    console.error('\nScraper Runner failed with error:');
    console.error(err.message);
    process.exit(1);
  }
}

main();

import { scrapeXP100Stations } from './scraperService';

async function main() {
  console.log('--- IOCL XP100 Petrol Pump Scraper Standalone Runner ---');
  try {
    const stats = await scrapeXP100Stations();
    console.log('\nScraping results:');
    console.log(`- Total Rows Found: ${stats.totalRows}`);
    console.log(`- Successfully Parsed: ${stats.parsed}`);
    console.log(`- Skipped Rows: ${stats.skipped}`);
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

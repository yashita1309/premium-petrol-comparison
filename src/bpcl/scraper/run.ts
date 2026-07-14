import { scrapeBpclDataset } from './scraperService';

async function main() {
  console.log('--- BPCL Speed Petrol Nationwide Scraper Standalone Runner ---');
  try {
    const stats = await scrapeBpclDataset();
    console.log('\n====================================================');
    console.log('SCRAPING RESULTS SUMMARY');
    console.log('====================================================');
    console.log(`- Total API requests made: ${stats.totalApiRequests}`);
    console.log(`- Total stations fetched: ${stats.totalStationsFetched}`);
    console.log(`- Total Speed stations found: ${stats.totalSpeedStationsFound}`);
    console.log(`- Total duplicates removed: ${stats.totalDuplicatesRemoved}`);
    console.log(`- Final station count saved: ${stats.finalStationCount}`);
    console.log(`- Time taken: ${stats.timeTaken}`);
    console.log('====================================================\n');
  } catch (error) {
    console.error('BPCL Scraper runner failed:', (error as Error).message);
    process.exit(1);
  }
}

main();

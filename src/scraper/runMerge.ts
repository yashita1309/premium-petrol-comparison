import { mergeIOCLDatasets } from './mergeDatasets';

async function main() {
  try {
    await mergeIOCLDatasets();
    console.log('[Runner] Merge execution completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[Runner] Merge failed with error:', error);
    process.exit(1);
  }
}

main();

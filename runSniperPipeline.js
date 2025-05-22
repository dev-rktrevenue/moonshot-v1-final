const { logEvent } = require('./utils/logger');
const { saveTokenArchive } = require('./archiveWriter');
const scrapePumpFunTokens = require('./utils/tokenScanner');
const runJupiterChecker = require('./utils/puppeteerCheck');
const runTracker = require('./utils/tracker');
const runPerformanceEvaluator = require('./utils/performanceEvaluator');
const runEntryEvaluator = require('./utils/entryEvaluator');
const screenshotPumpFun = require('./screenshotPumpFun');

async function runSniperPipeline() {
  console.log(`🔄 [SNIPER] Running full pipeline: ${new Date().toLocaleTimeString()}`);
  logEvent('SNIPER', 'Running full pipeline');

  try {
    // 🔍 Always run this first to verify page load
    //const screenshotPath = await screenshotPumpFun();
    //if (screenshotPath) {
      //console.log(`📸 Screenshot saved at: ${screenshotPath}`);
    //} else {
      //console.log('⚠️ Screenshot function failed or returned nothing.');
    //}

    const newTokens = await scrapePumpFunTokens();
    if (newTokens.length > 0) {
      console.log(`📦 Found ${newTokens.length} new tokens → checking Jupiter...`);
      logEvent('SCRAPER', `Scraped ${newTokens.length} token(s)`);
      await runJupiterChecker();
      logEvent('JUPITER', 'Checker complete');
    } else {
      console.log('🔍 No new tokens found, skipping Jupiter check.');
    }

    await runTracker();
    logEvent('TRACKER', 'Price tracking complete');

    await runPerformanceEvaluator();
    logEvent('EVALUATOR', 'Performance check complete');

    runEntryEvaluator(); // not async
    logEvent('ENTRY', 'Entry evaluation complete');

    console.log('✅ [SNIPER] Pipeline complete\n');
    logEvent('SNIPER', '✅ Full pipeline complete');
  } catch (err) {
    console.error('❌ [SNIPER] Pipeline error:', err.message);
    logEvent('ERROR', `❌ Pipeline failed: ${err.message}`);
  }
}

module.exports = runSniperPipeline;

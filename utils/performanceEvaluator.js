/**
 * performanceEvaluator.js
 * 
 * Checks tokens in the watchlist that are marked as tradable but not yet alerted.
 * Evaluates their price growth based on checkHistory[].
 * If priceUSD has increased beyond a configured threshold across X snapshots,
 * it flags the token as "alerted" and logs the result.
 */

const fs = require('fs');
const path = require('path');
const { saveTokenArchive } = require('../archiveWriter');

const WATCHLIST_PATH = path.join(__dirname, '../data/watchlist.json');

// Configurable thresholds
const MIN_CHECKS = 3;
const MIN_GAIN_PERCENT = 100; // 100% = 2x gain

function loadWatchlist() {
  if (!fs.existsSync(WATCHLIST_PATH)) return [];
  try {
    const raw = fs.readFileSync(WATCHLIST_PATH, 'utf-8');
    return raw.trim() ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWatchlist(data) {
  fs.writeFileSync(WATCHLIST_PATH, JSON.stringify(data, null, 2));
}

function calculateGainPercent(start, end) {
  if (!start || !end || start <= 0) return 0;
  return ((end - start) / start) * 100;
}

function runEntryEvaluator() {
  console.log('📊 [EVALUATOR] Checking tokens for performance triggers...');

  const tokens = loadWatchlist();
  let flagged = 0;

  for (const token of tokens) {
    if (!token.isTradable || token.alerted) continue;
    if (!Array.isArray(token.checkHistory) || token.checkHistory.length < MIN_CHECKS) continue;

    const firstPrice = token.checkHistory[0]?.priceUSD;
    const lastPrice = token.checkHistory[token.checkHistory.length - 1]?.priceUSD;

    const gain = calculateGainPercent(firstPrice, lastPrice);

    if (gain >= MIN_GAIN_PERCENT) {
      token.alerted = true;
      token.entryPrice = lastPrice;
      token.status = 'alerted';
      flagged++;

      console.log(`🚨 [MATCH] ${token.name} has gained ${gain.toFixed(1)}% over ${token.checkHistory.length} checks!`);
      console.log(`     → Entry Price: $${lastPrice.toFixed(8)}`);
    }
    // 🔽 Add this line to save token snapshot
    saveTokenArchive(token);
  }

  if (flagged > 0) {
    saveWatchlist(tokens);
    console.log(`✅ [EVALUATOR] Flagged ${flagged} token(s) for alert.\n`);
  } else {
    console.log('🟢 [EVALUATOR] No matches this round.\n');
  }
}

module.exports = runEntryEvaluator;
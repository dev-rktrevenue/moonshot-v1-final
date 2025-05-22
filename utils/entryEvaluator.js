const fs = require('fs');
const path = require('path');

const WATCHLIST_PATH = path.join(__dirname, '../data/watchlist.json');

const ENTRY_RULES = {
  minMarketCapUSD: 3000,
  minReplies: 0,
  maxAgeSeconds: 180,
  defaultSupply: 1_000_000_000
};

function loadWatchlist() {
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

function calculatePrice(token) {
  const supply = token.supply || ENTRY_RULES.defaultSupply;
  const priceUSD = token.marketCapUSD / supply;
  token.priceUSD = +priceUSD.toFixed(8);
  return priceUSD;
}

function isEligible(token) {
  const ageSeconds = (Date.now() - new Date(token.createdAt)) / 1000;

  return (
    token.isTradable &&
    !token.alerted &&
    token.marketCapUSD >= ENTRY_RULES.minMarketCapUSD &&
    token.replies >= ENTRY_RULES.minReplies &&
    ageSeconds <= ENTRY_RULES.maxAgeSeconds
  );
}

function runEntryEvaluator() {
  console.log('🧠 [ENTRY] Evaluating token entries...');

  const tokens = loadWatchlist();
  let matches = 0;

  for (const token of tokens) {
    if (isEligible(token)) {
      const priceUSD = calculatePrice(token);
      token.alerted = true;
      token.entryPrice = priceUSD;

      console.log(`🚀 Entry Match: ${token.name} at $${priceUSD.toFixed(8)}`);
      matches++;
    }
  }

  saveWatchlist(tokens);
  console.log(`✅ [ENTRY] Evaluator completed — ${matches} match(es) found.`);
}

module.exports = runEntryEvaluator;
const fs = require('fs');
const path = require('path');

/**
 * Normalize human-readable market cap strings like "4.7K"
 */
function parseMarketCap(raw) {
  if (!raw) return null;
  if (raw.endsWith('K')) return parseFloat(raw) * 1000;
  if (raw.endsWith('M')) return parseFloat(raw) * 1000000;
  return parseFloat(raw.replace(/[^0-9.]/g, ''));
}

/**
 * Saves or updates a token's archive JSON file inside /data/tokens/YYYY-MM-DD/
 * @param {Object} token - The token object from watchlist or pipeline
 */
function saveTokenArchive(token) {
  const now = new Date();
  const dateFolder = now.toISOString().slice(0, 10); // e.g., '2025-05-22'
  const dirPath = path.join(__dirname, 'data/tokens', dateFolder);

  // Sanitize filename
  const safeId = token.id.replace(/[<>:"/\\|?*\[\]\(\)]+/g, '_');
  const filePath = path.join(dirPath, `${safeId}.json`);

  // Ensure folder exists
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Prepare snapshot from token object
  const snapshot = {
    time: now.toISOString(),
    priceSOL: token.priceSOL ?? null,
    priceUSD: token.priceUSD ?? null,
    marketCapUSD: token.marketCapUSD ?? parseMarketCap(token.marketCap),
    volume: token.volume ?? null
  };

  let tokenData = {
    id: token.id,
    name: token.name,
    mint: token.mint,
    createdAt: token.createdAt || now.toISOString(),
    checkHistory: [snapshot]
  };

  // Append to history if file exists
  if (fs.existsSync(filePath)) {
    const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    existing.checkHistory.push(snapshot);
    tokenData = existing;
  }

  // Save file
  fs.writeFileSync(filePath, JSON.stringify(tokenData, null, 2), 'utf-8');
}

module.exports = { saveTokenArchive };

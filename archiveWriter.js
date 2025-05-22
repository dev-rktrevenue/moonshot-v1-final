// archiveWriter.js
const fs = require('fs');
const path = require('path');

/**
 * Saves or updates a token's archive JSON file inside /data/YYYY-MM-DD/
 * @param {Object} token - The token object from watchlist or pipeline
 */
function saveTokenArchive(token) {
  const now = new Date();
  const dateFolder = now.toISOString().slice(0, 10); // e.g., '2025-05-21'
  const dirPath = path.join(__dirname, 'data/tokens', dateFolder);
  
  // Replace unsafe characters with underscores
  const safeId = token.id.replace(/[<>:"/\\|?*\[\]\(\)]+/g, '_');
  const filePath = path.join(dirPath, `${safeId}.json`);

  // Ensure directory exists
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Structure to append
  const snapshot = {
    timestamp: now.toISOString(),
    price: token.price || null,
    marketCap: token.marketCap || null,
    volume: token.volume || null,
    // Add anything else you want to track over time
  };

  let tokenData = {
    id: token.id,
    name: token.name,
    mint: token.mint,
    createdAt: token.createdAt || now.toISOString(),
    checkHistory: [snapshot],
  };

  // If file exists, append to checkHistory
  if (fs.existsSync(filePath)) {
    const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    existing.checkHistory.push(snapshot);
    tokenData = existing;
  }

  // Write to file
  fs.writeFileSync(filePath, JSON.stringify(tokenData, null, 2), 'utf-8');
}

module.exports = { saveTokenArchive };
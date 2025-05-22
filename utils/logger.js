/**
 * logger.js
 * 
 * Provides a simple and consistent log utility.
 * Logs to console and appends to a daily log file.
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../data/logs');

// Ensure logs folder exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function logEvent(source, message) {
  const timestamp = new Date().toISOString();
  const dateStr = timestamp.slice(0, 10); // YYYY-MM-DD
  const logLine = `[${timestamp}] [${source}] ${message}\n`;

  // Log to console
  console.log(logLine.trim());

  // Log to file
  const logFilePath = path.join(LOG_DIR, `system-${dateStr}.log`);
  fs.appendFileSync(logFilePath, logLine, 'utf-8');
}

module.exports = { logEvent };

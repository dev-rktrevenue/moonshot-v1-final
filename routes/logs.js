const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const LOG_DIR = path.join(__dirname, '../data/logs');

// Helper: list latest 14 log files
function getRecentLogs() {
  if (!fs.existsSync(LOG_DIR)) return [];
  return fs.readdirSync(LOG_DIR)
    .filter(f => f.startsWith('system-') && f.endsWith('.log'))
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 14);
}

function loadLogContent(filename) {
  const fullPath = path.join(LOG_DIR, filename);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf-8');
}

router.get('/logs', (req, res) => {
  const logs = getRecentLogs();
  const selected = req.query.file || logs[0];
  const content = selected ? loadLogContent(selected) : '';

  res.render('logs', {
    logs,
    selected,
    content
  });
});

// Add this to routes/logs.js
router.get('/logs/download/:file', (req, res) => {
  const filename = req.params.file;
  const fullPath = path.join(LOG_DIR, filename);

  if (fs.existsSync(fullPath)) {
    res.download(fullPath);
  } else {
    res.status(404).send('Log file not found');
  }
});

module.exports = router;
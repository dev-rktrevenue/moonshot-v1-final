const express = require('express');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const router = express.Router();

const DATA_DIR = path.join(__dirname, '../data/tokens');

function getAvailableDates() {
  return fs.readdirSync(DATA_DIR)
    .filter(name => /^\d{4}-\d{2}-\d{2}$/.test(name))
    .sort((a, b) => b.localeCompare(a)) // Descending
    .slice(0, 14);
}

function loadTokenFiles(date) {
  const folderPath = path.join(DATA_DIR, date);
  if (!fs.existsSync(folderPath)) return [];

  return fs.readdirSync(folderPath)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const fullPath = path.join(folderPath, f);
      try {
        const raw = fs.readFileSync(fullPath, 'utf-8');
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }).filter(Boolean);
}

function tokensToCSV(tokens) {
  const headers = ['name', 'mint', 'createdAt', 'latestPrice', 'checkCount'];
  const rows = tokens.map(t => {
    const latest = t.checkHistory?.[t.checkHistory.length - 1] || {};
    return [
      `"${t.name}"`,
      t.mint,
      t.createdAt,
      latest.price ?? '',
      t.checkHistory?.length ?? 0
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

// Export page UI
router.get('/export', (req, res) => {
  const dates = getAvailableDates();
  const selectedDate = req.query.date || dates[0];
  const tokens = loadTokenFiles(selectedDate);

  res.render('export', {
    dates,
    selectedDate,
    tokenCount: tokens.length
  });
});

// ZIP download
router.get('/export/json/:date.zip', (req, res) => {
  const date = req.params.date;
  const folderPath = path.join(DATA_DIR, date);

  if (!fs.existsSync(folderPath)) return res.status(404).send('Folder not found');

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename=tokens-${date}.zip`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  fs.readdirSync(folderPath)
    .filter(f => f.endsWith('.json'))
    .forEach(file => {
      archive.file(path.join(folderPath, file), { name: file });
    });

  archive.finalize();
});

// CSV download
router.get('/export/csv/:date.csv', (req, res) => {
  const date = req.params.date;
  const tokens = loadTokenFiles(date);
  const csvData = tokensToCSV(tokens);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=tokens-${date}.csv`);
  res.send(csvData);
});

module.exports = router;
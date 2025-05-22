const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const screenshotDir = path.join(__dirname, '../data/screenshots');

router.get('/debug/screenshot', (req, res) => {
  if (!fs.existsSync(screenshotDir)) return res.send('No screenshots taken yet');

  const files = fs.readdirSync(screenshotDir).filter(f => f.endsWith('.png')).sort().reverse();
  const latest = files[0];

  if (!latest) return res.send('No screenshots found');

  const filePath = path.join(screenshotDir, latest);
  res.sendFile(filePath);
});

module.exports = router;
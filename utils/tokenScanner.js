//tokenscanner
const puppeteer = require('puppeteer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const WATCHLIST_PATH = path.join(__dirname, '../data/watchlist.json');

// 🔁 [DISABLED] Get token supply via Solscan — optional, not used for now
// TODO: Re-enable this later if you want accurate per-token supply
async function getTokenSupply(mint) {
  return 0;
}

async function scrapePumpFunTokens() {
  const browser = await puppeteer.launch({
    headless: 'true', // or true depending on version
    args: [
    '--no-sandbox',
    '--disable-setuid-sandbox'
    ]
  });
  const page = await browser.newPage();

  await page.goto('https://pump.fun/board?coins_sort=created_timestamp', {
    waitUntil: 'networkidle0',
    timeout: 60000
  });

  console.log('✅ Page loaded');

  // ✅ Step 1: Wait for modal to render
  await page.waitForSelector('button'); // Any button

  // ✅ Step 2: Click modal button (if it exists)
  await page.evaluate(() => {
    const modalBtn = [...document.querySelectorAll('button')]
      .find(btn => btn.innerText.toLowerCase().includes("i'm ready to pump"));
    if (modalBtn) modalBtn.click();
  });

  // ✅ Step 3: Wait for token cards to load
  await page.waitForSelector('.carousel-card');

  // ✅ Step 4: Small delay to ensure inner DOM is hydrated
  await new Promise(resolve => setTimeout(resolve, 3000));

  // ✅ Step 5: Evaluate page
  const tokens = await page.evaluate(() => {
    const snapshotTime = new Date().toISOString();

    return Array.from(document.querySelectorAll('[id$="pump"]')).map(wrapper => {
      const result = {
        name: '',
        ticker: '',
        mint: '',
        domId: '',
        marketCap: '',
        marketCapUSD: 0,
        replies: 0,
        price: '',
        priceUSD: '',
        supply: '',
        volume: '',
        flagged: false,
        snapshotTime,
        id: '-',
        status: 'unverified',
        verified: false,
        alerted: false,
        entryPrice: 0,
        gainPercent: 0,
        checkedAt: null,
      };

      // ✅ Extract mint from id
      const rawId = wrapper.getAttribute('id');
      result.domId = rawId;
      result.mint = rawId;
      result.cleanMint = rawId.replace(/pump$/, '');

      // ✅ Extract name and ticker from .font-bold
      const nameBlock = wrapper.querySelector('span.font-bold');
      if (nameBlock) {
        const text = nameBlock.innerText.trim().replace(/:$/, '');
        const match = text.match(/^(.+?)\s+\((.+?)\)$/);
        if (match) {
          result.name = match[1].trim();
          result.ticker = `(${match[2].trim()})`;
        } else {
          result.name = text;
        }
      }

      // ✅ Extract lines from all visible text
      const lines = wrapper.innerText.split('\n').map(line => line.trim()).filter(Boolean);

      // ✅ Market Cap
      const capIndex = lines.findIndex(l => l.toLowerCase().includes('market cap'));
      const capValue = capIndex >= 0 && lines[capIndex].includes('$')
        ? lines[capIndex].split('$')[1].trim()
        : '';
      result.marketCap = capValue;
      result.marketCapUSD = capValue
        ? parseFloat(capValue.replace(/,/g, '')) *
          (capValue.includes('M') ? 1_000_000 :
           capValue.includes('K') ? 1_000 :
           capValue.includes('B') ? 1_000_000_000 : 1)
        : 0;

      // ✅ Replies
      const replyLine = lines.find(l => l.toLowerCase().includes('replies'));
      const replyMatch = replyLine?.match(/replies:\s*(\d+)/i);
      result.replies = replyMatch ? parseInt(replyMatch[1]) : 0;

      // ✅ Extract "30m ago" and normalize
      const ageText = wrapper.querySelector('span.w-full, span.xl\\:w-auto')?.innerText?.trim() || '';
      result.createdRaw = ageText;

      if (ageText) {
        const match = ageText.match(/(\d+)\s*(s|m|h|d)/i);
        if (match) {
          const value = parseInt(match[1]);
          const unit = match[2];
          const now = new Date();

          if (unit === 's') now.setSeconds(now.getSeconds() - value);
          if (unit === 'm') now.setMinutes(now.getMinutes() - value);
          if (unit === 'h') now.setHours(now.getHours() - value);
          if (unit === 'd') now.setDate(now.getDate() - value);

          result.createdAt = now.toISOString();
        } else {
          result.createdAt = '';
        }
      } else {
        result.createdAt = '';
      }

      // ✅ Final ID
      result.id = `${result.name}-${result.ticker}`;

      return result;
    });
  });

  console.log("🪙 Tokens found:", tokens.length);
  console.log(tokens.slice(0, 3));

  // 🔄 Load existing watchlist
  let existing = [];
  if (fs.existsSync(WATCHLIST_PATH)) {
    existing = JSON.parse(fs.readFileSync(WATCHLIST_PATH, 'utf-8'));
  }

  // 🧠 Build a Set of existing mint addresses for deduping
  const knownMints = new Set(existing.map(t => t.mint));

  // 🆕 Add only new tokens
  const newTokens = tokens.filter(t => !knownMints.has(t.mint));
  const updatedList = [...existing, ...newTokens];

  console.log(`➕ ${newTokens.length} new tokens added`);

  fs.writeFileSync(WATCHLIST_PATH, JSON.stringify(updatedList, null, 2));

  await browser.close();
  return tokens;
}

module.exports = scrapePumpFunTokens;

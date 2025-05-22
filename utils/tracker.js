const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const axios = require('axios');

const WATCHLIST_PATH = path.join(__dirname, '../data/watchlist.json');

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

async function getSolPrice() {
  try {
    const { data } = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
    );
    return data?.solana?.usd || 0;
  } catch (err) {
    console.warn('⚠️ Failed to fetch SOL price');
    return 0;
  }
}

async function getJupiterQuoteViaPuppeteer(page, mint) {
  const outputMint = 'So11111111111111111111111111111111111111112'; // wSOL
  const amount = '1000000';
  const url = `https://quote-api.jup.ag/v6/quote?inputMint=${mint}&outputMint=${outputMint}&amount=${amount}&slippage=1`;

  try {
    const json = await page.evaluate(async (quoteUrl) => {
      try {
        const res = await fetch(quoteUrl);
        return await res.json();
      } catch (e) {
        return null;
      }
    }, url);

    return json;
  } catch {
    return null;
  }
}

async function runTracker() {
  console.log('📈 [TRACKER] Starting performance snapshot...');

  const tokens = loadWatchlist();
  const solPrice = await getSolPrice();
  let updated = 0;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  for (const token of tokens) {
    if (!token.isTradable || token.alerted) continue;

    const quote = await getJupiterQuoteViaPuppeteer(page, token.mint);
    if (!quote?.outAmount) continue;

    const outAmount = parseFloat(quote.outAmount);
    const priceSOL = outAmount / 1_000_000;
    const priceUSD = priceSOL * solPrice;

    const snapshot = {
      time: new Date().toISOString(),
      priceSOL: +priceSOL.toFixed(9),
      priceUSD: +priceUSD.toFixed(8),
      marketCapUSD: token.marketCapUSD || 0
    };

    token.checkHistory = token.checkHistory || [];
    token.checkHistory.push(snapshot);

    // Limit to last 5 snapshots
    if (token.checkHistory.length > 5) {
      token.checkHistory = token.checkHistory.slice(-5);
    }

    updated++;
    console.log(`📍 Tracked ${token.name}: $${snapshot.priceUSD}`);
  }

  await browser.close();
  saveWatchlist(tokens);
  console.log(`✅ [TRACKER] Updated ${updated} token(s).\n`);
}

module.exports = runTracker;
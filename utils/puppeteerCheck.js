const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const WATCHLIST_PATH = path.join(__dirname, '../data/watchlist.json');

function loadWatchlist() {
  try {
    const raw = fs.readFileSync(WATCHLIST_PATH, 'utf-8');
    return raw.trim() ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('⚠️ [CHECKER] Failed to load watchlist.json');
    return [];
  }
}

function saveWatchlist(data) {
  fs.writeFileSync(WATCHLIST_PATH, JSON.stringify(data, null, 2));
}

async function checkTokenTradability(token, page) {
  const inputMint = token.mint;
  const outputMint = 'So11111111111111111111111111111111111111112'; // wSOL
  const amount = '1000000';
  const slippage = 1;

  const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippage=${slippage}`;

  console.log(`🔍 Checking token: ${token.name || 'Unnamed'} (${inputMint})`);

  try {
    const response = await page.evaluate(async (url) => {
      try {
        const res = await fetch(url);
        return await res.json();
      } catch (err) {
        return null;
      }
    }, quoteUrl);

    token.checkedAt = new Date().toISOString();

    if (response?.routePlan?.length > 0) {
      console.log(`✅ Tradable! Route found via: ${response.routePlan[0].swapInfo?.label || 'Unknown'}`);
      console.log('📦 Route Plan:\n', JSON.stringify(response.routePlan, null, 2));

      token.isTradable = true;
      token.status = 'tradable';
      token.verified = true;
    } else {
      console.log(`❌ No route found for ${token.name}`);
      token.isTradable = false;
    }
  } catch (err) {
    console.error(`❌ Error checking ${token.name}:`, err.message);
    token.checkedAt = new Date().toISOString();
    token.isTradable = false;
  }
}


async function runJupiterChecker() {
  console.log('\n🔎 [CHECKER] Starting Jupiter tradability check...');

  const tokens = loadWatchlist();
  const toCheck = tokens.filter(t => !t.isTradable && !t.checkedAt);

  if (!toCheck.length) {
    console.log('✅ No new tokens to check.\n');
    return;
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  for (const token of toCheck) {
    try {
      await checkTokenTradability(token, page);
    } catch (err) {
      console.error(`❌ [CHECKER] Error with token ${token.name}:`, err.message);
    }
  }

  await browser.close();

  // Save updated watchlist
  saveWatchlist(tokens);
  console.log(`📥 [CHECKER] Updated ${toCheck.length} token(s).\n`);
}

module.exports = runJupiterChecker;
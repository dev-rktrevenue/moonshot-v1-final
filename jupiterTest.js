const puppeteer = require('puppeteer');

async function checkTokenTradability(token) {
  const inputMint = token.mint;
  const outputMint = 'So11111111111111111111111111111111111111112'; // wSOL
  const amount = '1000000';
  const slippage = 1;

  const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippage=${slippage}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  console.log(`🔎 Checking token: ${token.name || 'Unnamed'} (${inputMint})`);

  try {
    let tradable = false;
    let fullResponse = null;

    page.once('response', async (response) => {
      const req = response.request();
      if (req.url().includes('/v6/quote') && response.ok()) {
        try {
          const json = await response.json();
          fullResponse = json;
          if (json?.routePlan?.length > 0) {
            tradable = true;
            console.log(`✅ Tradable! Route found via: ${json.routePlan[0]?.swapInfo?.label || 'Unknown AMM'}`);
            console.log('📦 Route Plan:\n', JSON.stringify(json.routePlan, null, 2));
          } else {
            console.log('❌ No route found — not tradable.');
          }
        } catch (e) {
          console.log('❌ Failed to parse Jupiter JSON.');
        }
      }
    });

    await page.goto(quoteUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });

    await new Promise(resolve => setTimeout(resolve, 4000)); // wait for response

    await browser.close();

    return tradable;
  } catch (err) {
    console.error('❌ Error during tradability check:', err.message);
    await browser.close();
    return false;
  }
}

// Example token to test
const token = {
  name: 'In Memory Of',
  mint: '8UcmMe78TnNu48j7wV5of9ucEtfTyp2Ee7YoKqxepump'
};

checkTokenTradability(token);
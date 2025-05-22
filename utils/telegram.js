const axios = require('axios');
require('dotenv').config();

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_API_KEY}/sendMessage`;

async function sendTelegramMessage(message) {
  try {
    const res = await axios.post(TELEGRAM_API, {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    });
    console.log('✅ Telegram message sent');
  } catch (err) {
    console.error('❌ Telegram error:', err.message);
  }
}

module.exports = { sendTelegramMessage };
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const imaps = require('imap-simple');

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Helper function to send messages to your Telegram
async function sendTelegram(message) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    });
  } catch (err) {
    console.error('Failed to send Telegram message:', err.response?.data || err.message);
  }
}

// -------------------------------------------------------------
// 1. GITHUB WEBHOOK ENDPOINT
// -------------------------------------------------------------
app.post('/github-webhook', (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;

  let msg = `🐙 *GitHub Alert: ${event}*\n`;

  if (event === 'push') {
    const pusher = payload.pusher ? payload.pusher.name : 'Unknown';
    const repo = payload.repository ? payload.repository.name : 'Unknown Repo';
    const commitsCount = payload.commits ? payload.commits.length : 0;
    msg += `👤 *Pushed by:* ${pusher}\n📁 *Repo:* ${repo}\n🔢 *Commits:* ${commitsCount}`;
  } else if (event === 'issues') {
    msg += `📌 *Issue:* ${payload.issue.title}\n⚡ *Action:* ${payload.action}`;
  } else if (event === 'pull_request') {
    msg += `🔀 *PR:* ${payload.pull_request.title}\n⚡ *Action:* ${payload.action}`;
  } else if (event === 'star') {
    msg += `⭐ *New Star by:* ${payload.sender.login}`;
  } else {
    msg += `Triggered on: ${payload.repository?.name || 'Repository'}`;
  }

  sendTelegram(msg);
  res.status(200).send('OK');
});


const imapConfig = {
  imap: {
    user: process.env.GMAIL_USER,
    password: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, ''), // removes spaces if any
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 10000
  }
};


// Keep track of emails we already notified you about
const notifiedEmailIds = new Set();

async function checkGmail() {
  try {
    const connection = await imaps.connect(imapConfig);
    await connection.openBox('INBOX');

    // ONLY search for UNREAD emails in the PRIMARY category (ignores Social, Promotions, Updates)
    const searchCriteria = [
      ['X-GM-RAW', 'is:unread category:primary']
    ];
    const fetchOptions = { 
      bodies: ['HEADER'], 
      markSeen: true 
    };

    const messages = await connection.search(searchCriteria, fetchOptions);

    for (let item of messages) {
      const uid = item.attributes.uid;

      // Skip if we already sent you a notification for this email
      if (notifiedEmailIds.has(uid)) {
        continue;
      }
      notifiedEmailIds.add(uid);

      const header = item.parts.find(p => p.which === 'HEADER')?.body;
      const subject = header?.subject ? header.subject[0] : '(No Subject)';
      const from = header?.from ? header.from[0] : 'Unknown Sender';

      await sendTelegram(`📧 *New Primary Email!*\n\n👤 *From:* ${from}\n📝 *Subject:* ${subject}`);
    }

    connection.end();
  } catch (err) {
    console.error('Gmail check error:', err.message);
  }
}


// -------------------------------------------------------------
// 3. TELEGRAM BOT COMMAND HANDLER (/clean)
// -------------------------------------------------------------
app.post('/telegram-webhook', async (req, res) => {
  const body = req.body;

  // Check if user sent a message
  if (body.message && body.message.text) {
    const text = body.message.text.trim().toLowerCase();
    const currentMsgId = body.message.message_id;
    const chatId = body.message.chat.id;

    // Check if command is /clean or /clear
    if (text.startsWith('/clean') || text.startsWith('/clear')) {
      // Delete the last 25 messages backwards from the /clean command
      const count = 25;
      for (let i = 0; i <= count; i++) {
        const idToDelete = currentMsgId - i;
        try {
          await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`, {
            chat_id: chatId,
            message_id: idToDelete
          });
        } catch (e) {
          // Ignore errors for messages that can't be deleted or don't exist
        }
      }

      // Send a confirmation and delete it after 4 seconds
      try {
        const confirmMsg = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          chat_id: chatId,
          text: '🧹 *Chat cleaned up!*',
          parse_mode: 'Markdown'
        });

        setTimeout(async () => {
          await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`, {
            chat_id: chatId,
            message_id: confirmMsg.data.result.message_id
          });
        }, 4000);
      } catch (err) {}
    }
  }

  res.status(200).send('OK');
});

// Check Gmail every 30 seconds
setInterval(checkGmail, 30 * 1000);


app.get('/', (req, res) => {
  res.send('Telegram Notifier Bot is running! 🚀');
});

// Use Render's port or default to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await sendTelegram('🚀 *Bot is online on Render!* Listening for GitHub & Gmail.');
  checkGmail();
});
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const imaps = require('imap-simple');

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Catch unexpected errors so the server NEVER crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason?.message || reason);
});

// Helper: Send Telegram message (Markdown) — unchanged, still used by email + startup
async function sendTelegram(message) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    });
  } catch (err) {
    console.error('Failed to send Telegram message:', err.response?.data?.description || err.message);
  }
}

// -------------------------------------------------------------
// NEW: HTML-mode senders for the rich GitHub notifications
// -------------------------------------------------------------
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

async function sendTelegramHTML(text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });
  } catch (err) {
    console.error('Failed to send Telegram HTML message:', err.response?.data?.description || err.message);
  }
}

async function sendTelegramPhoto(photoUrl, caption) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      photo: photoUrl,
      caption,
      parse_mode: 'HTML'
    });
  } catch (err) {
    console.error('Failed to send Telegram photo, falling back to text:', err.response?.data?.description || err.message);
    // Avatar failed to load/send — never lose the notification, just send it as text
    await sendTelegramHTML(caption);
  }
}

// -------------------------------------------------------------
// NEW: Build a rich, per-event GitHub notification
// -------------------------------------------------------------
function buildGithubNotification(event, payload) {
  const sender = payload.sender || {};
  const avatarUrl = sender.avatar_url || null;
  const repo = payload.repository || {};
  const repoName = escapeHtml(repo.full_name || repo.name || 'Unknown repo');
  const repoUrl = repo.html_url || '#';
  const senderName = escapeHtml(sender.login || 'Unknown');

  let caption;

  switch (event) {
    case 'push': {
      const branch = (payload.ref || '').replace('refs/heads/', '');
      const pusher = escapeHtml(payload.pusher?.name || senderName);
      const commits = payload.commits || [];
      const commitLines = commits.slice(-5).reverse().map(c => {
        const sha = (c.id || '').slice(0, 7);
        const msg = escapeHtml(truncate((c.message || '').split('\n')[0], 60));
        return `• <code>${sha}</code> ${msg}`;
      }).join('\n');

      caption =
        `🚀 <b>New Push</b>\n` +
        `📁 <a href="${repoUrl}">${repoName}</a>\n` +
        `🌿 Branch: <code>${escapeHtml(branch)}</code>\n` +
        `👤 By: <b>${pusher}</b>\n` +
        `🔢 Commits: ${commits.length}\n\n` +
        (commitLines || '<i>No commit details</i>') +
        (payload.compare ? `\n\n<a href="${payload.compare}">View full diff →</a>` : '');
      break;
    }

    case 'pull_request': {
      const pr = payload.pull_request || {};
      const action = payload.action;
      const merged = pr.merged;
      let icon = '🔀';
      let label = `Pull Request ${escapeHtml(action)}`;
      if (action === 'closed' && merged) { icon = '✅'; label = 'Pull Request Merged'; }
      else if (action === 'closed') { icon = '❌'; label = 'Pull Request Closed'; }
      else if (action === 'opened') { icon = '🆕'; label = 'New Pull Request'; }

      caption =
        `${icon} <b>${label}</b>\n` +
        `📁 <a href="${repoUrl}">${repoName}</a>\n` +
        `📌 <b>${escapeHtml(pr.title || '')}</b> <code>#${pr.number}</code>\n` +
        `👤 By: <b>${senderName}</b>\n` +
        `🌿 <code>${escapeHtml(pr.head?.ref || '?')}</code> → <code>${escapeHtml(pr.base?.ref || '?')}</code>\n\n` +
        `<a href="${pr.html_url}">View Pull Request →</a>`;
      break;
    }

    case 'issues': {
      const issue = payload.issue || {};
      caption =
        `📋 <b>Issue ${escapeHtml(payload.action)}</b>\n` +
        `📁 <a href="${repoUrl}">${repoName}</a>\n` +
        `📌 <b>${escapeHtml(issue.title || '')}</b> <code>#${issue.number}</code>\n` +
        `👤 By: <b>${senderName}</b>\n\n` +
        `<a href="${issue.html_url}">View Issue →</a>`;
      break;
    }

    case 'star': {
      if (payload.action !== 'created') return null; // skip "unstar" noise
      caption =
        `⭐ <b>New Star!</b>\n` +
        `📁 <a href="${repoUrl}">${repoName}</a>\n` +
        `👤 By: <b>${senderName}</b>\n` +
        `🌟 Total stars: ${repo.stargazers_count ?? '?'}`;
      break;
    }

    case 'fork': {
      const forkee = payload.forkee || {};
      caption =
        `🍴 <b>New Fork!</b>\n` +
        `📁 <a href="${repoUrl}">${repoName}</a>\n` +
        `👤 By: <b>${senderName}</b>\n` +
        `↳ <a href="${forkee.html_url || '#'}">${escapeHtml(forkee.full_name || '')}</a>`;
      break;
    }

    case 'watch': {
      if (payload.action !== 'started') return null;
      caption =
        `👀 <b>New Watcher</b>\n` +
        `📁 <a href="${repoUrl}">${repoName}</a>\n` +
        `👤 By: <b>${senderName}</b>`;
      break;
    }

    case 'release': {
      const release = payload.release || {};
      caption =
        `📦 <b>New Release</b>\n` +
        `📁 <a href="${repoUrl}">${repoName}</a>\n` +
        `🏷 <b>${escapeHtml(release.tag_name || '')}</b>\n` +
        `👤 By: <b>${senderName}</b>\n\n` +
        `<a href="${release.html_url || '#'}">View Release →</a>`;
      break;
    }

    default: {
      caption =
        `🐙 <b>GitHub Event: ${escapeHtml(event)}</b>\n` +
        `📁 <a href="${repoUrl}">${repoName}</a>\n` +
        `👤 By: <b>${senderName}</b>`;
    }
  }

  return { caption, avatarUrl };
}

// -------------------------------------------------------------
// 1. GITHUB WEBHOOK ENDPOINT (upgraded: real avatars + rich formatting)
// -------------------------------------------------------------
app.post('/github-webhook', (req, res) => {
  res.status(200).send('OK'); // Reply immediately

  const event = req.headers['x-github-event'];
  const payload = req.body;

  try {
    const result = buildGithubNotification(event, payload);
    if (!result) return; 

    const { caption, avatarUrl } = result;

    if (avatarUrl) {
      sendTelegramPhoto(avatarUrl, caption);
    } else {
      sendTelegramHTML(caption);
    }
  } catch (err) {
    console.error('Error building GitHub notification:', err.message);
    sendTelegramHTML(`🐙 <b>GitHub Alert:</b> ${escapeHtml(event)} (formatting error — check logs)`);
  }
});

// -------------------------------------------------------------
// 2. GMAIL CHECKER — unchanged
// -------------------------------------------------------------
const imapConfig = {
  imap: {
    user: process.env.GMAIL_USER,
    password: process.env.GMAIL_APP_PASSWORD ? process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '') : '',
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 10000
  }
};

const notifiedEmailIds = new Set();

async function checkGmail() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;

  try {
    const connection = await imaps.connect(imapConfig);
    await connection.openBox('INBOX');

    const searchCriteria = [['X-GM-RAW', 'is:unread category:primary']];
    const fetchOptions = { bodies: ['HEADER'], markSeen: true };

    const messages = await connection.search(searchCriteria, fetchOptions);

    for (let item of messages) {
      const uid = item.attributes.uid;
      if (notifiedEmailIds.has(uid)) continue;
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
// 3. TELEGRAM BOT COMMAND HANDLER (/clean) — unchanged
// -------------------------------------------------------------
app.post('/telegram-webhook', (req, res) => {
  res.status(200).send('OK');

  const body = req.body;
  if (!body?.message?.text) return;

  const text = body.message.text.trim().toLowerCase();
  const currentMsgId = body.message.message_id;
  const chatId = body.message.chat.id;

  if (text.startsWith('/clean') || text.startsWith('/clear')) {
    (async () => {
      const deletePromises = [];
      for (let i = 0; i <= 25; i++) {
        deletePromises.push(
          axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`, {
            chat_id: chatId,
            message_id: currentMsgId - i
          }).catch(() => {}) 
        );
      }
      await Promise.all(deletePromises);

      try {
        const confirmMsg = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          chat_id: chatId,
          text: '🧹 *Chat cleaned up!*',
          parse_mode: 'Markdown'
        });

        setTimeout(() => {
          axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`, {
            chat_id: chatId,
            message_id: confirmMsg.data.result.message_id
          }).catch(() => {});
        }, 4000);
      } catch (e) {}
    })();
  }
});



app.get('/', (req, res) => {
  res.send('Telegram Notifier Bot is running! 🚀');
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await sendTelegram('🚀 *Bot is online!* Listening for GitHub & Gmail.');
});
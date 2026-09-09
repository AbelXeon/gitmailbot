# 🤖 GitMailBot

A lightweight, 24/7 Telegram notification bot that sends instant alerts to your Telegram chat whenever:
- 🐙 **GitHub Events Occur:** Pushes, new Pull Requests, Issues, or Stars.
- 📧 **Primary Emails Arrive:** New, unread personal emails in your Gmail inbox (ignoring promotions and social clutter).

---

## ✨ Features

- **GitHub Webhook Integration:** Instant notifications for commits, issues, pull requests, and repository stars.
- **Smart Gmail Filter:** Only notifies you about **Primary Inbox** emails—no spam, marketing, or promotional distractions.
- **Zero Cost & Resource-Friendly:** Designed to run seamlessly on Render's free tier and Google Apps Script without exhausting free server hours.
- **Clean Markdown Formatting:** Easy-to-read, formatted Telegram notifications with sender details and actionable summaries.

---

## 🛠️ Tech Stack

- **Runtime:** [Node.js](https://nodejs.org/)
- **Server:** [Express](https://expressjs.com/)
- **HTTP Client:** [Axios](https://axios-http.com/)
- **Email Automation:** Google Apps Script / IMAP
- **Alert Channel:** [Telegram Bot API](https://core.telegram.org/bots/api)
- **Hosting:** [Render](https://render.com/)

---

## 🚀 Quick Setup & Installation

### 1. Clone the Repository

git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
npm install
2. Configure Environment Variables
Create a .env file in the root directory:
Env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password
How to get these keys:
TELEGRAM_BOT_TOKEN: Create a bot with @BotFather on Telegram.
TELEGRAM_CHAT_ID: Get your user ID from @userinfobot.
GMAIL_APP_PASSWORD: Generate one via Google Account Security > App Passwords.
3. Run Locally
node index.js
🌐 Free Deployment (Render)
Push this repository to GitHub.
Sign in to Render and create a new Web Service.
Connect your repository and configure:
Runtime: Node
Build Command: npm install
Start Command: node index.js
Instance Type: Free
Add your .env variables under Environment Variables.
Deploy to get your live webhook URL: https://your-app-name.onrender.com.
🔗 Connecting GitHub Webhooks
Go to your GitHub repository -> Settings -> Webhooks -> Add webhook.
Payload URL: https://your-app-name.onrender.com/github-webhook
Content type: application/json
Events: Choose Send me everything or select specific events (Pushes, Issues, Pull Requests, Stars).
Click Add webhook.
📧 Gmail Automation (Google Apps Script)
To avoid keeping a server awake 24/7, Gmail notifications run via a free time-driven Google Apps Script:
Open Google Apps Script and create a new project.
Paste the notification trigger script configured with your TELEGRAM_BOT_TOKEN and CHAT_ID.
Add a Time-driven trigger to run checkGmailAndNotify every 5 minutes.
📄 License
This project is open-source and available under the MIT License.
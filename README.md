# 🤖 GitMailBot

A lightweight Telegram notification bot that sends instant alerts to your Telegram chat whenever important GitHub activity occurs or new personal emails arrive in your Gmail inbox.

GitMailBot is designed to be simple, resource-friendly, and capable of running continuously using free-tier services.

---

## ✨ Features

### 🐙 GitHub Event Notifications

Receive instant Telegram notifications for important GitHub events, including:

* 🚀 Push events and commits
* 🔀 New pull requests
* 🐛 New issues
* ⭐ Repository stars

### 📧 Smart Gmail Notifications

Receive notifications for new unread emails in your Gmail inbox while avoiding unnecessary clutter.

The Gmail automation can be configured to focus on important personal emails and ignore categories such as:

* Promotions
* Social
* Spam

### ⚡ Lightweight and Resource-Friendly

GitMailBot is designed to minimize server resource usage by combining:

* GitHub Webhooks for instant GitHub notifications
* Google Apps Script for Gmail automation
* Telegram Bot API for notifications
* Free-tier hosting platforms such as Render

### 📱 Clean Telegram Notifications

Notifications are formatted for easy reading and can include:

* Sender information
* Repository details
* Event type
* Commit information
* Pull request details
* Issue details
* Email summaries

---

## 🛠️ Tech Stack

* **Runtime:** [Node.js](https://nodejs.org/)
* **Server:** [Express](https://expressjs.com/)
* **HTTP Client:** [Axios](https://axios-http.com/)
* **Email Automation:** Google Apps Script / Gmail API or IMAP
* **Notification Channel:** [Telegram Bot API](https://core.telegram.org/bots/api)
* **Hosting:** [Render](https://render.com/)
* **Repository Integration:** GitHub Webhooks

---

## 🚀 Quick Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repo-name.git
```

Move into the project directory:

```bash
cd your-repo-name
```

Install the required dependencies:

```bash
npm install
```

---

## ⚙️ Configure Environment Variables

Create a `.env` file in the root directory of the project.

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password
```

### 🔑 How to Get the Required Credentials

#### TELEGRAM_BOT_TOKEN

1. Open Telegram.
2. Search for `@BotFather`.
3. Create a new bot.
4. Copy the bot token provided by BotFather.
5. Add it to your `.env` file.

```env
TELEGRAM_BOT_TOKEN=your_bot_token
```

---

#### TELEGRAM_CHAT_ID

You need your Telegram chat or user ID.

You can obtain it using a Telegram ID bot such as `@userinfobot`.

Add the ID to your `.env` file:

```env
TELEGRAM_CHAT_ID=your_chat_id
```

---

#### GMAIL_APP_PASSWORD

To connect Gmail securely, create a Google App Password.

1. Open your Google Account settings.
2. Go to **Security**.
3. Enable **2-Step Verification**.
4. Open **App Passwords**.
5. Create an app password.
6. Copy the generated 16-character password.

Add it to your `.env` file:

```env
GMAIL_APP_PASSWORD=your_16_character_app_password
```

> ⚠️ Never share your `.env` file or upload it to GitHub.

---

## 💻 Run the Project Locally

Start the application with:

```bash
node index.js
```

If your project uses a custom start script, you can also run:

```bash
npm start
```

The server should now start locally.

---

# 🌐 Deploying to Render

You can deploy GitMailBot using Render.

### 1. Push the Project to GitHub

Initialize Git if necessary:

```bash
git init
```

Add your files:

```bash
git add .
```

Commit your project:

```bash
git commit -m "Initial commit"
```

Push the project to GitHub.

> ⚠️ Make sure `.env` is included in your `.gitignore` file.

Example:

```gitignore
node_modules
.env
```

---

### 2. Create a Render Web Service

1. Sign in to [Render](https://render.com/).
2. Click **New**.
3. Select **Web Service**.
4. Connect your GitHub repository.
5. Configure the service.

Use the following settings:

| Setting       | Value           |
| ------------- | --------------- |
| Runtime       | Node            |
| Build Command | `npm install`   |
| Start Command | `node index.js` |
| Instance Type | Free            |

---

### 3. Add Environment Variables

In your Render dashboard, open your service and add the environment variables from your `.env` file.

For example:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password
```

After deployment, Render will provide a public URL similar to:

```text
https://your-app-name.onrender.com
```

---

# 🔗 Connecting GitHub Webhooks

GitHub Webhooks allow GitMailBot to receive repository events instantly.

### 1. Open Your GitHub Repository

Go to:

```text
Repository → Settings → Webhooks
```

Click:

```text
Add webhook
```

---

### 2. Configure the Webhook

Set the Payload URL to:

```text
https://your-app-name.onrender.com/github-webhook
```

Set:

```text
Content type: application/json
```

Then choose the events you want GitMailBot to monitor.

You can either select:

```text
Send me everything
```

Or select specific events such as:

* Pushes
* Pull Requests
* Issues
* Stars

Click:

```text
Add webhook
```

GitHub events should now be sent to your GitMailBot server.

---

# 📧 Gmail Automation

To avoid keeping a server running continuously just to check Gmail, GitMailBot can use Google Apps Script.

Google Apps Script can periodically check your Gmail inbox and send Telegram notifications when new important emails arrive.

### Setup

1. Open [Google Apps Script](https://script.google.com/).
2. Create a new project.
3. Add the Gmail notification script.
4. Configure your Telegram Bot Token and Chat ID.
5. Create a time-driven trigger.

The trigger should run:

```text
checkGmailAndNotify
```

For example, you can configure it to run every:

```text
5 minutes
```

This allows Gmail notifications without requiring your Node.js server to constantly check your inbox.

---

## 📁 Example Project Structure

```text
GitMailBot/
│
├── index.js
├── package.json
├── package-lock.json
├── .env
├── .gitignore
│
├
│   
│   
│   
│
└── README.md
```

The exact structure may vary depending on how the project is organized.

---

## 🔒 Security

Never commit sensitive credentials to GitHub.

Your `.gitignore` file should include:

```gitignore
node_modules
.env
```

Keep the following credentials private:

* Telegram Bot Token
* Telegram Chat ID
* Gmail App Password
* GitHub Webhook Secret

If a credential is accidentally exposed, revoke or regenerate it immediately.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

## ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.

---

Made with ❤️ using Node.js, GitHub Webhooks, Gmail Automation, and the Telegram Bot API.

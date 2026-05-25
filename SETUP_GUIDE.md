# BulkSMS Pro — Setup Guide

## Step 1: Install Node.js (ONE TIME)

1. Go to **https://nodejs.org**
2. Click the big green **"LTS"** button to download
3. Run the installer — click Next → Next → Install
4. Restart your computer after installation

---

## Step 2: Get Your Arkesel API Key

1. Go to **https://arkesel.com** and click **Sign Up**
2. Fill in your details and verify your email
3. Log in to your **Arkesel Dashboard**
4. Go to **Settings → API Keys**
5. Click **"Generate API Key"** and **copy** it

---

## Step 3: Configure Your API Key

Open this file in Notepad:
```
C:\Users\gaisi\bulk-sms-app\backend\.env
```

Replace the placeholder with your real values:
```
ARKESEL_API_KEY=paste_your_key_here
ARKESEL_SENDER_ID=YourName
PORT=5000
```

> **Sender ID rules:** Max 11 characters, no spaces. Examples: `MyBusiness`, `InfoAlert`, `Promo2024`

---

## Step 4: Run the App

Double-click **`START.bat`** in the `bulk-sms-app` folder.

OR open two PowerShell windows:

**Window 1 (Backend):**
```powershell
cd C:\Users\gaisi\bulk-sms-app\backend
npm install
node server.js
```

**Window 2 (Frontend):**
```powershell
cd C:\Users\gaisi\bulk-sms-app\frontend
npm install
npm run dev
```

Then open your browser at: **http://localhost:3000**

---

## Features

| Feature | How to use |
|---|---|
| **Bulk SMS** | Go to Send SMS → paste numbers or upload CSV |
| **Contact Groups** | Go to Groups → create groups, then assign contacts |
| **Schedule SMS** | On Send SMS page → toggle "Schedule" → pick date & time |
| **Delivery Reports** | Shown in Reports page after webhook is configured |
| **History** | See all campaigns + per-recipient delivery logs |
| **Balance** | Shown on Dashboard and Settings page |

---

## Webhook Setup (for delivery reports)

To see real-time delivery reports from Arkesel:

1. Log in to **Arkesel Dashboard**
2. Go to **Settings → Webhooks**
3. Set the webhook URL to: `http://YOUR_IP:5000/api/webhooks/delivery`
4. For local testing, use **ngrok**: `ngrok http 5000` → copy the HTTPS URL

---

## Phone Number Format

Numbers must be in international format **without the + sign**:
- Ghana: `233244123456` (not `0244123456`)
- Nigeria: `2348012345678`
- Kenya: `254712345678`

# Budget

A fast, minimalist mobile Progressive Web App (PWA) for logging personal budget transactions into Google Sheets in under 3 seconds.

- **Live Web App**: [https://cstarke.github.io/budget/](https://cstarke.github.io/budget/)
- **Template Google Sheet**: [Open Template Sheet](https://docs.google.com/spreadsheets/d/1yXEnIhxK6SO3pDj4v95o7j1bE9WUIdmtRpuC8A2VaDA/edit?usp=sharing)

---

## Features

- ⚡ **3-Second Entry**: Cent-by-cent keypad input, automatic sentence-casing, and one-tap date toggles (*Today*, *Yesterday*, *Custom*).
- 🔄 **Smart Account Swapping**: Automatically swaps `From` and `To` if you select the matching account, with auto-clearing for conflicting Income ➔ Spending selections.
- 📊 **Live Sheet Sync**: "Recent Transactions" reads your sheet in real-time, color-coded by flow direction (Red = Spending, Green = Income, Yellow = Transfer).
- 🛡️ **Formula-Safe Undo**: "Undo Last Transaction" clears only the transaction cells (Columns A–F), leaving running balance formulas in Columns G+ completely intact without `#REF!` errors.
- 📴 **Offline Ready**: Auto-queues transactions when offline and syncs seamlessly when your connection is restored.
- 📱 **Installable PWA**: Works on iOS and Android as a standalone fullscreen app with zero app store downloads.

---

## Setup Guide (3 Minutes)

Anyone can use this with their own Google account for free:

### 1. Copy the Google Sheet Template
1. Open the [Budget Template Sheet](https://docs.google.com/spreadsheets/d/1yXEnIhxK6SO3pDj4v95o7j1bE9WUIdmtRpuC8A2VaDA/edit?usp=sharing).
2. Click **File ➔ Make a copy** to save your personal version.
3. *(The backend Google Apps Script is already pre-installed inside the template!)*

### 2. Deploy the Web App
1. In your copied Google Sheet, open **Extensions ➔ Apps Script**.
2. Click **Deploy ➔ New deployment**.
3. Click the gear icon ⚙ (next to *Select type*) and choose **Web app**.
4. Configure the settings:
   - **Description**: `Budget App Backend`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone` *(required for your phone's web app to communicate with your sheet)*
5. Click **Deploy**, authorize permissions when prompted, and **copy the Web App URL** (ends in `/exec`).

> [!TIP]
> If you ever update the script code in the future, go to **Deploy ➔ Manage deployments ➔ Edit ➔ New version ➔ Deploy** to push the changes live.

### 3. Connect the Mobile App
1. On your phone, open [https://cstarke.github.io/budget/](https://cstarke.github.io/budget/).
2. Tap **Settings ⚙** (top right).
3. Paste your copied **Web App URL** and tap **Save & Connect**.
4. Tap **Sync Dropdown Chips Now** to load your categories directly from your sheet.
5. *(Optional)* Set persistent defaults (`Category`, `From`, `To`) in Settings for even faster logging.
6. Install to your home screen:
   - **Android (Chrome/Firefox)**: Tap `⋮` ➔ **Install app** (or *Add to Home screen*).
   - **iOS (Safari)**: Tap Share icon ➔ **Add to Home Screen**.

---

## How It Works

* **`Budget {Current Year}` Tab**: Where your transactions live. Columns A–F store `Date`, `Description`, `Category`, `From`, `To`, and `Amount`. Columns G+ store your running account calculations.
* **`Category` Tab**: Contains your dropdown lists for `Category`, `From`, and `To`. You can add, edit, or reorder items in this tab anytime, and the app adapts dynamically.
* **Google Apps Script**: Runs entirely within your Google account. No external servers, no third-party tracking, and 100% free.

---

## Repository Structure

```
budget/
├── index.html                  # Mobile PWA interface
├── style.css                   # Mobile-first dark theme & styles
├── app.js                      # Core app logic, offline sync & API client
├── sw.js                       # Service worker for offline caching
├── manifest.json               # Web App Manifest
├── icons/                      # App icons & SVGs
│   ├── icon.svg                # Full circular PWA app icon
│   └── brand-logo.svg          # Frameless transparent header logo
└── google-apps-script/
    └── Code.gs                 # Full Apps Script backend source code
```

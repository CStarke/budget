# Budget

A fast, lightweight mobile Progressive Web App (PWA) for logging personal budget transactions directly into your private Google Sheet.

- **Live Web App**: [https://cstarke.github.io/budget/](https://cstarke.github.io/budget/)
- **Template Google Sheet**: [Open Template Sheet](https://docs.google.com/spreadsheets/d/1Ra6J_dwINj5S3B-5Iivj5pT54gsHry-zgPWv08lSOkA/edit?usp=sharing)

---

## Overview

Budget is designed for frictionless personal expense tracking. It pairs a mobile web interface with your personal Google Sheet:

- **Complete Data Privacy**: Your financial data lives entirely inside your private Google Drive. There are no third-party databases, user accounts, or subscription fees.
- **Fast Mobile Interface**: Optimized for one-handed mobile entry with an intuitive numeric keypad, smart date shortcuts (Today, Yesterday, or Custom), and instant category selection chips.
- **Quick Fill Wheel**: A customizable preset wheel for recurring daily purchases with saved amounts, categories, and account tags.
- **Live Sync & History**: View recent transactions directly from your sheet, color-coded by flow direction (Spending, Income, Transfer). Edit any transaction in-place or undo entries directly from the app.
- **Offline Support**: Transactions logged without an internet connection are saved locally on your phone and automatically synced to your sheet once your connection is restored.
- **Multi-Year Support**: Built-in annual rollover sheets allow multi-year budget tracking without breaking historical calculations.

---

## System Architecture

The system consists of three parts working together:

1. **Mobile Web App (Frontend)**: Runs locally in your mobile browser as an installable Progressive Web App (PWA). Caches dropdown options and queues transactions offline.
2. **Google Apps Script (Backend API)**: A lightweight script hosted inside your copied Google Sheet that receives requests from the mobile app, determines the correct annual sheet, validates inputs, and writes transactions chronologically.
3. **Google Sheet (Database & Calculations)**: Stores transaction rows, calculates running account balances, tracks annual categories, and powers visual dashboard summaries.

---

## Step-by-Step Setup Guide

Follow these steps to connect your personal Google Sheet to the mobile app:

### Step 1: Copy the Google Sheet Template

1. Open the [Budget Template Sheet](https://docs.google.com/spreadsheets/d/1Ra6J_dwINj5S3B-5Iivj5pT54gsHry-zgPWv08lSOkA/edit?usp=sharing).
2. Click **File > Make a copy** to save a personal copy to your Google Drive.
3. The backend Google Apps Script code is already pre-installed inside this copied sheet.

![Google Sheet Template Overview](docs/images/01-google-sheet-template.png)

---

### Step 2: Deploy the Google Apps Script Web App

1. In your copied Google Sheet, open **Extensions > Apps Script**.
2. *(Recommended)* On the left sidebar, click the **+** button next to **Services**, select **Google Sheets API**, and click **Add**. This provides direct access to Google's native table engine.
3. Click the blue **Deploy** button in the top right and select **New deployment**.
4. In the deployment dialog, click the gear icon (next to *Select type*) and choose **Web app**.
5. Configure the deployment settings:
   - **Description**: `Budget Backend` (or your preferred name)
   - **Execute as**: `Me (<your-email>)`
   - **Who has access**: `Anyone` *(Required so your mobile browser can communicate with the script without requiring OAuth logins on your phone. Your sheet remains private to your Google account; only requests sent to your secret deployment URL can read or log transactions).*
6. Click **Deploy**.
7. Authorize access when prompted by Google:
   - Click **Authorize access** and choose your Google account.
   - When the *"Google hasn't verified this app"* warning appears, click **Advanced** (bottom left), then click **Go to Budget Helper (unsafe)**.
   - Click **Allow**.
8. Copy the generated **Web App URL** (the URL ending in `/exec`).

![Apps Script Deployment Configuration](docs/images/02-apps-script-deploy.png)

![Google Authorization Advanced Screen](docs/images/03-google-auth-warning.png)

---

### Step 3: Connect and Configure the Mobile App

1. On your phone's web browser, navigate to: [https://cstarke.github.io/budget/](https://cstarke.github.io/budget/)
2. Tap the **Settings** icon (gear in the top right header).
3. Paste your copied **Web App URL** into the Web App URL input field.
4. Tap **Save & Connect**. The status indicator dot will turn green once connected.
5. Tap **Sync Dropdown Chips Now** to load your categories and bank accounts directly from your spreadsheet.
6. *(Optional)* Select your default **Category**, **From Account**, and **To Account** so new transactions open with your most frequent choices pre-selected.

![Mobile App Settings Screen](docs/images/04-mobile-app-settings.png)

---

### Step 4: Install to Your Home Screen

Install the app to run fullscreen like a native mobile app without address bars:

- **iOS (Safari)**: Tap the **Share** button (square with arrow pointing up) > scroll down and tap **Add to Home Screen** > tap **Add**.
- **Android (Chrome)**: Tap the **Menu** button (three vertical dots in top right) > tap **Add to Home screen** (or **Install app**).

![Mobile App Main Interface](docs/images/05-mobile-app-main.png)

---

## Customizing Your Setup: What You Can and Cannot Edit

To ensure your formulas, running balances, and sync remain intact, review what can and cannot be modified across your spreadsheet and mobile app.

### 1. Active Budget Sheet (`Budget {Year}`, e.g., `Budget 2026`)

#### Columns A through F: Transaction Data
These columns store transaction records: Date (A), Description (B), Category (C), From (D), To (E), and Amount (F).

- **What you can edit**:
  - You can manually edit any cell in rows 2 and downward directly in Google Sheets at any time (e.g., correcting typos, adjusting amounts, changing categories).
  - You can manually type new transactions into the next available row.
- **What you should NOT do**:
  - **Do not add cell borders**: The script automatically clears cell borders in Columns A through F whenever transactions are logged or updated to prevent styling and coloration bugs. Any cell borders applied to Columns A-F will be cleared on the next write operation.
  - **Do not delete rows using right-click "Delete row" in Google Sheets**: Deleting physical sheet rows shifts cells upward and corrupts running balance formulas in Columns G through L below the deleted row (causing `#REF!` formula errors). If you need to remove a transaction manually in the sheet, clear the cell contents in Columns A-F rather than deleting the sheet row, or delete the transaction through the mobile app's Recent Transactions view (which compacts rows safely).
  - **Do not insert blank rows in the middle of transactions**: The script locates the next row based on continuous data in Column A. Empty rows in the middle can disrupt sorting and row detection.
  - **Do not rename or rearrange Row 1 headers**: The script relies on exact header names in Columns A through F (`Date`, `Description`, `Category`, `From`, `To`, `Amount`).

#### Columns G through L: Running Account Balances and Net Worth
These columns calculate live running account balances (e.g., Checking, Savings, Venmo, Cash, Credit Card, and Total Net Worth).

- **What you can edit**:
  - **Starting balances in Row 2**: When first setting up your sheet, enter your actual starting account balances in Row 2 so running totals reflect your real accounts.
- **What you should NOT do**:
  - **Do not overwrite formulas in Row 3 downward**: These cells contain automated running balance formulas that calculate account balances sequentially after every transaction.

#### Column M: Skip Account Calculations
- **What it is**: Column M contains optional checkboxes labeled `Skip`. Checking this box excludes that specific transaction from affecting running account balances (useful for notes, split reimbursement placeholders, or non-balance adjustments).
- **How to edit**: Can be checked or unchecked manually in Google Sheets, or toggled using the "Skip Account Calculations" switch when editing a transaction in the mobile app.

---

### 2. Category Sheet (`Category` Tab)

Your mobile app dropdown options originate from the native table titled **`CategoryToFrom`** on the `Category` tab.

- **What you can edit**:
  - Inside the `CategoryToFrom` table, you can add, rename, reorder, or delete items under the **`Category`**, **`From`**, and **`To`** columns.
  - The columns inside `CategoryToFrom` can be arranged in any order or column position (e.g., Category first, or From first).
  - You can apply cell background colors to categories in the sheet for your own visual organization.
  - Other tables on the `Category` tab (such as `Spending by Category`) can have their own `Category` column without causing conflicts. The script strictly isolates `CategoryToFrom`.
- **What you should NOT do**:
  - Do not change the table name from `CategoryToFrom`.
  - Do not rename the column headers `Category`, `From`, or `To` inside the table.
  - Do not place dropdown options underneath summary rows like "Total spent", as summary rows indicate the end of the option list.
- **Applying changes to your phone**: After editing `CategoryToFrom` in your sheet, tap the brand logo in the top-left header of the mobile app, or go to **Settings > Sync Dropdown Chips Now**.

---

### 3. Adding a Future Budget Year

The spreadsheet supports seamless annual rollover without overwriting past history:

1. In your Google Sheet, click the bottom-left menu (**All Sheets**) to view the sheet list.
2. Locate the hidden **Year Template Sheet**.
3. Right-click the tab and select **Duplicate**.
4. Rename the duplicated tab to `Budget {Year}` (for example, `Budget 2027`).
5. In cell `A2` of the new sheet, enter `01 Jan {Year}` (e.g., `01 Jan 2027`).
6. The template formulas will automatically detect the year, reference the prior year (`YEAR($A$2) - 1`), and pull forward all closing account balances automatically.

---

### 4. Hidden Sheets (Do Not Modify)

- **`AllData` Sheet**: Do not edit, modify, or delete cells in `AllData`. It is an automated background data consolidation engine that aggregates all annual tabs for multi-year metrics, category history, and dashboard charts. Manually editing `AllData` can break summary and dashboard formulas.
- **`Year Template Sheet`**: Master template for new years. Keep formulas intact.

---

### 5. Mobile App Customizations

- **Quick Fill Wheel**: Tap the star or edit icon to create, edit, or reorder presets for frequent purchases. Presets can be exported and imported as JSON text in Quick Fill Settings for easy backup across devices.
- **Default Selections**: In Settings, configure default Category, From, and To selections to minimize taps during entry.
- **Accent Themes & Haptics**: Choose from multiple accent color themes and toggle tactile vibration feedback on or off.

---

## Updating the Google Apps Script in the Future

If updates are made to the backend `Code.gs` script:

1. Open your Google Sheet and go to **Extensions > Apps Script**.
2. Replace the code in `Code.gs` with the latest version from this repository.
3. Click **Deploy > Manage deployments**.
4. Click the **Edit** icon (pencil) in the top right of the active deployment.
5. Under **Version**, select **New version**.
6. Click **Deploy**.

*(Note: Updating an existing deployment with "New version" preserves your Web App URL, so you do not need to reconnect your phone).*

---

## Troubleshooting

- **"Failed to fetch" or connection error in the mobile app**:
  - Check that the URL pasted in Settings ends with `/exec` (not `/edit` or `/dev`).
  - In Apps Script, open **Deploy > Manage deployments** and ensure **Who has access** is set to **Anyone**.
- **Dropdown chips in the app don't match the spreadsheet**:
  - Tap the brand logo in the top-left header or tap **Sync Dropdown Chips Now** in Settings.
  - Confirm your options are inside the table named `CategoryToFrom` on the `Category` tab.
- **Running account balances show `#REF!`**:
  - Caused by deleting physical spreadsheet rows. To resolve, select the cell with the formula in the row immediately above the error, and drag the formula handle down across the affected rows.
- **Script changes not applying**:
  - Ensure you selected **New version** when managing deployments. Editing script code without deploying a new version will continue running the older deployed code.

---

## Visual Aids Reference

If you are setting up or contributing documentation screenshots, save PNG files into the `docs/images/` directory using these filenames:

| Filename | Capture Target |
|---|---|
| `docs/images/01-google-sheet-template.png` | Active `Budget 2026` tab showing Columns A through M with sample data. |
| `docs/images/02-apps-script-deploy.png` | Apps Script deployment modal (Web app, Execute as: Me, Access: Anyone). |
| `docs/images/03-google-auth-warning.png` | Google authorization screen showing the "Advanced" expander. |
| `docs/images/04-mobile-app-settings.png` | Mobile app Settings sheet with URL field and green connection indicator. |
| `docs/images/05-mobile-app-main.png` | Mobile app main screen showing keypad, date, description, and selector chips. |

---

## Repository Structure

```
budget/
├── index.html                  # Mobile PWA interface
├── style.css                   # Mobile-first dark theme & layout styles
├── app.js                      # Core app logic, offline sync & API client
├── sw.js                       # Service worker for offline caching
├── manifest.json               # Web App Manifest
├── docs/
│   └── images/                 # Setup guide screenshots
├── icons/                      # App icons & SVGs
│   ├── icon.svg                # PWA app icon
│   └── brand-logo.svg          # Frameless header logo
└── google-apps-script/
    └── Code.gs                 # Google Apps Script backend source code
```

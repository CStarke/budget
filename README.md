# Budget

A lightweight mobile web app for logging budget transactions directly into your own Google Sheet.

- **Live Web App**: [https://cstarke.github.io/budget/](https://cstarke.github.io/budget/)
- **Template Google Sheet**: [Open Template Sheet](https://docs.google.com/spreadsheets/d/1Ra6J_dwINj5S3B-5Iivj5pT54gsHry-zgPWv08lSOkA/edit?usp=sharing)

---

## What It Does

Budget is built for quick, simple expense logging on your phone:

- **Quick Mobile Logging**: Made for one-handed entry with a numeric keypad, quick date toggles (Today, Yesterday, or Custom), and category chips.
- **Quick Fill Wheel**: Spin through frequent purchases to auto-fill saved amounts, categories, and account tags.
- **Recent Transactions & Editing**: Pulls your recent entries right from your sheet. You can view, edit, or delete any recent transaction directly from your phone.
- **Offline Support**: If you don't have cell service or Wi-Fi, transactions are saved locally on your phone and automatically sent to your sheet once you're back online.
- **Multi-Year Tracking**: Uses separate yearly tabs so you can keep logging year after year without breaking formulas.

---

## How It Works

- **The Mobile App**: A web app you open on your phone's browser (and can add to your home screen). It gives you a clean keypad to enter transactions and saves your dropdown choices locally so it works even offline.
- **The Google Apps Script**: A small script attached to your spreadsheet that acts as the bridge. It receives entries from your phone and writes them into the right spot on your sheet.
- **Your Google Sheet**: Where all your transactions actually live, running your balances and totals.

---

## Step-by-Step Setup Guide

Follow these steps to get your sheet connected to the mobile app:

### Step 1: Copy the Google Sheet Template

1. Open the [Budget Template Sheet](https://docs.google.com/spreadsheets/d/1Ra6J_dwINj5S3B-5Iivj5pT54gsHry-zgPWv08lSOkA/edit?usp=sharing).
2. Click **File > Make a copy** to save your own copy to your Google Drive.
3. The backend script is already attached inside your copied sheet.

---

### Step 2: Deploy the Google Apps Script Web App

1. In your copied Google Sheet, open **Extensions > Apps Script**.
2. *(Recommended)* In the left sidebar, click the **+** button next to **Services**, select **Google Sheets API**, and click **Add**. This lets the script talk directly to Google's native table engine.
3. Click the blue **Deploy** button in the top right and select **New deployment**.
4. In the deployment window, click the gear icon (next to *Select type*) and pick **Web app**.
5. Set the options:
   - **Description**: `Budget Backend` (or whatever you'd like to call it)
   - **Execute as**: `Me (<your-email>)`
   - **Who has access**: `Anyone` *(This allows your phone's browser to send entries to the script without needing to sign in with OAuth every time. Your sheet is still private to your Google account; only requests with your secret deployment link can read or write transactions).*
6. Click **Deploy**.
7. Authorize access when Google asks:
   - Click **Authorize access** and select your Google account.
   - When the *"Google hasn't verified this app"* screen shows up, click **Advanced** in the bottom left, then click **Go to Budget Helper (unsafe)**.
   - Click **Allow**.
8. Copy the **Web App URL** (the link ending in `/exec`).

---

### Step 3: Connect the Mobile App

1. On your phone's browser, go to: [https://cstarke.github.io/budget/](https://cstarke.github.io/budget/)
2. Tap the **Settings** icon (gear in the top right).
3. Paste your copied **Web App URL** into the Web App URL box.
4. Tap **Save & Connect**. The status dot will turn green once it connects.
5. Tap **Sync Dropdown Chips Now** to pull your categories and accounts straight from your sheet.
6. *(Optional)* Pick your default **Category**, **From Account**, and **To Account** so new entries open with your most frequent choices already selected.

---

### Step 4: Add to Your Home Screen

You can install the app to run fullscreen like a normal phone app:

- **iPhone (Safari)**: Tap the **Share** button (box with an arrow pointing up) > scroll down and tap **Add to Home Screen** > tap **Add**.
- **Android (Chrome)**: Tap the **Menu** (three dots in top right) > tap **Add to Home screen** (or **Install app**).

---

## Customizing Your Setup: What You Can and Cannot Edit

Here is a guide on what you can safely change in your sheet and app, and what you should leave alone so formulas and syncing don't break.

### 1. Active Budget Sheet (`Budget {Year}`, e.g., `Budget 2026`)

#### Columns A through F: Transaction Data
These columns store your actual transactions: Date (A), Description (B), Category (C), From (D), To (E), and Amount (F).

- **What you can edit**:
  - You can edit any existing transaction directly in Google Sheets anytime (fix a typo, adjust an amount, change a category, etc.).
  - You can manually type new transactions into the next open row.
- **What you should NOT do**:
  - **Do not add cell borders**: The script clears borders in Columns A through F whenever it logs or updates entries to fix a cell formatting bug. Any borders you add to Columns A-F will be removed on the next write.
  - **Do not delete rows using right-click "Delete row" in Google Sheets**: Deleting an entire sheet row shifts everything up and breaks the running balance formulas in Columns G through L below it (turning them into `#REF!` errors). If you want to delete a transaction manually in the sheet, clear the contents of cells A-F instead of deleting the row, or delete the transaction from the mobile app's Recent Transactions screen.
  - **Do not insert blank rows between transactions**: The script finds the next open row based on Column A. Leaving empty rows in the middle can mess up sorting and row detection.
  - **Do not rename or rearrange Row 1 headers**: The script looks specifically for `Date`, `Description`, `Category`, `From`, `To`, and `Amount` in Columns A through F.

#### Columns G through L: Running Balances and Net Worth
These columns calculate your running account balances (Checking, Savings, Venmo, Cash, Credit Card, and Total Net Worth).

- **What you can edit**:
  - **Starting balances in Row 2**: When first setting up the sheet, enter your starting account balances in Row 2 so the running totals match your real accounts.
- **What you should NOT do**:
  - **Do not edit formulas in Row 3 downward**: These cells calculate running balances after each transaction.

#### Column M: Skip Checkbox
- **What it is**: An optional checkbox column. Checking this box tells the sheet to skip that transaction when calculating running balances (handy for notes, split reimbursement placeholders, or non-balance adjustments).
- **How to edit**: Check or uncheck it in the sheet, or toggle the "Skip Account Calculations" switch when editing a transaction in the mobile app.

---

### 2. Category Sheet (`Category` Tab)

Your mobile app dropdown options come from the native table titled **`CategoryToFrom`** on the `Category` tab.

- **What you can edit**:
  - Inside the `CategoryToFrom` table, you can add, rename, reorder, or delete items under the **`Category`**, **`From`**, and **`To`** columns.
  - Columns inside `CategoryToFrom` can be in any order (Category first, From first, etc.).
  - You can add background colors to category cells in the sheet for your own visual organization.
  - Other tables on the `Category` tab (like `Spending by Category`) can have their own `Category` column without causing issues. The script specifically looks for `CategoryToFrom`.
- **What you should NOT do**:
  - Do not change the table name from `CategoryToFrom`.
  - Do not rename the column headers `Category`, `From`, or `To` inside the table.
  - Do not put options below summary rows like "Total spent", since the script stops reading there.
- **Updating your phone**: After editing `CategoryToFrom`, tap the brand logo in the top-left of the mobile app, or go to **Settings > Sync Dropdown Chips Now**.

---

### 3. Adding a New Budget Year

When a new year starts, you don't need to overwrite your old transactions:

1. In your sheet, click the sheet menu in the bottom-left (**All Sheets**) to see hidden sheets.
2. Find the hidden **Budget Template** sheet.
3. Right-click the tab and select **Duplicate**.
4. Rename the new tab to `Budget {Year}` (for example, `Budget 2027`).
5. In cell `A2` of the new sheet, enter `01 Jan {Year}` (e.g., `01 Jan 2027`).
6. The template formulas will automatically detect the year, check the previous year (`YEAR($A$2) - 1`), and pull forward all closing balances.

---

### 4. Hidden Sheets

- **`AllData` Sheet**: Do not edit or delete cells in `AllData`. It runs background calculations that pull together data from all your yearly tabs for dashboard charts. Changing it manually will break dashboard formulas.
- **`Budget Template`**: The master template for creating new years. Keep its formulas intact.

---

### 5. Mobile App Customizations

- **Quick Fill Wheel**: Tap the star or edit icon to make, edit, or reorder presets for common purchases. You can export and import your presets as text in Settings to move them between devices.
- **Default Selections**: In Settings, pick your most common Category, From, and To selections so you usually only have to type the amount.
- **Themes & Haptics**: Pick an accent color theme and turn vibration feedback on or off.

---

## Updating the Google Apps Script

If an update is made to `Code.gs`:

1. Open your sheet and go to **Extensions > Apps Script**.
2. Paste the updated code into `Code.gs`.
3. Click **Deploy > Manage deployments**.
4. Click the **Edit** icon (pencil) in the top right of your active deployment.
5. Under **Version**, pick **New version**.
6. Click **Deploy**.

*(Updating with "New version" keeps your existing URL, so you won't need to reconnect your phone).*

---

## Troubleshooting

- **"Failed to fetch" or connection error in the app**:
  - Make sure the URL pasted in Settings ends with `/exec` (not `/edit` or `/dev`).
  - In Apps Script, check **Deploy > Manage deployments** and make sure **Who has access** is set to **Anyone**.
- **Dropdown chips don't match the sheet**:
  - Tap the brand logo in the top-left header or tap **Sync Dropdown Chips Now** in Settings.
  - Make sure your categories and accounts are inside the table named `CategoryToFrom` on the `Category` tab.
- **Running balances show `#REF!`**:
  - Usually happens if a sheet row was deleted instead of cleared. To fix, click the formula cell in the row right above the error, and drag the small blue corner handle down over the broken rows.
- **Script changes not doing anything**:
  - Make sure you selected **New version** when updating the deployment under Manage deployments.

---

## Repository Structure

```
budget/
├── index.html                  # Mobile PWA interface
├── style.css                   # Mobile-first dark theme & layout styles
├── app.js                      # Core app logic, offline sync & API client
├── sw.js                       # Service worker for offline caching
├── manifest.json               # Web App Manifest
├── icons/                      # App icons & SVGs
│   ├── icon.svg                # PWA app icon
│   └── brand-logo.svg          # Frameless header logo
└── google-apps-script/
    └── Code.gs                 # Google Apps Script backend source code
```

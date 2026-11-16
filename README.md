# Budget

A fast, minimalist mobile Progressive Web App (PWA) for logging personal budget transactions into Google Sheets in under 3 seconds.

- **Live Web App**: [https://cstarke.github.io/budget/](https://cstarke.github.io/budget/)
- **Template Google Sheet**: [Open Template Sheet](https://docs.google.com/spreadsheets/d/1Ra6J_dwINj5S3B-5Iivj5pT54gsHry-zgPWv08lSOkA/edit?usp=sharing)

---

## Features

- ⚡ **3-Second Entry**: Cent-by-cent keypad input, automatic sentence-casing, and one-tap date toggles (*Today*, *Yesterday*, *Custom*).
- 🎡 **Quick Fill Preset Wheel**: Save, customize, and spin through recurring transactions with custom amounts and autofill tags.
- 🔄 **Smart Account Swapping**: Automatically swaps `From` and `To` if you select the matching account, with auto-clearing for conflicting Income ➔ Spending selections.
- 📊 **Live Sheet Sync & Recent History**: "Recent Transactions" reads your sheet in real-time, displaying the last 6 entries color-coded by flow direction (Red = Spending, Green = Income, Yellow = Transfer).
- ✏️ **Edit & Undo Transactions**: Tap any recent transaction to edit description, date, category, accounts, or amount, updating the sheet in-place or moving it chronologically.
- 🛡️ **Formula-Safe Compaction**: Undoing or deleting transactions compacts rows upward without deleting physical sheet rows, leaving running balance formulas in Columns G+ completely intact without `#REF!` errors.
- 📴 **High-Speed Offline Batch Queue**: Auto-queues transactions when offline and syncs seamlessly in a single atomic batch when your connection is restored.
- 📱 **Installable PWA**: Works on iOS and Android as a standalone fullscreen app with zero app store downloads.

---

## Setup Guide (3 Minutes)

Anyone can use this with their own Google account for free:

### 1. Copy the Google Sheet Template
1. Open the [Budget Template Sheet](https://docs.google.com/spreadsheets/d/1Ra6J_dwINj5S3B-5Iivj5pT54gsHry-zgPWv08lSOkA/edit?usp=sharing).
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

## How Dropdowns Work & How to Customize Them

The mobile app does **not** hardcode your categories or bank accounts—it pulls them dynamically straight from your Google Sheet.

### 1. Where Options Come From
The app reads the **`Category`** sheet tab:
* **Row 1 Headers**: The script dynamically searches the first row for columns titled:
  * **`Category`** (your spending & income buckets, e.g. *Groceries, Housing, Fun*)
  * **`From`** (your payment methods & income sources, e.g. *Checking, Credit Card, Income*)
  * **`To`** (your destinations, e.g. *Spending, Savings, Venmo*)
* **Rows 2 Downward**: Every non-empty cell under those headers becomes a selectable chip in your mobile app.
* **Automatic Summary Row Filter**: The app automatically ignores rows like `"Total spent"` so calculation totals never appear as dropdown choices.

### 2. How to Add, Rename, or Reorder Options
1. Open your Google Sheet and switch to the **`Category`** tab.
2. Simply type a new category, account, or destination into the list under the appropriate column (or delete/rename existing ones).
3. In the mobile app:
   * **Tap the Budget brand logo** in the top-left header, **OR**
   * Go to **Settings ⚙ ➔ Sync Dropdown Chips Now**.
4. Your new options will load instantly onto your phone and be saved locally for offline use.

---

## Other Things You Can Customize

### 1. Persistent Form Defaults (Settings ⚙)
* Set your most frequent **Category**, **From Account**, and **To Account** as your default selections.
* Every time you open the app or submit a transaction, the form automatically resets to these defaults so you only have to enter the dollar amount.

### 2. Quick Fill Preset Wheel
* **Save Recurring Purchases**: Tap the star or edit icon to create presets for daily transactions (e.g. *Morning Coffee*, *Gas*, *Rent*).
* **Presets Reordering**: Open **Settings ➔ Quick Fill Settings** to drag and reorder your presets around the wheel.
* **Backup & Restore**: Use the **Export / Import** buttons in Quick Fill Settings to copy your presets to the clipboard and move them between devices or browsers without losing anything.

### 3. Haptic Feedback Toggle (Settings ⚙)
* Toggle tactile vibrations on or off when typing on the keypad, spinning presets, or submitting transactions.

### 4. Adding a Future Year Sheet (e.g. `Budget 2027`)
1. In your Google Sheet, click the bottom-left menu (**All Sheets ☰**) and find the hidden **Year Template Sheet**.
2. Right-click the template tab and select **Duplicate**.
3. Rename the duplicated tab to `Budget 2027` (following the `Budget {Year}` naming pattern).
4. Unhide or open the sheet: in cell `A2`, enter `01 Jan 2027`.
5. The template's setup formulas will automatically read `YEAR($A$2) - 1` (`2026`) and link forward all closing account balances from the prior year without any manual math!

---

## Sheet Architecture & Hidden Sheets

The spreadsheet template is organized into active operational sheets and protected background sheets:

### Visible Sheets
* **`Budget {Current Year}` (e.g., `Budget 2026`)**: Where your active transactions live. 
  * Columns A–F: `Date`, `Description`, `Category`, `From`, `To`, and `Amount` (written and managed by the app).
  * Columns G–L: Live running account calculations (`Checking`, `Savings`, `Venmo`, `Cash`, `Credit Card`, and `Total Net Worth`).
  * Column M (`Skip`): Optional checkbox to bypass/ignore specific rows from running account balance calculations.
* **`Category`**: Contains your dropdown option lists (`Category`, `From`, `To`). This is where you customize your choices.
* **`Dashboard`**: High-level visual analytics, category budgets, MTD/YTD metrics, and financial summaries.

### Hidden Sheets (Do Not Edit Directly)
To view hidden sheets in Google Sheets, click the **hamburger menu (All Sheets ☰)** in the bottom tab bar:
* **Year Template Sheet**: A pristine master template used to instantiate future budget years.
* **`AllData` Sheet**: 
  > [!WARNING]
  > **Do Not Touch or Edit Directly**: The `AllData` sheet is a background calculation engine that aggregates data across multiple annual tabs for multi-year metrics, running totals, and category history. Manually editing, modifying, or deleting cells in `AllData` can break summary and dashboard formulas.

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

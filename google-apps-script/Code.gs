/**
 * Budget Helper - Google Apps Script Backend (v9 - Batch Pending Transactions Support)
 * 
 * Automatically connects your "Budget" mobile app to your Google Sheets table.
 * - Dynamically scans the "Category" tab's first row to find columns by name ("Category", "From", "To").
 * - You can add, reorder, or insert columns at any time without breaking anything.
 * - Appends transactions to "Budget {Current Year}" without overwriting manual rows.
 * - High-Speed Batch Processing: Appends queued offline transactions in a single atomic operation
 *   using multi-row range setValues for instant bulk syncing.
 * - Formula-Safe Undo: Clears transaction columns (A-F) without deleting sheet rows,
 *   preserving adjacent calculation formulas (columns G+) and preventing #REF! errors.
 * - Reads and syncs the live last 5 transactions directly from the sheet.
 * - Preserves date formatting (DD mmm YYYY) and currency formatting.
 */

// Configuration
var CONFIG = {
  SHEET_NAME_PREFIX: "Budget ",
  FALLBACK_SHEET_NAME: "Budget 2026",
  CATEGORY_TAB_NAMES: ["Category", "Categories", "Lists", "Options"],
  DEFAULT_COLUMNS: {
    DATE: 1,
    DESCRIPTION: 2,
    CATEGORY: 3,
    FROM: 4,
    TO: 5,
    AMOUNT: 6
  }
};

/**
 * Finds the target budget sheet matching the transaction date's year (e.g. "Budget 2026") or fallback.
 */
function getTargetSheet(dateInput) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var targetYear = new Date().getFullYear();
  if (dateInput) {
    try {
      var parsed = parseDateInput(dateInput);
      if (parsed && !isNaN(parsed.getFullYear())) {
        targetYear = parsed.getFullYear();
      }
    } catch (e) {}
  }
  var expectedName = CONFIG.SHEET_NAME_PREFIX + targetYear;
  
  // 1. Try "Budget {Target Year}" (e.g. Budget 2026)
  var sheet = ss.getSheetByName(expectedName);
  if (sheet) return sheet;
  
  // 2. Try configured fallback
  sheet = ss.getSheetByName(CONFIG.FALLBACK_SHEET_NAME);
  if (sheet) return sheet;
  
  // 3. Search for any sheet starting with "Budget"
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().indexOf("Budget") === 0) {
      return sheets[i];
    }
  }
  
  // 4. Default to first sheet that is NOT the Category sheet
  for (var j = 0; j < sheets.length; j++) {
    var sheetName = sheets[j].getName().trim().toLowerCase();
    if (sheetName !== "category" && sheetName !== "categories" && sheetName !== "lists" && sheetName !== "options") {
      return sheets[j];
    }
  }
  
  return sheets[0];
}

/**
 * Finds the tab containing the category and option lists (e.g. "Category").
 */
function getCategorySheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  
  // 1. Look for exact or case-insensitive match for configured tab names
  for (var k = 0; k < CONFIG.CATEGORY_TAB_NAMES.length; k++) {
    var searchName = CONFIG.CATEGORY_TAB_NAMES[k].toLowerCase();
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getName().trim().toLowerCase() === searchName) {
        return sheets[i];
      }
    }
  }
  return null;
}

/**
 * Reads options by dynamically searching Row 1 for column names ("Category", "From", "To").
 * Safe against adding, moving, or inserting new columns in the future.
 */
function getOptionsFromCategoryTab(categorySheet) {
  var lastCol = categorySheet.getLastColumn();
  var lastRow = categorySheet.getLastRow();
  
  if (lastCol < 1 || lastRow < 2) {
    return { category: [], from: [], to: [], columnsFound: {} };
  }
  
  // Read all header values in Row 1
  var headers = categorySheet.getRange(1, 1, 1, lastCol).getValues()[0];
  
  var catCol = -1;
  var fromCol = -1;
  var toCol = -1;
  
  for (var c = 0; c < headers.length; c++) {
    var headerText = String(headers[c] || "").trim().toLowerCase();
    if (!headerText) continue;
    
    // Match "Category" (or "Categories")
    if (headerText === "category" || headerText === "categories" || headerText.indexOf("cat") === 0) {
      catCol = c + 1; // 1-based column index
    }
    // Match "From"
    else if (headerText === "from" || headerText.indexOf("source") !== -1 || headerText.indexOf("account") !== -1) {
      fromCol = c + 1;
    }
    // Match "To"
    else if (headerText === "to" || headerText.indexOf("dest") !== -1 || headerText.indexOf("payee") !== -1) {
      toCol = c + 1;
    }
  }
  
  // Extracts non-empty values starting from Row 2 downwards
  function extractColumnValues(colIndex) {
    if (colIndex === -1) return [];
    var values = categorySheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
    var list = [];
    var seen = {};
    for (var r = 0; r < values.length; r++) {
      var val = values[r][0];
      if (val !== null && val !== undefined) {
        var str = String(val).trim();
        if (str.length > 0 && !seen[str]) {
          seen[str] = true;
          list.push(str);
        }
      }
    }
    return list;
  }
  
  return {
    category: extractColumnValues(catCol),
    from: extractColumnValues(fromCol),
    to: extractColumnValues(toCol),
    columnsFound: {
      categoryCol: catCol,
      fromCol: fromCol,
      toCol: toCol
    }
  };
}

/**
 * Dynamically detects the header row and column mappings in the Budget transaction sheet.
 */
function detectColumns(sheet) {
  var maxScanRows = Math.min(sheet.getLastRow() || 5, 10);
  var maxCols = Math.min(sheet.getLastColumn() || 10, 25);
  
  var colMap = {
    headerRow: 1,
    DATE: CONFIG.DEFAULT_COLUMNS.DATE,
    DESCRIPTION: CONFIG.DEFAULT_COLUMNS.DESCRIPTION,
    CATEGORY: CONFIG.DEFAULT_COLUMNS.CATEGORY,
    FROM: CONFIG.DEFAULT_COLUMNS.FROM,
    TO: CONFIG.DEFAULT_COLUMNS.TO,
    AMOUNT: CONFIG.DEFAULT_COLUMNS.AMOUNT,
    maxCol: 6
  };
  
  if (maxScanRows < 1 || maxCols < 1) return colMap;
  
  var data = sheet.getRange(1, 1, maxScanRows, maxCols).getValues();
  
  for (var r = 0; r < data.length; r++) {
    var rowValues = data[r];
    var foundCount = 0;
    var tempMap = {};
    
    for (var c = 0; c < rowValues.length; c++) {
      var val = String(rowValues[c] || "").trim().toLowerCase();
      if (!val) continue;
      
      if (val === "date") { tempMap.DATE = c + 1; foundCount++; }
      else if (val.indexOf("desc") !== -1 || val.indexOf("item") !== -1 || val.indexOf("note") !== -1 || val.indexOf("merchant") !== -1 || val.indexOf("store") !== -1) { 
        tempMap.DESCRIPTION = c + 1; foundCount++; 
      }
      else if (val.indexOf("cat") !== -1) { tempMap.CATEGORY = c + 1; foundCount++; }
      else if (val === "from" || val.indexOf("source") !== -1 || val.indexOf("account") !== -1) { tempMap.FROM = c + 1; foundCount++; }
      else if (val === "to" || val.indexOf("dest") !== -1 || val.indexOf("payee") !== -1) { tempMap.TO = c + 1; foundCount++; }
      else if (val.indexOf("amount") !== -1 || val.indexOf("price") !== -1 || val === "cost" || val === "spent") { 
        // Do NOT match "total" here because running balance / net worth total is column 12
        tempMap.AMOUNT = c + 1; foundCount++; 
      }
    }
    
    if (foundCount >= 3) {
      colMap.headerRow = r + 1;
      if (tempMap.DATE) colMap.DATE = tempMap.DATE;
      if (tempMap.DESCRIPTION) colMap.DESCRIPTION = tempMap.DESCRIPTION;
      if (tempMap.CATEGORY) colMap.CATEGORY = tempMap.CATEGORY;
      if (tempMap.FROM) colMap.FROM = tempMap.FROM;
      if (tempMap.TO) colMap.TO = tempMap.TO;
      if (tempMap.AMOUNT) colMap.AMOUNT = tempMap.AMOUNT;
      colMap.maxCol = Math.max(colMap.DATE, colMap.DESCRIPTION, colMap.CATEGORY, colMap.FROM, colMap.TO, colMap.AMOUNT, 6);
      break;
    }
  }
  
  return colMap;
}

/**
 * Finds the next truly empty row in the table (never overwriting existing data).
 * Scans only the transaction columns (A-F) so that running balance formula columns
 * extending down the sheet do not inflate the next row calculation.
 */
function findNextAvailableRow(sheet, colMap) {
  var lastRow = sheet.getLastRow();
  var startRow = colMap.headerRow + 1;
  
  if (lastRow < startRow) {
    return startRow;
  }
  
  var maxCol = colMap.maxCol || 6;
  var values = sheet.getRange(startRow, 1, lastRow - startRow + 1, maxCol).getValues();
  
  var lastPopulatedRow = startRow - 1;
  for (var r = values.length - 1; r >= 0; r--) {
    var hasContent = values[r].some(function(cell) {
      return String(cell !== null && cell !== undefined ? cell : "").trim() !== "";
    });
    if (hasContent) {
      lastPopulatedRow = startRow + r;
      break;
    }
  }
  
  return lastPopulatedRow + 1;
}

/**
 * Formats a Date or date string to YYYY-MM-DD using spreadsheet timezone.
 */
function formatComparableDate(val, tz) {
  if (!val) return "";
  if (typeof val === "string") {
    var m = val.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) {
      var y = m[1];
      var mon = String(m[2]).length === 1 ? "0" + m[2] : m[2];
      var d = String(m[3]).length === 1 ? "0" + m[3] : m[3];
      return y + "-" + mon + "-" + d;
    }
  }
  var dt = (val instanceof Date) ? val : parseDateInput(val);
  if (isNaN(dt.getTime())) return "";
  if (tz && typeof Utilities !== "undefined" && Utilities.formatDate) {
    return Utilities.formatDate(dt, tz, "yyyy-MM-dd");
  }
  var yr = dt.getFullYear();
  var mo = String(dt.getMonth() + 1);
  if (mo.length === 1) mo = "0" + mo;
  var dy = String(dt.getDate());
  if (dy.length === 1) dy = "0" + dy;
  return yr + "-" + mo + "-" + dy;
}

/**
 * Normalizes any Date or date string to a UTC midnight timestamp (date-only comparison).
 */
function normalizeDateOnly(dateVal, tz) {
  var str = formatComparableDate(dateVal, tz);
  if (!str) return 0;
  var p = str.split("-");
  return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)).getTime();
}

/**
 * Finds the exact chronological row to insert a transaction.
 * Scans populated rows to locate the first row whose date is strictly greater (>)
 * than targetDateVal. If found, returns that row index so the transaction is placed
 * at the END of targetDateVal (and before all subsequent days).
 * If no subsequent row exists, returns findNextAvailableRow.
 */
function findChronologicalInsertionRow(sheet, colMap, targetDateVal) {
  var nextRow = findNextAvailableRow(sheet, colMap);
  var headerRow = colMap.headerRow || 1;
  var startRow = headerRow + 1;
  var lastPopulatedRow = nextRow - 1;

  if (lastPopulatedRow < startRow) {
    return startRow;
  }

  var tz = (sheet.getParent && sheet.getParent()) ? sheet.getParent().getSpreadsheetTimeZone() : (Session.getScriptTimeZone() || "GMT");
  var targetTime = normalizeDateOnly(targetDateVal, tz);
  if (targetTime <= 0) return nextRow;

  var numRows = lastPopulatedRow - startRow + 1;
  var dateValues = sheet.getRange(startRow, colMap.DATE, numRows, 1).getValues();

  for (var i = 0; i < dateValues.length; i++) {
    var cellDate = dateValues[i][0];
    if (cellDate) {
      var cellTime = normalizeDateOnly(cellDate, tz);
      if (cellTime > targetTime) {
        return startRow + i; // 1-based row index
      }
    }
  }

  return nextRow;
}

/**
 * Inserts transaction values at a specific chronological row.
 * If targetRow is in the middle of existing transactions, shifts columns 1..maxCol down by 1 row,
 * preserving all formula columns in columns G+ and preventing #REF! errors.
 */
function writeTransactionAtRow(sheet, colMap, targetRow, nextRow, dateVal, descVal, catVal, fromVal, toVal, amountVal) {
  var maxCol = colMap.maxCol || 6;

  // If inserting before existing rows, shift columns 1..maxCol down by 1
  if (targetRow < nextRow) {
    var numToShift = nextRow - targetRow;
    // Ensure sheet has enough physical rows
    if (nextRow > sheet.getMaxRows()) {
      sheet.insertRowsAfter(sheet.getMaxRows(), 50);
    }
    var currentValues = sheet.getRange(targetRow, 1, numToShift, maxCol).getValues();
    sheet.getRange(targetRow + 1, 1, numToShift, maxCol).setValues(currentValues);
    sheet.getRange(targetRow + 1, colMap.DATE, numToShift, 1).setNumberFormat("dd mmm yyyy");
    sheet.getRange(targetRow + 1, colMap.AMOUNT, numToShift, 1).setNumberFormat("$#,##0.00");
  }

  // Write new transaction into targetRow
  sheet.getRange(targetRow, colMap.DATE).setValue(dateVal);
  sheet.getRange(targetRow, colMap.DESCRIPTION).setValue(descVal);
  sheet.getRange(targetRow, colMap.CATEGORY).setValue(catVal);
  sheet.getRange(targetRow, colMap.FROM).setValue(fromVal);
  sheet.getRange(targetRow, colMap.TO).setValue(toVal);
  sheet.getRange(targetRow, colMap.AMOUNT).setValue(amountVal);

  sheet.getRange(targetRow, colMap.DATE).setNumberFormat("dd mmm yyyy");
  sheet.getRange(targetRow, colMap.AMOUNT).setNumberFormat("$#,##0.00");
}

/**
 * Retrieves the most recent N transactions from the budget sheet.
 * Reliably scans from the first transaction row down to the last row,
 * correctly handling empty trailing rows or formatted blank cells.
 */
function getRecentTransactionsFromSheet(sheet, colMap, limit) {
  limit = limit || 5;
  var lastRow = sheet.getLastRow();
  var headerRow = colMap.headerRow || 1;
  
  if (lastRow <= headerRow) {
    return [];
  }
  
  var startRow = headerRow + 1;
  var numRows = lastRow - headerRow;
  var maxCol = colMap.maxCol || 6;
  var values = sheet.getRange(startRow, 1, numRows, maxCol).getValues();
  var tz = (sheet.getParent && sheet.getParent()) ? sheet.getParent().getSpreadsheetTimeZone() : (Session.getScriptTimeZone() || "GMT");
  
  var list = [];
  // Loop from the very bottom row upwards
  for (var i = values.length - 1; i >= 0; i--) {
    var rowValues = values[i];
    
    // Check if row has any non-empty cell in columns A-F
    var hasContent = rowValues.some(function(cell) {
      return String(cell !== null && cell !== undefined ? cell : "").trim() !== "";
    });
    if (!hasContent) {
      continue;
    }
    
    var desc = String(rowValues[colMap.DESCRIPTION - 1] || "").trim();
    var cat = String(rowValues[colMap.CATEGORY - 1] || "").trim();
    var fromVal = String(rowValues[colMap.FROM - 1] || "").trim();
    var toVal = String(rowValues[colMap.TO - 1] || "").trim();
    var rawAmt = rowValues[colMap.AMOUNT - 1];
    var rawDate = rowValues[colMap.DATE - 1];
    
    var cleanAmt = String(rawAmt !== null && rawAmt !== undefined ? rawAmt : "").replace(/[^0-9.-]/g, "");
    var amt = parseFloat(cleanAmt);
    if (isNaN(amt)) amt = 0.00;
    
    var dateStr = "";
    if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
      dateStr = Utilities.formatDate(rawDate, tz, "yyyy-MM-dd");
    } else if (rawDate) {
      dateStr = formatComparableDate(rawDate, tz);
    }
    
    var rowNumber = startRow + i;
    list.push({
      id: "sheet_" + rowNumber + "_" + (desc || "tx").replace(/[^a-zA-Z0-9]/g, ""),
      row: rowNumber,
      date: dateStr,
      description: desc || "Untitled",
      category: cat,
      from: fromVal,
      to: toVal,
      amount: amt
    });
    
    if (list.length >= limit) {
      break;
    }
  }
  return list;
}

/**
 * Master options loader.
 */
function getFormOptions() {
  var targetSheet = getTargetSheet();
  var catSheet = getCategorySheet();
  
  var categories = [];
  var fromOptions = [];
  var toOptions = [];
  var source = "none";
  var debugCols = {};
  
  // 1. Check the "Category" tab dynamically by header name in Row 1
  if (catSheet) {
    var listOptions = getOptionsFromCategoryTab(catSheet);
    if (listOptions) {
      categories = listOptions.category;
      fromOptions = listOptions.from;
      toOptions = listOptions.to;
      debugCols = listOptions.columnsFound;
      source = "Category tab (" + catSheet.getName() + ")";
    }
  }
  
  var colMap = detectColumns(targetSheet);
  var recentTransactions = getRecentTransactionsFromSheet(targetSheet, colMap, 5);
  
  return {
    success: true,
    sheetName: targetSheet.getName(),
    source: source,
    columnsFound: debugCols,
    timestamp: new Date().toISOString(),
    options: {
      category: categories,
      from: fromOptions,
      to: toOptions
    },
    recentTransactions: recentTransactions
  };
}

/**
 * Parses incoming date string into a Date object.
 */
function parseDateInput(inputStr) {
  if (!inputStr) return new Date();
  if (typeof inputStr === "object" && inputStr instanceof Date) return inputStr;
  
  var parts = String(inputStr).split("-");
  if (parts.length === 3) {
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10) - 1;
    var day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  
  var parsed = new Date(inputStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Appends transaction to the budget sheet in its exact chronological spot.
 * Uses atomic in-memory array manipulation and a single setValues call to prevent
 * row duplication, formula corruption in columns G+, or missing rows.
 */
function appendTransaction(data) {
  var sheet = getTargetSheet(data ? data.date : null);
  var colMap = detectColumns(sheet);
  
  var dateVal = parseDateInput(data.date);
  var descVal = data.description ? String(data.description).trim() : "";
  var catVal = data.category ? String(data.category).trim() : "";
  var fromVal = data.from ? String(data.from).trim() : "";
  var toVal = data.to ? String(data.to).trim() : "";
  var amountVal = parseFloat(data.amount);
  if (isNaN(amountVal)) amountVal = 0.00;
  
  var maxCol = colMap.maxCol || 6;
  var headerRow = colMap.headerRow || 1;
  var startRow = headerRow + 1;
  var nextRow = findNextAvailableRow(sheet, colMap);
  var lastPopRow = nextRow - 1;
  
  var tz = (sheet.getParent && sheet.getParent()) ? sheet.getParent().getSpreadsheetTimeZone() : (Session.getScriptTimeZone() || "GMT");
  var targetTime = normalizeDateOnly(dateVal, tz);
  
  var newRow = new Array(maxCol);
  for (var c = 0; c < maxCol; c++) newRow[c] = "";
  newRow[colMap.DATE - 1] = dateVal;
  newRow[colMap.DESCRIPTION - 1] = descVal;
  newRow[colMap.CATEGORY - 1] = catVal;
  newRow[colMap.FROM - 1] = fromVal;
  newRow[colMap.TO - 1] = toVal;
  newRow[colMap.AMOUNT - 1] = amountVal;

  var targetRow = nextRow;

  if (lastPopRow < startRow) {
    sheet.getRange(startRow, 1, 1, maxCol).setValues([newRow]);
    sheet.getRange(startRow, colMap.DATE).setNumberFormat("dd mmm yyyy");
    sheet.getRange(startRow, colMap.AMOUNT).setNumberFormat("$#,##0.00");
    targetRow = startRow;
  } else {
    var count = lastPopRow - startRow + 1;
    var allRows = sheet.getRange(startRow, 1, count, maxCol).getValues();
    
    var insertIndex = allRows.length;
    if (targetTime > 0) {
      for (var i = 0; i < allRows.length; i++) {
        var cellDate = allRows[i][colMap.DATE - 1];
        if (cellDate) {
          var cellTime = normalizeDateOnly(cellDate, tz);
          if (cellTime > targetTime) {
            insertIndex = i;
            break;
          }
        }
      }
    }
    
    if (insertIndex === allRows.length) {
      if (nextRow > sheet.getMaxRows()) {
        sheet.insertRowsAfter(sheet.getMaxRows(), 50);
      }
      sheet.getRange(nextRow, 1, 1, maxCol).setValues([newRow]);
      sheet.getRange(nextRow, colMap.DATE).setNumberFormat("dd mmm yyyy");
      sheet.getRange(nextRow, colMap.AMOUNT).setNumberFormat("$#,##0.00");
      targetRow = nextRow;
    } else {
      allRows.splice(insertIndex, 0, newRow);
      if ((startRow + allRows.length - 1) > sheet.getMaxRows()) {
        sheet.insertRowsAfter(sheet.getMaxRows(), 50);
      }
      sheet.getRange(startRow, 1, allRows.length, maxCol).setValues(allRows);
      sheet.getRange(startRow, colMap.DATE, allRows.length, 1).setNumberFormat("dd mmm yyyy");
      sheet.getRange(startRow, colMap.AMOUNT, allRows.length, 1).setNumberFormat("$#,##0.00");
      targetRow = startRow + insertIndex;
    }
  }
  
  SpreadsheetApp.flush();

  return {
    success: true,
    message: "Transaction added successfully",
    sheetName: sheet.getName(),
    row: targetRow,
    recentTransactions: getRecentTransactionsFromSheet(sheet, colMap, 5),
    entry: {
      date: Utilities.formatDate(dateVal, tz, "dd MMM yyyy"),
      description: descVal,
      category: catVal,
      from: fromVal,
      to: toVal,
      amount: amountVal
    }
  };
}

/**
 * Edits an existing transaction in the budget sheet.
 * If the date is unchanged, updates columns A-F strictly in-place, preserving its exact
 * relative order among other transactions on that day.
 * If the date changed to a different day, relocates the transaction to the end of the new day
 * using atomic in-memory array manipulation and a single setValues write to ensure zero data loss.
 */
function editTransaction(data) {
  var orig = data.original || data;
  var updated = data.updated || data;
  
  var origDateStr = orig.date;
  var sheet = getTargetSheet(origDateStr);
  var colMap = detectColumns(sheet);
  var lastRow = sheet.getLastRow();
  var headerRow = colMap.headerRow || 1;
  var startRow = headerRow + 1;
  var maxCol = colMap.maxCol || 6;
  var tz = (sheet.getParent && sheet.getParent()) ? sheet.getParent().getSpreadsheetTimeZone() : (Session.getScriptTimeZone() || "GMT");

  if (lastRow < startRow) {
    return { success: false, error: "No transactions found in sheet." };
  }

  var nextRowCur = findNextAvailableRow(sheet, colMap);
  var lastPopRow = nextRowCur - 1;
  if (lastPopRow < startRow) {
    return { success: false, error: "No populated transactions found in sheet." };
  }

  // 1. Locate the existing row
  var targetRow = -1;
  var count = lastPopRow - startRow + 1;
  var allRows = sheet.getRange(startRow, 1, count, maxCol).getValues();

  var origDesc = orig.description ? String(orig.description).trim().toLowerCase() : "";
  var origAmt = parseFloat(String(orig.amount || "").replace(/[^0-9.-]/g, ""));
  var origDateComp = formatComparableDate(origDateStr, tz);

  // If caller provided data.row or orig.row, test it first
  var hintRow = data.row || orig.row;
  if (hintRow && hintRow >= startRow && hintRow <= lastPopRow) {
    var idx = hintRow - startRow;
    var rowDesc = String(allRows[idx][colMap.DESCRIPTION - 1] || "").trim().toLowerCase();
    var rowAmt = parseFloat(String(allRows[idx][colMap.AMOUNT - 1] || "").replace(/[^0-9.-]/g, ""));
    var rowDateComp = formatComparableDate(allRows[idx][colMap.DATE - 1], tz);
    
    var descMatch = (!origDesc || rowDesc === origDesc || (origDesc === "untitled" && !rowDesc));
    var amtMatch = (isNaN(origAmt) || Math.abs(rowAmt - origAmt) < 0.01);
    var dateMatch = (!origDateComp || rowDateComp === origDateComp);
    if (descMatch && amtMatch && dateMatch) {
      targetRow = hintRow;
    }
  }

  // If hint wasn't an exact match, scan backwards from the bottom of populated rows
  if (targetRow === -1) {
    for (var i = allRows.length - 1; i >= 0; i--) {
      var rDesc = String(allRows[i][colMap.DESCRIPTION - 1] || "").trim().toLowerCase();
      var rAmt = parseFloat(String(allRows[i][colMap.AMOUNT - 1] || "").replace(/[^0-9.-]/g, ""));
      var rDateComp = formatComparableDate(allRows[i][colMap.DATE - 1], tz);
      
      var matchDesc = (!origDesc || rDesc === origDesc || (origDesc === "untitled" && !rDesc));
      var matchAmt = (isNaN(origAmt) || Math.abs(rAmt - origAmt) < 0.01);
      var matchDate = (!origDateComp || rDateComp === origDateComp);

      if (matchDesc && matchAmt && matchDate) {
        targetRow = startRow + i;
        break;
      }
    }
  }

  if (targetRow === -1) {
    return { success: false, error: "Original transaction could not be located in sheet." };
  }

  // Parse updated values
  var newDateVal = parseDateInput(updated.date);
  var newDescVal = updated.description ? String(updated.description).trim() : "";
  var newCatVal = updated.category ? String(updated.category).trim() : "";
  var newFromVal = updated.from ? String(updated.from).trim() : "";
  var newToVal = updated.to ? String(updated.to).trim() : "";
  var newAmountVal = parseFloat(updated.amount);
  if (isNaN(newAmountVal)) newAmountVal = 0.00;

  var newDateComp = formatComparableDate(newDateVal, tz);
  var targetIndex = targetRow - startRow;
  var currentRowDateComp = formatComparableDate(allRows[targetIndex][colMap.DATE - 1], tz);

  var newRowValues = new Array(maxCol);
  for (var c = 0; c < maxCol; c++) newRowValues[c] = "";
  newRowValues[colMap.DATE - 1] = newDateVal;
  newRowValues[colMap.DESCRIPTION - 1] = newDescVal;
  newRowValues[colMap.CATEGORY - 1] = newCatVal;
  newRowValues[colMap.FROM - 1] = newFromVal;
  newRowValues[colMap.TO - 1] = newToVal;
  newRowValues[colMap.AMOUNT - 1] = newAmountVal;

  // Case 1: Date is UNCHANGED!
  // Stay in the exact same row! Never move or reorder among other transactions on this day.
  if (newDateComp === currentRowDateComp) {
    sheet.getRange(targetRow, 1, 1, maxCol).setValues([newRowValues]);
    sheet.getRange(targetRow, colMap.DATE).setNumberFormat("dd mmm yyyy");
    sheet.getRange(targetRow, colMap.AMOUNT).setNumberFormat("$#,##0.00");

    SpreadsheetApp.flush();
    return {
      success: true,
      message: "Transaction updated in-place.",
      sheetName: sheet.getName(),
      row: targetRow,
      moved: false,
      recentTransactions: getRecentTransactionsFromSheet(sheet, colMap, 5)
    };
  }

  // Case 2: Date HAS CHANGED to a different day!
  // Check if target sheet year changed (e.g. Budget 2025 vs Budget 2026)
  var newSheet = getTargetSheet(updated.date);
  if (newSheet.getName() !== sheet.getName()) {
    // Clear from old sheet and shift rows up to close gap
    allRows.splice(targetIndex, 1);
    if (allRows.length > 0) {
      sheet.getRange(startRow, 1, allRows.length, maxCol).setValues(allRows);
      sheet.getRange(startRow, colMap.DATE, allRows.length, 1).setNumberFormat("dd mmm yyyy");
      sheet.getRange(startRow, colMap.AMOUNT, allRows.length, 1).setNumberFormat("$#,##0.00");
    }
    sheet.getRange(lastPopRow, 1, 1, maxCol).clearContent();
    SpreadsheetApp.flush();

    // Insert into new sheet
    var addRes = appendTransaction({
      date: updated.date,
      description: newDescVal,
      category: newCatVal,
      from: newFromVal,
      to: newToVal,
      amount: newAmountVal
    });

    return {
      success: true,
      message: "Transaction moved to " + newSheet.getName(),
      sheetName: newSheet.getName(),
      row: addRes.row,
      moved: true,
      recentTransactions: getRecentTransactionsFromSheet(newSheet, detectColumns(newSheet), 5)
    };
  }

  // Case 3: Same sheet, different day!
  // Remove the transaction from its current position
  allRows.splice(targetIndex, 1);

  // Find the exact chronological insertion index in allRows:
  // Put it at the END of newDateVal (before any transaction from all subsequent days)
  var newTargetTime = normalizeDateOnly(newDateVal, tz);
  var insertIndex = allRows.length;
  if (newTargetTime > 0) {
    for (var j = 0; j < allRows.length; j++) {
      var cellDate = allRows[j][colMap.DATE - 1];
      if (cellDate) {
        var cellTime = normalizeDateOnly(cellDate, tz);
        if (cellTime > newTargetTime) {
          insertIndex = j;
          break;
        }
      }
    }
  }

  allRows.splice(insertIndex, 0, newRowValues);

  // Write all rows back in a SINGLE atomic operation!
  // The number of rows is identical to before (count), so no rows are shifted or duplicated!
  sheet.getRange(startRow, 1, allRows.length, maxCol).setValues(allRows);
  sheet.getRange(startRow, colMap.DATE, allRows.length, 1).setNumberFormat("dd mmm yyyy");
  sheet.getRange(startRow, colMap.AMOUNT, allRows.length, 1).setNumberFormat("$#,##0.00");
  SpreadsheetApp.flush();

  var destRow = startRow + insertIndex;
  return {
    success: true,
    message: "Transaction date changed and moved to row " + destRow,
    sheetName: sheet.getName(),
    row: destRow,
    moved: true,
    recentTransactions: getRecentTransactionsFromSheet(sheet, colMap, 5)
  };
}

/**
 * GET endpoint.
 */
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? String(e.parameter.action).toLowerCase() : "";
    if (action === "recent" || action === "getrecent") {
      var targetSheet = getTargetSheet(e && e.parameter ? e.parameter.date : null);
      var colMap = detectColumns(targetSheet);
      var recent = getRecentTransactionsFromSheet(targetSheet, colMap, 5);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        sheetName: targetSheet.getName(),
        recentTransactions: recent
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var payload = getFormOptions();
    return ContentService.createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Deletes the most recent matching transaction from the budget sheet.
 * Uses atomic array rewrite if deleting from the middle to close the gap without leaving holes.
 */
function deleteLastMatchingTransaction(data) {
  var sheet = getTargetSheet(data ? data.date : null);
  var colMap = detectColumns(sheet);
  var lastRow = sheet.getLastRow();
  var headerRow = colMap.headerRow || 1;
  var startRow = headerRow + 1;
  var maxCol = colMap.maxCol || 6;
  
  if (lastRow <= headerRow) {
    return { success: false, error: "No transactions found in sheet to undo." };
  }
  
  var nextRow = findNextAvailableRow(sheet, colMap);
  var lastPopRow = nextRow - 1;
  if (lastPopRow < startRow) {
    return { success: false, error: "No populated transactions found in sheet." };
  }
  
  var targetDesc = data.description ? String(data.description).trim().toLowerCase() : "";
  var cleanTargetAmt = String(data.amount !== null && data.amount !== undefined ? data.amount : "").replace(/[^0-9.-]/g, "");
  var targetAmt = parseFloat(cleanTargetAmt);
  var tz = (sheet.getParent && sheet.getParent()) ? sheet.getParent().getSpreadsheetTimeZone() : (Session.getScriptTimeZone() || "GMT");
  var targetDateComp = formatComparableDate(data.date, tz);
  var hintRow = data.row;
  
  var count = lastPopRow - startRow + 1;
  var allRows = sheet.getRange(startRow, 1, count, maxCol).getValues();
  
  var deleteIndex = -1;
  
  // Check hint row first if provided
  if (hintRow && hintRow >= startRow && hintRow <= lastPopRow) {
    var hIdx = hintRow - startRow;
    var hDesc = String(allRows[hIdx][colMap.DESCRIPTION - 1] || "").trim().toLowerCase();
    var hAmt = parseFloat(String(allRows[hIdx][colMap.AMOUNT - 1] || "").replace(/[^0-9.-]/g, ""));
    var hDateComp = formatComparableDate(allRows[hIdx][colMap.DATE - 1], tz);
    if ((!targetDesc || hDesc === targetDesc || (targetDesc === "untitled" && !hDesc)) &&
        (isNaN(targetAmt) || Math.abs(hAmt - targetAmt) < 0.01) &&
        (!targetDateComp || hDateComp === targetDateComp)) {
      deleteIndex = hIdx;
    }
  }
  
  if (deleteIndex === -1) {
    for (var i = allRows.length - 1; i >= 0; i--) {
      var descVal = String(allRows[i][colMap.DESCRIPTION - 1] || "").trim().toLowerCase();
      var amtVal = parseFloat(String(allRows[i][colMap.AMOUNT - 1] || "").replace(/[^0-9.-]/g, ""));
      var dateComp = formatComparableDate(allRows[i][colMap.DATE - 1], tz);
      
      var matchDesc = (!targetDesc || descVal === targetDesc || (targetDesc === "untitled" && !descVal));
      var matchAmt = (isNaN(targetAmt) || Math.abs(amtVal - targetAmt) < 0.01);
      var matchDate = (!targetDateComp || dateComp === targetDateComp);
      
      if (matchDesc && matchAmt && matchDate) {
        deleteIndex = i;
        break;
      }
    }
  }
  
  if (deleteIndex === -1) {
    return { success: false, error: "Matching transaction not found in sheet." };
  }
  
  var clearedRow = startRow + deleteIndex;
  
  if (deleteIndex === allRows.length - 1) {
    // Deleting the very last populated row: just clear it
    sheet.getRange(clearedRow, 1, 1, maxCol).clearContent();
  } else {
    // Deleting from the middle: remove from array, rewrite rows, and clear the single trailing row
    allRows.splice(deleteIndex, 1);
    sheet.getRange(startRow, 1, allRows.length, maxCol).setValues(allRows);
    sheet.getRange(startRow, colMap.DATE, allRows.length, 1).setNumberFormat("dd mmm yyyy");
    sheet.getRange(startRow, colMap.AMOUNT, allRows.length, 1).setNumberFormat("$#,##0.00");
    sheet.getRange(lastPopRow, 1, 1, maxCol).clearContent();
  }
  
  SpreadsheetApp.flush();
  var updatedRecent = getRecentTransactionsFromSheet(sheet, colMap, 5);
  return { 
    success: true, 
    message: "Transaction undone and row cleared.", 
    clearedRow: clearedRow,
    recentTransactions: updatedRecent
  };
}

/**
 * Processes a batch of queued transactions and undo actions in a single atomic operation.
 * Appends multiple rows using high-speed 2D range setValues to avoid individual row lag.
 */
function batchProcessTransactions(data) {
  var items = [];
  if (Array.isArray(data)) {
    items = data;
  } else if (data && Array.isArray(data.transactions)) {
    items = data.transactions;
  } else if (data && Array.isArray(data.items)) {
    items = data.items;
  }
  
  if (!items || items.length === 0) {
    return { success: true, count: 0, message: "No items in batch." };
  }

  var processedCount = 0;
  var addsBySheet = {}; // sName -> { sheet, colMap, rows }

  function flushAddsForSheet(sheetInfo) {
    if (!sheetInfo || !sheetInfo.rows || sheetInfo.rows.length === 0) return;
    var sheet = sheetInfo.sheet;
    var colMap = sheetInfo.colMap;
    var rows = sheetInfo.rows;
    var targetRow = findNextAvailableRow(sheet, colMap);
    var maxCol = colMap.maxCol || 6;
    
    var matrix = [];
    for (var r = 0; r < rows.length; r++) {
      var row = new Array(maxCol);
      for (var c = 0; c < maxCol; c++) row[c] = "";
      var it = rows[r];
      row[colMap.DATE - 1] = it.dateVal;
      row[colMap.DESCRIPTION - 1] = it.descVal;
      row[colMap.CATEGORY - 1] = it.catVal;
      row[colMap.FROM - 1] = it.fromVal;
      row[colMap.TO - 1] = it.toVal;
      row[colMap.AMOUNT - 1] = it.amountVal;
      matrix.push(row);
    }
    
    sheet.getRange(targetRow, 1, matrix.length, maxCol).setValues(matrix);
    sheet.getRange(targetRow, colMap.DATE, matrix.length, 1).setNumberFormat("dd mmm yyyy");
    sheet.getRange(targetRow, colMap.AMOUNT, matrix.length, 1).setNumberFormat("$#,##0.00");
    sheetInfo.rows = [];
  }

  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var isUndo = it.action === "undo" || it.action === "delete";
    var isEdit = it.action === "edit" || it.action === "update";
    
    if (isUndo) {
      // Flush any queued adds before performing undo to maintain ordering
      for (var sName in addsBySheet) {
        flushAddsForSheet(addsBySheet[sName]);
      }
      deleteLastMatchingTransaction(it);
      processedCount++;
    } else if (isEdit) {
      // Flush any queued adds before performing edit
      for (var sName in addsBySheet) {
        flushAddsForSheet(addsBySheet[sName]);
      }
      editTransaction(it);
      processedCount++;
    } else {
      var sheet = getTargetSheet(it.date);
      var sheetName = sheet.getName();
      if (!addsBySheet[sheetName]) {
        addsBySheet[sheetName] = {
          sheet: sheet,
          colMap: detectColumns(sheet),
          rows: []
        };
      }
      
      var dateVal = parseDateInput(it.date);
      var descVal = it.description ? String(it.description).trim() : "";
      var catVal = it.category ? String(it.category).trim() : "";
      var fromVal = it.from ? String(it.from).trim() : "";
      var toVal = it.to ? String(it.to).trim() : "";
      var amountVal = parseFloat(it.amount);
      if (isNaN(amountVal)) amountVal = 0.00;

      addsBySheet[sheetName].rows.push({
        dateVal: dateVal,
        descVal: descVal,
        catVal: catVal,
        fromVal: fromVal,
        toVal: toVal,
        amountVal: amountVal
      });
      processedCount++;
    }
  }

  // Flush remaining adds across all sheets
  for (var sName in addsBySheet) {
    flushAddsForSheet(addsBySheet[sName]);
  }

  SpreadsheetApp.flush();

  var primarySheet = getTargetSheet();
  var primaryColMap = detectColumns(primarySheet);
  return {
    success: true,
    processedCount: processedCount,
    message: "Processed " + processedCount + " transactions in batch.",
    recentTransactions: getRecentTransactionsFromSheet(primarySheet, primaryColMap, 5)
  };
}

/**
 * POST endpoint.
 */
function doPost(e) {
  try {
    var data = null;
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        data = e.parameter;
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }
    
    if (!data) throw new Error("No data received in request.");

    var action = data.action ? String(data.action).trim().toLowerCase() : "";
    
    // Batch processing of queued offline transactions
    if (action === "batch" || Array.isArray(data.transactions) || Array.isArray(data.items)) {
      var batchResponse = batchProcessTransactions(data);
      return ContentService.createTextOutput(JSON.stringify(batchResponse))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "undo" || action === "delete") {
      var undoResponse = deleteLastMatchingTransaction(data);
      return ContentService.createTextOutput(JSON.stringify(undoResponse))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "edit" || action === "update") {
      var editResponse = editTransaction(data);
      return ContentService.createTextOutput(JSON.stringify(editResponse))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var response = appendTransaction(data);
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

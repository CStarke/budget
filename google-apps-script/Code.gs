/**
 * Budget Helper - Google Apps Script Backend (v8 - Formula-Safe Undo & Live Sheet Recent Transactions)
 * 
 * Automatically connects your "Budget" mobile app to your Google Sheets table.
 * - Dynamically scans the "Category" tab's first row to find columns by name ("Category", "From", "To").
 * - You can add, reorder, or insert columns at any time without breaking anything.
 * - Appends transactions to "Budget {Current Year}" without overwriting manual rows.
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
 * Finds the target budget sheet for the current year or fallback.
 */
function getTargetSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var currentYear = new Date().getFullYear();
  var expectedName = CONFIG.SHEET_NAME_PREFIX + currentYear;
  
  // 1. Try "Budget {Current Year}" (e.g. Budget 2026)
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
    AMOUNT: CONFIG.DEFAULT_COLUMNS.AMOUNT
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
      else if (val.indexOf("amount") !== -1 || val.indexOf("price") !== -1 || val === "cost" || val === "spent") { tempMap.AMOUNT = c + 1; foundCount++; }
    }
    
    if (foundCount >= 3) {
      colMap.headerRow = r + 1;
      if (tempMap.DATE) colMap.DATE = tempMap.DATE;
      if (tempMap.DESCRIPTION) colMap.DESCRIPTION = tempMap.DESCRIPTION;
      if (tempMap.CATEGORY) colMap.CATEGORY = tempMap.CATEGORY;
      if (tempMap.FROM) colMap.FROM = tempMap.FROM;
      if (tempMap.TO) colMap.TO = tempMap.TO;
      if (tempMap.AMOUNT) colMap.AMOUNT = tempMap.AMOUNT;
      break;
    }
  }
  
  return colMap;
}

/**
 * Finds the next truly empty row in the table (never overwriting existing data).
 */
function findNextAvailableRow(sheet, colMap) {
  var lastRow = sheet.getLastRow();
  var startRow = colMap.headerRow + 1;
  
  if (lastRow < startRow) {
    return startRow;
  }
  
  var maxCol = Math.max(colMap.DATE, colMap.DESCRIPTION, colMap.CATEGORY, colMap.FROM, colMap.TO, colMap.AMOUNT);
  var values = sheet.getRange(startRow, 1, lastRow - startRow + 1, maxCol).getValues();
  
  var lastPopulatedRow = startRow - 1;
  for (var r = values.length - 1; r >= 0; r--) {
    var hasContent = values[r].some(function(cell) {
      return cell !== "" && cell !== null && cell !== undefined;
    });
    if (hasContent) {
      lastPopulatedRow = startRow + r;
      break;
    }
  }
  
  return lastPopulatedRow + 1;
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
  var maxCol = Math.max(colMap.DATE, colMap.DESCRIPTION, colMap.CATEGORY, colMap.FROM, colMap.TO, colMap.AMOUNT, 6);
  var values = sheet.getRange(startRow, 1, numRows, maxCol).getValues();
  
  var list = [];
  // Loop from the very bottom row upwards
  for (var i = values.length - 1; i >= 0; i--) {
    var rowValues = values[i];
    
    // Check if row has any non-empty cell
    var hasContent = rowValues.some(function(cell) {
      return cell !== "" && cell !== null && cell !== undefined;
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
      dateStr = Utilities.formatDate(rawDate, Session.getScriptTimeZone() || "GMT", "yyyy-MM-dd");
    } else if (rawDate) {
      dateStr = String(rawDate).trim();
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
 * Appends transaction to the budget sheet.
 */
function appendTransaction(data) {
  var sheet = getTargetSheet();
  var colMap = detectColumns(sheet);
  var targetRow = findNextAvailableRow(sheet, colMap);
  
  var dateVal = parseDateInput(data.date);
  var descVal = data.description ? String(data.description).trim() : "";
  var catVal = data.category ? String(data.category).trim() : "";
  var fromVal = data.from ? String(data.from).trim() : "";
  var toVal = data.to ? String(data.to).trim() : "";
  var amountVal = parseFloat(data.amount);
  if (isNaN(amountVal)) amountVal = 0.00;
  
  sheet.getRange(targetRow, colMap.DATE).setValue(dateVal);
  sheet.getRange(targetRow, colMap.DESCRIPTION).setValue(descVal);
  sheet.getRange(targetRow, colMap.CATEGORY).setValue(catVal);
  sheet.getRange(targetRow, colMap.FROM).setValue(fromVal);
  sheet.getRange(targetRow, colMap.TO).setValue(toVal);
  sheet.getRange(targetRow, colMap.AMOUNT).setValue(amountVal);
  
  sheet.getRange(targetRow, colMap.DATE).setNumberFormat("dd mmm yyyy");
  sheet.getRange(targetRow, colMap.AMOUNT).setNumberFormat("$#,##0.00");
  
  return {
    success: true,
    message: "Transaction added successfully",
    sheetName: sheet.getName(),
    row: targetRow,
    recentTransactions: getRecentTransactionsFromSheet(sheet, colMap, 5),
    entry: {
      date: Utilities.formatDate(dateVal, Session.getScriptTimeZone() || "GMT", "dd MMM yyyy"),
      description: descVal,
      category: catVal,
      from: fromVal,
      to: toVal,
      amount: amountVal
    }
  };
}

/**
 * GET endpoint.
 */
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? String(e.parameter.action).toLowerCase() : "";
    if (action === "recent" || action === "getrecent") {
      var targetSheet = getTargetSheet();
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
 * Uses batch range fetch for high performance.
 */
function deleteLastMatchingTransaction(data) {
  var sheet = getTargetSheet();
  var colMap = detectColumns(sheet);
  var lastRow = sheet.getLastRow();
  var headerRow = colMap.headerRow || 1;
  
  if (lastRow <= headerRow) {
    return { success: false, error: "No transactions found in sheet to undo." };
  }
  
  var targetDesc = data.description ? String(data.description).trim().toLowerCase() : "";
  var cleanTargetAmt = String(data.amount !== null && data.amount !== undefined ? data.amount : "").replace(/[^0-9.-]/g, "");
  var targetAmt = parseFloat(cleanTargetAmt);
  var maxCol = Math.max(colMap.DATE, colMap.DESCRIPTION, colMap.CATEGORY, colMap.FROM, colMap.TO, colMap.AMOUNT, 6);
  
  var numRows = lastRow - headerRow;
  var values = sheet.getRange(headerRow + 1, 1, numRows, maxCol).getValues();
  
  // Search backwards from the most recently appended row
  for (var i = values.length - 1; i >= 0; i--) {
    var rowValues = values[i];
    var descVal = String(rowValues[colMap.DESCRIPTION - 1] || "").trim().toLowerCase();
    var cleanRowAmt = String(rowValues[colMap.AMOUNT - 1] !== null && rowValues[colMap.AMOUNT - 1] !== undefined ? rowValues[colMap.AMOUNT - 1] : "").replace(/[^0-9.-]/g, "");
    var amtVal = parseFloat(cleanRowAmt);
    
    var matchDesc = (!targetDesc || descVal === targetDesc || (targetDesc === "untitled" && !descVal));
    var matchAmt = (isNaN(targetAmt) || Math.abs(amtVal - targetAmt) < 0.01);
    
    if (matchDesc && matchAmt) {
      var rowToClear = headerRow + 1 + i;
      
      // CRITICAL: Clear only the transaction columns (Columns 1 to maxCol, e.g. A-F).
      // DO NOT delete the entire row (`deleteRow`), because deleting physical sheet rows
      // destroys relative cell references in formulas (turning N($G5) into N(#REF!)).
      // Clearing columns A-F causes `=IF($F6="","",...)` to evaluate cleanly to empty,
      // preserving calculation formulas in columns G+ intact for subsequent entries.
      sheet.getRange(rowToClear, 1, 1, maxCol).clearContent();
      
      var updatedRecent = getRecentTransactionsFromSheet(sheet, colMap, 5);
      return { 
        success: true, 
        message: "Transaction undone and row cleared.", 
        clearedRow: rowToClear,
        recentTransactions: updatedRecent
      };
    }
  }
  return { success: false, error: "Matching transaction not found in sheet." };
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
    if (action === "undo" || action === "delete") {
      var undoResponse = deleteLastMatchingTransaction(data);
      return ContentService.createTextOutput(JSON.stringify(undoResponse))
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

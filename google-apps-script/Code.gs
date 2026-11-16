/**
 * Budget Helper - Google Apps Script Backend (Streamlined Fixed Layout)
 * 
 * Column Convention (Row 1 = Headers, Rows 2+ = Transactions):
 * Col 1 (A): Date
 * Col 2 (B): Description
 * Col 3 (C): Category
 * Col 4 (D): From
 * Col 5 (E): To
 * Col 6 (F): Amount
 * 
 * Category Tab: "Category" (Col A: Category, Col B: From, Col C: To)
 */

var CONFIG = {
  SHEET_NAME_PREFIX: "Budget ",
  FALLBACK_SHEET_NAME: "Budget 2026",
  CATEGORY_TAB_NAME: "Category",
  START_ROW: 2,
  MAX_COL: 6,
  COL: {
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
  return ss.getSheetByName(CONFIG.SHEET_NAME_PREFIX + targetYear) ||
         ss.getSheetByName(CONFIG.FALLBACK_SHEET_NAME) ||
         ss.getSheets()[0];
}

/**
 * Returns the Category tab.
 */
function getCategorySheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.CATEGORY_TAB_NAME);
}

/**
 * Reads options directly from the Category tab (Col A: Category, Col B: From, Col C: To).
 */
function getOptionsFromCategoryTab(categorySheet) {
  if (!categorySheet) return { category: [], from: [], to: [] };
  var lastRow = categorySheet.getLastRow();
  if (lastRow < CONFIG.START_ROW) {
    return { category: [], from: [], to: [] };
  }
  
  var values = categorySheet.getRange(CONFIG.START_ROW, 1, lastRow - CONFIG.START_ROW + 1, 3).getValues();
  var cat = [], from = [], to = [];
  var seenCat = {}, seenFrom = {}, seenTo = {};

  for (var r = 0; r < values.length; r++) {
    var cVal = values[r][0] !== null && values[r][0] !== undefined ? String(values[r][0]).trim() : "";
    var fVal = values[r][1] !== null && values[r][1] !== undefined ? String(values[r][1]).trim() : "";
    var tVal = values[r][2] !== null && values[r][2] !== undefined ? String(values[r][2]).trim() : "";

    if (cVal && !seenCat[cVal]) { seenCat[cVal] = true; cat.push(cVal); }
    if (fVal && !seenFrom[fVal]) { seenFrom[fVal] = true; from.push(fVal); }
    if (tVal && !seenTo[tVal]) { seenTo[tVal] = true; to.push(tVal); }
  }

  return { category: cat, from: from, to: to };
}

/**
 * Finds the next truly empty row in transaction columns A-F.
 * Ignores running balance formula columns in columns G+.
 */
function findNextAvailableRow(sheet) {
  var lastRow = sheet.getLastRow();
  var startRow = CONFIG.START_ROW;
  if (lastRow < startRow) return startRow;

  var values = sheet.getRange(startRow, 1, lastRow - startRow + 1, CONFIG.MAX_COL).getValues();
  for (var r = values.length - 1; r >= 0; r--) {
    var hasContent = values[r].some(function(cell) {
      return String(cell !== null && cell !== undefined ? cell : "").trim() !== "";
    });
    if (hasContent) return startRow + r + 1;
  }
  return startRow;
}

/**
 * Formats a Date or date string to YYYY-MM-DD using spreadsheet timezone.
 */
function formatComparableDate(val, tz) {
  if (!val) return "";
  if (typeof val === "string") {
    var m = val.trim().match(/^(\\d{4})-(\\d{1,2})-(\\d{1,2})/);
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
 * Clears all cell borders in Column F (Amount) starting from Row 2 downwards.
 */
function clearAmountColumnBorders(sheet) {
  try {
    var amountCol = CONFIG.COL.AMOUNT;
    var startRow = CONFIG.START_ROW;
    var maxRows = Math.max(sheet.getLastRow() || 0, sheet.getMaxRows() || 0, startRow);
    var numRows = maxRows - startRow + 1;
    if (numRows > 0) {
      sheet.getRange(startRow, amountCol, numRows, 1).setBorder(false, false, false, false, false, false);
    }
  } catch (e) {}
}

/**
 * Detects and removes any identical consecutive trailing duplicate rows from the array.
 */
function cleanTrailingDuplicates(allRows, tz) {
  if (!allRows || allRows.length < 2) return allRows;
  var dateCol = CONFIG.COL.DATE - 1;
  var descCol = CONFIG.COL.DESCRIPTION - 1;
  var catCol = CONFIG.COL.CATEGORY - 1;
  var amtCol = CONFIG.COL.AMOUNT - 1;

  while (allRows.length >= 2) {
    var last = allRows[allRows.length - 1];
    var prev = allRows[allRows.length - 2];
    
    var lastDate = formatComparableDate(last[dateCol], tz);
    var prevDate = formatComparableDate(prev[dateCol], tz);
    var lastDesc = String(last[descCol] || "").trim().toLowerCase();
    var prevDesc = String(prev[descCol] || "").trim().toLowerCase();
    var lastAmt = parseFloat(String(last[amtCol] !== null && last[amtCol] !== undefined ? last[amtCol] : "").replace(/[^0-9.-]/g, ""));
    var prevAmt = parseFloat(String(prev[amtCol] !== null && prev[amtCol] !== undefined ? prev[amtCol] : "").replace(/[^0-9.-]/g, ""));
    var lastCat = String(last[catCol] || "").trim().toLowerCase();
    var prevCat = String(prev[catCol] || "").trim().toLowerCase();

    var isDuplicate = (lastDate === prevDate && lastDesc === prevDesc && Math.abs(lastAmt - prevAmt) < 0.01 && lastCat === prevCat);
    if (isDuplicate) {
      allRows.pop();
    } else {
      break;
    }
  }
  return allRows;
}

/**
 * Retrieves the most recent N transactions from the budget sheet.
 */
function getRecentTransactionsFromSheet(sheet, limit) {
  limit = limit || 5;
  var lastRow = sheet.getLastRow();
  var startRow = CONFIG.START_ROW;
  if (lastRow < startRow) return [];

  var maxCol = CONFIG.MAX_COL;
  var tz = (sheet.getParent && sheet.getParent()) ? sheet.getParent().getSpreadsheetTimeZone() : (Session.getScriptTimeZone() || "GMT");

  // Automatically detect and clean any trailing duplicate rows in the sheet
  var nextRow = findNextAvailableRow(sheet);
  var lastPopRow = nextRow - 1;
  if (lastPopRow > startRow) {
    var checkRows = sheet.getRange(startRow, 1, lastPopRow - startRow + 1, maxCol).getValues();
    var beforeLen = checkRows.length;
    cleanTrailingDuplicates(checkRows, tz);
    if (checkRows.length < beforeLen) {
      sheet.getRange(startRow, 1, checkRows.length, maxCol).setValues(checkRows);
      var trailingRow = startRow + checkRows.length;
      var rowsToClear = lastPopRow - trailingRow + 1;
      sheet.getRange(trailingRow, 1, rowsToClear, maxCol).clearContent();
      for (var k = 0; k < rowsToClear; k++) {
        try { sheet.deleteRow(trailingRow); } catch (e) {}
      }
      clearAmountColumnBorders(sheet);
      SpreadsheetApp.flush();
    }
  }

  var curNextRow = findNextAvailableRow(sheet);
  var curLastPop = curNextRow - 1;
  if (curLastPop < startRow) return [];

  var numRows = curLastPop - startRow + 1;
  var values = sheet.getRange(startRow, 1, numRows, maxCol).getValues();
  
  var list = [];
  var dateCol = CONFIG.COL.DATE - 1;
  var descCol = CONFIG.COL.DESCRIPTION - 1;
  var catCol = CONFIG.COL.CATEGORY - 1;
  var fromCol = CONFIG.COL.FROM - 1;
  var toCol = CONFIG.COL.TO - 1;
  var amtCol = CONFIG.COL.AMOUNT - 1;

  for (var i = values.length - 1; i >= 0; i--) {
    var rowValues = values[i];
    var hasContent = rowValues.some(function(cell) {
      return String(cell !== null && cell !== undefined ? cell : "").trim() !== "";
    });
    if (!hasContent) continue;
    
    var desc = String(rowValues[descCol] || "").trim();
    var cat = String(rowValues[catCol] || "").trim();
    var fromVal = String(rowValues[fromCol] || "").trim();
    var toVal = String(rowValues[toCol] || "").trim();
    var rawAmt = rowValues[amtCol];
    var rawDate = rowValues[dateCol];
    
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
    
    if (list.length >= limit) break;
  }
  return list;
}

/**
 * Master options loader.
 */
function getFormOptions() {
  var targetSheet = getTargetSheet();
  var catSheet = getCategorySheet();
  var options = getOptionsFromCategoryTab(catSheet);
  var recentTransactions = getRecentTransactionsFromSheet(targetSheet, 5);
  
  return {
    success: true,
    sheetName: targetSheet.getName(),
    timestamp: new Date().toISOString(),
    options: options,
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
 * Uses atomic in-memory array manipulation and a single setValues call.
 */
function appendTransaction(data) {
  var sheet = getTargetSheet(data ? data.date : null);
  var dateVal = parseDateInput(data.date);
  var descVal = data.description ? String(data.description).trim() : "";
  var catVal = data.category ? String(data.category).trim() : "";
  var fromVal = data.from ? String(data.from).trim() : "";
  var toVal = data.to ? String(data.to).trim() : "";
  var amountVal = parseFloat(data.amount);
  if (isNaN(amountVal)) amountVal = 0.00;

  var maxCol = CONFIG.MAX_COL;
  var startRow = CONFIG.START_ROW;
  var nextRow = findNextAvailableRow(sheet);
  var lastPopRow = nextRow - 1;
  var tz = (sheet.getParent && sheet.getParent()) ? sheet.getParent().getSpreadsheetTimeZone() : (Session.getScriptTimeZone() || "GMT");
  var targetTime = normalizeDateOnly(dateVal, tz);

  var newRow = [dateVal, descVal, catVal, fromVal, toVal, amountVal];
  var targetRow = nextRow;

  if (lastPopRow < startRow) {
    sheet.getRange(startRow, 1, 1, maxCol).setValues([newRow]);
    sheet.getRange(startRow, CONFIG.COL.DATE).setNumberFormat("dd mmm yyyy");
    sheet.getRange(startRow, CONFIG.COL.AMOUNT).setNumberFormat("$#,##0.00");
    targetRow = startRow;
  } else {
    var count = lastPopRow - startRow + 1;
    var allRows = sheet.getRange(startRow, 1, count, maxCol).getValues();
    
    var insertIndex = allRows.length;
    if (targetTime > 0) {
      for (var i = 0; i < allRows.length; i++) {
        var cellDate = allRows[i][CONFIG.COL.DATE - 1];
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
      sheet.getRange(nextRow, CONFIG.COL.DATE).setNumberFormat("dd mmm yyyy");
      sheet.getRange(nextRow, CONFIG.COL.AMOUNT).setNumberFormat("$#,##0.00");
      targetRow = nextRow;
    } else {
      allRows.splice(insertIndex, 0, newRow);
      if ((startRow + allRows.length - 1) > sheet.getMaxRows()) {
        sheet.insertRowsAfter(sheet.getMaxRows(), 50);
      }
      sheet.getRange(startRow, 1, allRows.length, maxCol).setValues(allRows);
      sheet.getRange(startRow, CONFIG.COL.DATE, allRows.length, 1).setNumberFormat("dd mmm yyyy");
      sheet.getRange(startRow, CONFIG.COL.AMOUNT, allRows.length, 1).setNumberFormat("$#,##0.00");
      targetRow = startRow + insertIndex;
    }
  }

  clearAmountColumnBorders(sheet);
  SpreadsheetApp.flush();

  return {
    success: true,
    message: "Transaction added successfully",
    sheetName: sheet.getName(),
    row: targetRow,
    recentTransactions: getRecentTransactionsFromSheet(sheet, 5),
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
 * Preserves exact in-place order when date is unchanged.
 * Relocates chronologically when date is modified.
 */
function editTransaction(data) {
  var orig = data.original || data;
  var updated = data.updated || data;
  
  var origDateStr = orig.date;
  var sheet = getTargetSheet(origDateStr);
  var lastRow = sheet.getLastRow();
  var startRow = CONFIG.START_ROW;
  var maxCol = CONFIG.MAX_COL;
  var tz = (sheet.getParent && sheet.getParent()) ? sheet.getParent().getSpreadsheetTimeZone() : (Session.getScriptTimeZone() || "GMT");

  if (lastRow < startRow) {
    return { success: false, error: "No transactions found in sheet." };
  }

  var nextRowCur = findNextAvailableRow(sheet);
  var lastPopRow = nextRowCur - 1;
  if (lastPopRow < startRow) {
    return { success: false, error: "No populated transactions found in sheet." };
  }

  var count = lastPopRow - startRow + 1;
  var allRows = sheet.getRange(startRow, 1, count, maxCol).getValues();

  var origDesc = orig.description ? String(orig.description).trim().toLowerCase() : "";
  var origAmt = parseFloat(String(orig.amount || "").replace(/[^0-9.-]/g, ""));
  var origDateComp = formatComparableDate(origDateStr, tz);

  var targetRow = -1;
  var hintRow = data.row || orig.row;
  var dateCol = CONFIG.COL.DATE - 1;
  var descCol = CONFIG.COL.DESCRIPTION - 1;
  var amtCol = CONFIG.COL.AMOUNT - 1;

  if (hintRow && hintRow >= startRow && hintRow <= lastPopRow) {
    var idx = hintRow - startRow;
    var rowDesc = String(allRows[idx][descCol] || "").trim().toLowerCase();
    var rowAmt = parseFloat(String(allRows[idx][amtCol] || "").replace(/[^0-9.-]/g, ""));
    var rowDateComp = formatComparableDate(allRows[idx][dateCol], tz);
    
    var descMatch = (!origDesc || rowDesc === origDesc || (origDesc === "untitled" && !rowDesc));
    var amtMatch = (isNaN(origAmt) || Math.abs(rowAmt - origAmt) < 0.01);
    var dateMatch = (!origDateComp || rowDateComp === origDateComp);
    if (descMatch && amtMatch && dateMatch) {
      targetRow = hintRow;
    }
  }

  if (targetRow === -1) {
    for (var i = allRows.length - 1; i >= 0; i--) {
      var rDesc = String(allRows[i][descCol] || "").trim().toLowerCase();
      var rAmt = parseFloat(String(allRows[i][amtCol] || "").replace(/[^0-9.-]/g, ""));
      var rDateComp = formatComparableDate(allRows[i][dateCol], tz);
      
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

  var newDateVal = parseDateInput(updated.date);
  var newDescVal = updated.description ? String(updated.description).trim() : "";
  var newCatVal = updated.category ? String(updated.category).trim() : "";
  var newFromVal = updated.from ? String(updated.from).trim() : "";
  var newToVal = updated.to ? String(updated.to).trim() : "";
  var newAmountVal = parseFloat(updated.amount);
  if (isNaN(newAmountVal)) newAmountVal = 0.00;

  var newDateComp = formatComparableDate(newDateVal, tz);
  var targetIndex = targetRow - startRow;
  var currentRowDateComp = formatComparableDate(allRows[targetIndex][dateCol], tz);

  var newRowValues = [newDateVal, newDescVal, newCatVal, newFromVal, newToVal, newAmountVal];

  // Case 1: Date is UNCHANGED!
  if (newDateComp === currentRowDateComp) {
    sheet.getRange(targetRow, 1, 1, maxCol).setValues([newRowValues]);
    sheet.getRange(targetRow, CONFIG.COL.DATE).setNumberFormat("dd mmm yyyy");
    sheet.getRange(targetRow, CONFIG.COL.AMOUNT).setNumberFormat("$#,##0.00");
    clearAmountColumnBorders(sheet);
    SpreadsheetApp.flush();
    return {
      success: true,
      message: "Transaction updated in-place.",
      sheetName: sheet.getName(),
      row: targetRow,
      moved: false,
      recentTransactions: getRecentTransactionsFromSheet(sheet, 5)
    };
  }

  // Case 2: Date changed to a different year sheet
  var newSheet = getTargetSheet(updated.date);
  if (newSheet.getName() !== sheet.getName()) {
    allRows.splice(targetIndex, 1);
    if (allRows.length > 0) {
      sheet.getRange(startRow, 1, allRows.length, maxCol).setValues(allRows);
      sheet.getRange(startRow, CONFIG.COL.DATE, allRows.length, 1).setNumberFormat("dd mmm yyyy");
      sheet.getRange(startRow, CONFIG.COL.AMOUNT, allRows.length, 1).setNumberFormat("$#,##0.00");
    }
    var trailingRow = startRow + allRows.length;
    var rowsToClear = Math.max(1, lastPopRow - trailingRow + 1);
    sheet.getRange(trailingRow, 1, rowsToClear, maxCol).clearContent();
    clearAmountColumnBorders(sheet);
    SpreadsheetApp.flush();

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
      message: "Transaction moved from " + sheet.getName() + " to " + newSheet.getName(),
      sheetName: newSheet.getName(),
      row: addRes.row,
      moved: true,
      recentTransactions: getRecentTransactionsFromSheet(newSheet, 5)
    };
  }

  // Case 3: Date changed within the same sheet
  allRows.splice(targetIndex, 1);
  var newTargetTime = normalizeDateOnly(newDateVal, tz);
  var insertIndex = allRows.length;
  if (newTargetTime > 0) {
    for (var j = 0; j < allRows.length; j++) {
      var cellDate = allRows[j][dateCol];
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
  sheet.getRange(startRow, 1, allRows.length, maxCol).setValues(allRows);
  sheet.getRange(startRow, CONFIG.COL.DATE, allRows.length, 1).setNumberFormat("dd mmm yyyy");
  sheet.getRange(startRow, CONFIG.COL.AMOUNT, allRows.length, 1).setNumberFormat("$#,##0.00");
  clearAmountColumnBorders(sheet);
  SpreadsheetApp.flush();

  var destRow = startRow + insertIndex;
  return {
    success: true,
    message: "Transaction date changed and moved to row " + destRow,
    sheetName: sheet.getName(),
    row: destRow,
    moved: true,
    recentTransactions: getRecentTransactionsFromSheet(sheet, 5)
  };
}

/**
 * Deletes the most recent matching transaction from the budget sheet.
 */
function deleteLastMatchingTransaction(data) {
  var sheet = getTargetSheet(data ? data.date : null);
  var lastRow = sheet.getLastRow();
  var startRow = CONFIG.START_ROW;
  var maxCol = CONFIG.MAX_COL;
  
  if (lastRow < startRow) {
    return { success: false, error: "No transactions found in sheet to undo." };
  }
  
  var nextRow = findNextAvailableRow(sheet);
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
  var dateCol = CONFIG.COL.DATE - 1;
  var descCol = CONFIG.COL.DESCRIPTION - 1;
  var amtCol = CONFIG.COL.AMOUNT - 1;

  if (hintRow && hintRow >= startRow && hintRow <= lastPopRow) {
    var hIdx = hintRow - startRow;
    var hDesc = String(allRows[hIdx][descCol] || "").trim().toLowerCase();
    var hAmt = parseFloat(String(allRows[hIdx][amtCol] || "").replace(/[^0-9.-]/g, ""));
    var hDateComp = formatComparableDate(allRows[hIdx][dateCol], tz);
    if ((!targetDesc || hDesc === targetDesc || (targetDesc === "untitled" && !hDesc)) &&
        (isNaN(targetAmt) || Math.abs(hAmt - targetAmt) < 0.01) &&
        (!targetDateComp || hDateComp === targetDateComp)) {
      deleteIndex = hIdx;
    }
  }
  
  if (deleteIndex === -1) {
    for (var i = allRows.length - 1; i >= 0; i--) {
      var descVal = String(allRows[i][descCol] || "").trim().toLowerCase();
      var amtVal = parseFloat(String(allRows[i][amtCol] || "").replace(/[^0-9.-]/g, ""));
      var dateComp = formatComparableDate(allRows[i][dateCol], tz);
      
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
  allRows.splice(deleteIndex, 1);
  cleanTrailingDuplicates(allRows, tz);

  if (allRows.length > 0) {
    sheet.getRange(startRow, 1, allRows.length, maxCol).setValues(allRows);
    sheet.getRange(startRow, CONFIG.COL.DATE, allRows.length, 1).setNumberFormat("dd mmm yyyy");
    sheet.getRange(startRow, CONFIG.COL.AMOUNT, allRows.length, 1).setNumberFormat("$#,##0.00");
  }

  var trailingRow = startRow + allRows.length;
  var rowsToClear = Math.max(1, lastPopRow - trailingRow + 1);
  sheet.getRange(trailingRow, 1, rowsToClear, maxCol).clearContent();
  for (var d = 0; d < rowsToClear; d++) {
    try { sheet.deleteRow(trailingRow); } catch (e) {}
  }
  
  clearAmountColumnBorders(sheet);
  SpreadsheetApp.flush();
  return { 
    success: true, 
    message: "Transaction deleted and rows compacted.", 
    clearedRow: clearedRow,
    recentTransactions: getRecentTransactionsFromSheet(sheet, 5)
  };
}

/**
 * Processes a batch of queued transactions and undo actions in a single atomic operation.
 */
function batchProcessTransactions(data) {
  var items = [];
  if (Array.isArray(data)) {
    items = data;
  } else if (data && Array.isArray(data.transactions)) {
    items = data.transactions;
  } else if (data && Array.isArray(data.items)) {
    items = data.items;
  } else if (data && typeof data === "object") {
    items = [data];
  }

  var processedCount = 0;
  var addsBySheet = {}; // sName -> { sheet, rows }

  function flushAddsForSheet(sheetInfo) {
    if (!sheetInfo || !sheetInfo.rows || sheetInfo.rows.length === 0) return;
    var sheet = sheetInfo.sheet;
    var rows = sheetInfo.rows;
    var targetRow = findNextAvailableRow(sheet);
    var maxCol = CONFIG.MAX_COL;
    
    var matrix = [];
    for (var r = 0; r < rows.length; r++) {
      var it = rows[r];
      matrix.push([it.dateVal, it.descVal, it.catVal, it.fromVal, it.toVal, it.amountVal]);
    }
    
    sheet.getRange(targetRow, 1, matrix.length, maxCol).setValues(matrix);
    sheet.getRange(targetRow, CONFIG.COL.DATE, matrix.length, 1).setNumberFormat("dd mmm yyyy");
    sheet.getRange(targetRow, CONFIG.COL.AMOUNT, matrix.length, 1).setNumberFormat("$#,##0.00");
    clearAmountColumnBorders(sheet);
    sheetInfo.rows = [];
  }

  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var isUndo = it.action === "undo" || it.action === "delete";
    var isEdit = it.action === "edit" || it.action === "update";
    
    if (isUndo) {
      for (var sName in addsBySheet) {
        flushAddsForSheet(addsBySheet[sName]);
      }
      deleteLastMatchingTransaction(it);
      processedCount++;
    } else if (isEdit) {
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

  for (var sName in addsBySheet) {
    flushAddsForSheet(addsBySheet[sName]);
  }

  SpreadsheetApp.flush();

  var primarySheet = getTargetSheet();
  return {
    success: true,
    processedCount: processedCount,
    message: "Processed " + processedCount + " transactions in batch.",
    recentTransactions: getRecentTransactionsFromSheet(primarySheet, 5)
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
      var recent = getRecentTransactionsFromSheet(targetSheet, 5);
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
`

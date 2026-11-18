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
  TARGET_TABLE_NAME: "CategoryToFrom",
  START_ROW: 2,
  MAX_COL: 6,
  RECENT_LIMIT: 6,
  COL: {
    DATE: 1,
    DESCRIPTION: 2,
    CATEGORY: 3,
    FROM: 4,
    TO: 5,
    AMOUNT: 6,
    SKIP: 13
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
 * Reads options dynamically from the native table titled "CategoryToFrom" on the Category tab.
 * Dynamically resolves Category, From, and To columns regardless of column position or order.
 * Strictly ignores the "Category" column in "Spending by Category" or any other table.
 */
function getOptionsFromCategoryTab(categorySheet) {
  if (!categorySheet) return { category: [], from: [], to: [] };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var targetTableName = CONFIG.TARGET_TABLE_NAME || "CategoryToFrom";

  // Helper to extract unique, non-empty values from a 2D array column
  function extractColumnFromTable(tableData, colIdx, isCategory) {
    if (colIdx < 0) return [];
    var list = [];
    var seen = {};
    for (var r = 1; r < tableData.length; r++) { // Skip row 0 (headers)
      var val = tableData[r][colIdx];
      if (val !== null && val !== undefined) {
        var str = String(val).trim();
        if (str.length > 0) {
          if (isCategory && (str.toLowerCase() === "total spent" || str.toLowerCase().indexOf("total spent") === 0)) {
            continue;
          }
          if (!seen[str]) {
            seen[str] = true;
            list.push(str);
          }
        }
      }
    }
    return list;
  }

  // Helper to identify column indices for Category, From, and To from a header array
  function findHeaderIndices(headerRow) {
    var catIdx = -1, fromIdx = -1, toIdx = -1;
    for (var c = 0; c < headerRow.length; c++) {
      var h = String(headerRow[c] || "").trim().toLowerCase();
      if (!h) continue;
      if (h === "category" || h === "categories") {
        catIdx = c;
      } else if (h === "from" || h.indexOf("source") !== -1 || h.indexOf("account") !== -1) {
        fromIdx = c;
      } else if (h === "to" || h.indexOf("dest") !== -1 || h.indexOf("payee") !== -1) {
        toIdx = c;
      }
    }
    return { catIdx: catIdx, fromIdx: fromIdx, toIdx: toIdx };
  }

  // -------------------------------------------------------------
  // Layer 1A: Native Table via Google Sheets API Service (v4)
  // -------------------------------------------------------------
  if (typeof Sheets !== "undefined" && Sheets.Spreadsheets) {
    try {
      var metadata = Sheets.Spreadsheets.get(ss.getId(), {
        fields: "sheets.properties.title,sheets.tables.name,sheets.tables.range"
      });
      if (metadata && metadata.sheets) {
        for (var s = 0; s < metadata.sheets.length; s++) {
          var sObj = metadata.sheets[s];
          if (sObj.tables) {
            for (var t = 0; t < sObj.tables.length; t++) {
              var tbl = sObj.tables[t];
              if (String(tbl.name).trim().toLowerCase() === targetTableName.toLowerCase()) {
                var sh = ss.getSheetByName(sObj.properties.title) || categorySheet;
                var gr = tbl.range;
                var startR = gr.startRowIndex + 1;
                var numR = gr.endRowIndex - gr.startRowIndex;
                var startC = gr.startColumnIndex + 1;
                var numC = gr.endColumnIndex - gr.startColumnIndex;

                var tableValues = sh.getRange(startR, startC, numR, numC).getValues();
                if (tableValues.length > 1) {
                  var indices = findHeaderIndices(tableValues[0]);
                  return {
                    category: extractColumnFromTable(tableValues, indices.catIdx, true),
                    from: extractColumnFromTable(tableValues, indices.fromIdx, false),
                    to: extractColumnFromTable(tableValues, indices.toIdx, false)
                  };
                }
              }
            }
          }
        }
      }
    } catch (eApi) {
      Logger.log("Layer 1A (Sheets API) error: " + eApi);
    }
  }

  // -------------------------------------------------------------
  // Layer 1B: Native Table via Sheets REST API endpoint
  // -------------------------------------------------------------
  try {
    var restUrl = "https://sheets.googleapis.com/v4/spreadsheets/" + ss.getId() + "?fields=sheets.properties.title,sheets.tables.name,sheets.tables.range";
    var token = ScriptApp.getOAuthToken();
    if (token) {
      var res = UrlFetchApp.fetch(restUrl, {
        method: "GET",
        headers: { "Authorization": "Bearer " + token },
        muteHttpExceptions: true
      });
      if (res.getResponseCode() === 200) {
        var restData = JSON.parse(res.getContentText());
        if (restData && restData.sheets) {
          for (var rs = 0; rs < restData.sheets.length; rs++) {
            var rSheet = restData.sheets[rs];
            if (rSheet.tables) {
              for (var rt = 0; rt < rSheet.tables.length; rt++) {
                var rTbl = rSheet.tables[rt];
                if (String(rTbl.name).trim().toLowerCase() === targetTableName.toLowerCase()) {
                  var rSh = ss.getSheetByName(rSheet.properties.title) || categorySheet;
                  var rGr = rTbl.range;
                  var rStartR = rGr.startRowIndex + 1;
                  var rNumR = rGr.endRowIndex - rGr.startRowIndex;
                  var rStartC = rGr.startColumnIndex + 1;
                  var rNumC = rGr.endColumnIndex - rGr.startColumnIndex;

                  var rTableValues = rSh.getRange(rStartR, rStartC, rNumR, rNumC).getValues();
                  if (rTableValues.length > 1) {
                    var rIndices = findHeaderIndices(rTableValues[0]);
                    return {
                      category: extractColumnFromTable(rTableValues, rIndices.catIdx, true),
                      from: extractColumnFromTable(rTableValues, rIndices.fromIdx, false),
                      to: extractColumnFromTable(rTableValues, rIndices.toIdx, false)
                    };
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch (eRest) {
    Logger.log("Layer 1B (REST) error: " + eRest);
  }

  // -------------------------------------------------------------
  // Layer 2: Smart Grid Header Clustering
  // Scans Category sheet to find Category, From, and To grouped together.
  // Explicitly excludes any Category column grouped with Spending / Budget metrics.
  // -------------------------------------------------------------
  var lastRow = categorySheet.getLastRow();
  var lastCol = categorySheet.getLastColumn();
  if (lastCol >= 1 && lastRow >= 2) {
    for (var rCheck = 1; rCheck <= Math.min(5, lastRow); rCheck++) {
      var rowHeaders = categorySheet.getRange(rCheck, 1, 1, lastCol).getValues()[0];
      var catCandidates = [];
      var fromCol = -1;
      var toCol = -1;

      for (var col = 0; col < rowHeaders.length; col++) {
        var txt = String(rowHeaders[col] || "").trim().toLowerCase();
        if (!txt) continue;
        if (txt === "category" || txt === "categories") {
          // Check if neighboring headers suggest "Spending by Category" table
          var isSpendingTable = false;
          for (var neighbor = Math.max(0, col - 2); neighbor <= Math.min(rowHeaders.length - 1, col + 3); neighbor++) {
            var nTxt = String(rowHeaders[neighbor] || "").trim().toLowerCase();
            if (nTxt.indexOf("spent") !== -1 || nTxt.indexOf("budget") !== -1 || nTxt.indexOf("remaining") !== -1 || nTxt.indexOf("actual") !== -1) {
              isSpendingTable = true;
              break;
            }
          }
          if (!isSpendingTable) {
            catCandidates.push(col + 1);
          }
        } else if (txt === "from" || txt.indexOf("source") !== -1) {
          fromCol = col + 1;
        } else if (txt === "to" || txt.indexOf("dest") !== -1) {
          toCol = col + 1;
        }
      }

      if (catCandidates.length > 0) {
        var chosenCat = catCandidates[0];
        // If multiple candidates, pick the one closest to From / To
        if (catCandidates.length > 1 && (fromCol !== -1 || toCol !== -1)) {
          var refCol = fromCol !== -1 ? fromCol : toCol;
          var bestDist = 999;
          for (var i = 0; i < catCandidates.length; i++) {
            var dist = Math.abs(catCandidates[i] - refCol);
            if (dist < bestDist) {
              bestDist = dist;
              chosenCat = catCandidates[i];
            }
          }
        }

        var numDataRows = lastRow - rCheck;
        if (numDataRows > 0) {
          var readGridCol = function(cIdx, isCat) {
            if (cIdx === -1) return [];
            var vals = categorySheet.getRange(rCheck + 1, cIdx, numDataRows, 1).getValues();
            var res = [];
            var sMap = {};
            for (var vr = 0; vr < vals.length; vr++) {
              var vStr = String(vals[vr][0] || "").trim();
              if (vStr.length > 0) {
                if (isCat && (vStr.toLowerCase() === "total spent" || vStr.toLowerCase().indexOf("total spent") === 0)) continue;
                if (!sMap[vStr]) {
                  sMap[vStr] = true;
                  res.push(vStr);
                }
              }
            }
            return res;
          };

          return {
            category: readGridCol(chosenCat, true),
            from: readGridCol(fromCol, false),
            to: readGridCol(toCol, false)
          };
        }
      }
    }
  }

  return { category: [], from: [], to: [] };
}

/**
 * Finds the next available row using Column A (Date) as the sole source of truth.
 * A row contains a transaction if and only if Column A has a date.
 */
function findNextAvailableRow(sheet) {
  var lastRow = sheet.getLastRow();
  var startRow = CONFIG.START_ROW;
  if (lastRow < startRow) return startRow;

  var colAValues = sheet.getRange(startRow, CONFIG.COL.DATE, lastRow - startRow + 1, 1).getValues();
  for (var r = colAValues.length - 1; r >= 0; r--) {
    var cell = colAValues[r][0];
    if (cell !== null && cell !== undefined && String(cell).trim() !== "") {
      return startRow + r + 1;
    }
  }
  return startRow;
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
 * Clears all cell borders in Columns A-F (columns 1-6) starting from Row 2 downwards.
 */
function clearTransactionBorders(sheet) {
  try {
    var startRow = CONFIG.START_ROW;
    var maxCol = CONFIG.MAX_COL;
    var maxRows = Math.max(sheet.getLastRow() || 0, sheet.getMaxRows() || 0, startRow);
    var numRows = maxRows - startRow + 1;
    if (numRows > 0) {
      sheet.getRange(startRow, 1, numRows, maxCol).setBorder(false, false, false, false, false, false);
    }
  } catch (e) {}
}

/**
 * Atomically compacts and writes rows to the budget sheet, padding trailing rows with blanks and clearing them.
 */
function compactAndWriteRows(sheet, allRows, colMValues, originalCount) {
  var startRow = CONFIG.START_ROW;
  var maxCol = CONFIG.MAX_COL;

  var writeMatrix = [];
  var writeMatrixM = [];
  for (var w = 0; w < allRows.length; w++) {
    writeMatrix.push(allRows[w]);
    writeMatrixM.push(colMValues[w]);
  }
  while (writeMatrix.length < originalCount) {
    writeMatrix.push(["", "", "", "", "", ""]);
    writeMatrixM.push([""]);
  }

  sheet.getRange(startRow, 1, writeMatrix.length, maxCol).setValues(writeMatrix);
  sheet.getRange(startRow, CONFIG.COL.SKIP, writeMatrixM.length, 1).setValues(writeMatrixM);

  if (allRows.length > 0) {
    sheet.getRange(startRow, CONFIG.COL.DATE, allRows.length, 1).setNumberFormat("dd mmm yyyy");
    sheet.getRange(startRow, CONFIG.COL.AMOUNT, allRows.length, 1).setNumberFormat("$#,##0.00");
  }

  var trailingRow = startRow + allRows.length;
  var rowsToClear = originalCount - allRows.length;
  if (rowsToClear > 0) {
    try {
      var clearRange = sheet.getRange(trailingRow, 1, rowsToClear, maxCol);
      clearRange.clearContent();
      clearRange.clear({ contentsOnly: true });

      var clearRangeM = sheet.getRange(trailingRow, CONFIG.COL.SKIP, rowsToClear, 1);
      clearRangeM.clearContent();
      clearRangeM.clear({ contentsOnly: true });
      try { clearRangeM.uncheck(); } catch (eU) {}
    } catch (e) {}
  }

  clearTransactionBorders(sheet);
  SpreadsheetApp.flush();
}

/**
 * Normalizes boolean skip flags from requests or cells.
 */
function parseBooleanSkip(val) {
  return val === true || String(val).trim().toLowerCase() === "true" || val === 1;
}

/**
 * Parses numeric amount from string or number, defaulting to 0.00.
 */
function parseAmount(val) {
  var clean = String(val !== null && val !== undefined ? val : "").replace(/[^0-9.-]/g, "");
  var amt = parseFloat(clean);
  return isNaN(amt) ? 0.00 : amt;
}

/**
 * Standard JSON response helper for Web App endpoints.
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Safely sets Column M (Skip) state for both checkbox-validated cells and plain cells.
 * Uses range.check() / range.uncheck() for checkbox validations, with setValue/clearContent fallbacks.
 */
function setCellSkipState(cell, shouldSkip) {
  if (!cell) return;
  var isBoolSkip = parseBooleanSkip(shouldSkip);
  
  if (isBoolSkip) {
    try {
      cell.check();
    } catch (e1) {}
    try {
      if (cell.isChecked() !== true) {
        cell.setValue(true);
      }
    } catch (e2) {
      try {
        cell.setValue("TRUE");
      } catch (e3) {}
    }
  } else {
    try {
      cell.uncheck();
    } catch (e4) {}
    try {
      if (cell.isChecked() !== false) {
        try {
          cell.setValue(false);
        } catch (e5) {
          try {
            cell.clearContent();
          } catch (e6) {
            cell.setValue("");
          }
        }
      }
    } catch (e7) {
      try {
        cell.clearContent();
      } catch (e8) {}
    }
  }
}

/**
 * Retrieves the most recent N transactions from the budget sheet.
 */
function getRecentTransactionsFromSheet(sheet, limit) {
  limit = limit || CONFIG.RECENT_LIMIT || 6;
  var lastRow = sheet.getLastRow();
  var startRow = CONFIG.START_ROW;
  if (lastRow < startRow) return [];

  var maxCol = CONFIG.MAX_COL;
  var tz = (sheet.getParent && sheet.getParent()) ? sheet.getParent().getSpreadsheetTimeZone() : (Session.getScriptTimeZone() || "GMT");

  var nextRow = findNextAvailableRow(sheet);
  var lastPopRow = nextRow - 1;
  if (lastPopRow < startRow) return [];

  var numRows = lastPopRow - startRow + 1;
  var values = sheet.getRange(startRow, 1, numRows, maxCol).getValues();
  var colMValues = sheet.getRange(startRow, CONFIG.COL.SKIP, numRows, 1).getValues();
  
  var list = [];
  var dateCol = CONFIG.COL.DATE - 1;
  var descCol = CONFIG.COL.DESCRIPTION - 1;
  var catCol = CONFIG.COL.CATEGORY - 1;
  var fromCol = CONFIG.COL.FROM - 1;
  var toCol = CONFIG.COL.TO - 1;
  var amtCol = CONFIG.COL.AMOUNT - 1;

  for (var i = values.length - 1; i >= 0; i--) {
    var rowValues = values[i];
    var rawDate = rowValues[dateCol];
    if (rawDate === null || rawDate === undefined || String(rawDate).trim() === "") continue;
    
    var desc = String(rowValues[descCol] || "").trim();
    var cat = String(rowValues[catCol] || "").trim();
    var fromVal = String(rowValues[fromCol] || "").trim();
    var toVal = String(rowValues[toCol] || "").trim();
    var rawM = colMValues[i] ? colMValues[i][0] : false;
    var isSkip = parseBooleanSkip(rawM);
    var amt = parseAmount(rowValues[amtCol]);
    
    var dateStr = "";
    if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
      dateStr = Utilities.formatDate(rawDate, tz, "yyyy-MM-dd");
    } else if (rawDate) {
      dateStr = formatComparableDate(rawDate, tz);
    }
    
    var rowNumber = startRow + i;
    list.push({
      id: "sheet_" + rowNumber + "_" + (desc || "tx").replace(/[^a-zA-Z0-9]/g, ""),
      sheetName: sheet.getName(),
      row: rowNumber,
      date: dateStr,
      description: desc || "Untitled",
      category: cat,
      from: fromVal,
      to: toVal,
      amount: amt,
      skip: isSkip
    });
    
    if (list.length >= limit) break;
  }
  return list;
}

/**
 * Retrieves all transactions from all Budget YYYY sheets in descending chronological order.
 * Reads only columns A-F for maximum efficiency.
 */
function getAllTransactionsFromAllBudgetSheets(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var tz = ss.getSpreadsheetTimeZone() || (Session.getScriptTimeZone() || "GMT");
  var startRow = CONFIG.START_ROW;
  var allList = [];

  var dateCol = CONFIG.COL.DATE - 1;
  var descCol = CONFIG.COL.DESCRIPTION - 1;
  var catCol = CONFIG.COL.CATEGORY - 1;
  var fromCol = CONFIG.COL.FROM - 1;
  var toCol = CONFIG.COL.TO - 1;
  var amtCol = CONFIG.COL.AMOUNT - 1;

  for (var s = 0; s < sheets.length; s++) {
    var sh = sheets[s];
    var shName = sh.getName();
    // Only process sheets named "Budget YYYY" or the exact fallback/primary sheet
    if (!/^Budget \d{4}$/.test(shName) && shName !== CONFIG.SHEET_NAME_PREFIX.trim() && shName !== CONFIG.FALLBACK_SHEET_NAME) continue;

    var lastRow = sh.getLastRow();
    if (lastRow < startRow) continue;

    var nextRow = findNextAvailableRow(sh);
    var lastPopRow = nextRow - 1;
    if (lastPopRow < startRow) continue;

    var numRows = lastPopRow - startRow + 1;
    var values = sh.getRange(startRow, 1, numRows, CONFIG.MAX_COL).getValues();
    var colMValues = sh.getRange(startRow, CONFIG.COL.SKIP, numRows, 1).getValues();

    for (var i = 0; i < values.length; i++) {
      var rowValues = values[i];
      var rawDate = rowValues[dateCol];
      if (rawDate === null || rawDate === undefined || String(rawDate).trim() === "") continue;

      var desc = String(rowValues[descCol] || "").trim();
      var cat = String(rowValues[catCol] || "").trim();
      var fromVal = String(rowValues[fromCol] || "").trim();
      var toVal = String(rowValues[toCol] || "").trim();
      var rawM = colMValues[i] ? colMValues[i][0] : false;
      var isSkip = parseBooleanSkip(rawM);
      var amt = parseAmount(rowValues[amtCol]);

      var dateStr = "";
      var dateObj = null;
      if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
        dateStr = Utilities.formatDate(rawDate, tz, "yyyy-MM-dd");
        dateObj = rawDate;
      } else if (rawDate) {
        dateStr = formatComparableDate(rawDate, tz);
        try {
          dateObj = parseDateInput(rawDate);
        } catch (e) {
          dateObj = new Date(dateStr);
        }
      }

      var rowNumber = startRow + i;
      allList.push({
        id: shName.replace(/[^a-zA-Z0-9]/g, "") + "_" + rowNumber + "_" + (desc || "tx").replace(/[^a-zA-Z0-9]/g, ""),
        sheetName: shName,
        row: rowNumber,
        date: dateStr,
        description: desc || "Untitled",
        category: cat,
        from: fromVal,
        to: toVal,
        amount: amt,
        skip: isSkip,
        timestamp: (dateObj && !isNaN(dateObj.getTime())) ? dateObj.getTime() : 0
      });
    }
  }

  // Sort descending by date (newest first). If same date, sort by row descending
  allList.sort(function(a, b) {
    if (b.timestamp !== a.timestamp) {
      return b.timestamp - a.timestamp;
    }
    if (a.sheetName !== b.sheetName) {
      return b.sheetName.localeCompare(a.sheetName);
    }
    return b.row - a.row;
  });

  return allList;
}

/**
 * Master options loader.
 */
function getFormOptions() {
  var targetSheet = getTargetSheet();
  var catSheet = getCategorySheet();
  var options = getOptionsFromCategoryTab(catSheet);
  var recentTransactions = getRecentTransactionsFromSheet(targetSheet);
  
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
  var hasSkip = data && data.skip !== undefined ? Boolean(data.skip) : false;
  var targetRow = nextRow;

  if (lastPopRow < startRow) {
    sheet.getRange(startRow, 1, 1, maxCol).setValues([newRow]);
    sheet.getRange(startRow, CONFIG.COL.DATE).setNumberFormat("dd mmm yyyy");
    sheet.getRange(startRow, CONFIG.COL.AMOUNT).setNumberFormat("$#,##0.00");
    setCellSkipState(sheet.getRange(startRow, CONFIG.COL.SKIP), hasSkip);
    targetRow = startRow;
  } else {
    var count = lastPopRow - startRow + 1;
    var allRows = sheet.getRange(startRow, 1, count, maxCol).getValues();
    var colMValues = sheet.getRange(startRow, CONFIG.COL.SKIP, count, 1).getValues();
    
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
      setCellSkipState(sheet.getRange(nextRow, CONFIG.COL.SKIP), hasSkip);
      targetRow = nextRow;
    } else {
      allRows.splice(insertIndex, 0, newRow);
      colMValues.splice(insertIndex, 0, [hasSkip]);
      if ((startRow + allRows.length - 1) > sheet.getMaxRows()) {
        sheet.insertRowsAfter(sheet.getMaxRows(), 50);
      }
      sheet.getRange(startRow, 1, allRows.length, maxCol).setValues(allRows);
      sheet.getRange(startRow, CONFIG.COL.SKIP, colMValues.length, 1).setValues(colMValues);
      sheet.getRange(startRow, CONFIG.COL.DATE, allRows.length, 1).setNumberFormat("dd mmm yyyy");
      sheet.getRange(startRow, CONFIG.COL.AMOUNT, allRows.length, 1).setNumberFormat("$#,##0.00");
      setCellSkipState(sheet.getRange(startRow + insertIndex, CONFIG.COL.SKIP), hasSkip);
      targetRow = startRow + insertIndex;
    }
  }

  clearTransactionBorders(sheet);
  SpreadsheetApp.flush();

  return {
    success: true,
    message: "Transaction added successfully",
    sheetName: sheet.getName(),
    row: targetRow,
    recentTransactions: getRecentTransactionsFromSheet(sheet),
    entry: {
      date: Utilities.formatDate(dateVal, tz, "dd MMM yyyy"),
      description: descVal,
      category: catVal,
      from: fromVal,
      to: toVal,
      amount: amountVal,
      skip: hasSkip
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
  var explicitSheetName = (data && data.sheetName) || (orig && orig.sheetName) || null;
  var sheet = (explicitSheetName && SpreadsheetApp.getActiveSpreadsheet().getSheetByName(explicitSheetName)) ||
              getTargetSheet(origDateStr);
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
  var colMValues = sheet.getRange(startRow, CONFIG.COL.SKIP, count, 1).getValues();

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
    var idxRawDate = allRows[idx][dateCol];
    if (idxRawDate !== null && idxRawDate !== undefined && String(idxRawDate).trim() !== "") {
      var rowDesc = String(allRows[idx][descCol] || "").trim().toLowerCase();
      var rowAmt = parseFloat(String(allRows[idx][amtCol] || "").replace(/[^0-9.-]/g, ""));
      var rowDateComp = formatComparableDate(idxRawDate, tz);
      
      var descMatch = (!origDesc || rowDesc === origDesc || (origDesc === "untitled" && !rowDesc));
      var amtMatch = (isNaN(origAmt) || Math.abs(rowAmt - origAmt) < 0.01);
      var dateMatch = (!origDateComp || rowDateComp === origDateComp);
      if (descMatch && amtMatch && dateMatch) {
        targetRow = hintRow;
      }
    }
  }

  if (targetRow === -1) {
    for (var i = allRows.length - 1; i >= 0; i--) {
      var rRawDate = allRows[i][dateCol];
      if (rRawDate === null || rRawDate === undefined || String(rRawDate).trim() === "") continue;
      var rDesc = String(allRows[i][descCol] || "").trim().toLowerCase();
      var rAmt = parseFloat(String(allRows[i][amtCol] || "").replace(/[^0-9.-]/g, ""));
      var rDateComp = formatComparableDate(rRawDate, tz);
      
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
    if (updated && updated.skip !== undefined) {
      setCellSkipState(sheet.getRange(targetRow, CONFIG.COL.SKIP), updated.skip);
    }
    clearTransactionBorders(sheet);
    SpreadsheetApp.flush();
    return {
      success: true,
      message: "Transaction updated in-place.",
      sheetName: sheet.getName(),
      row: targetRow,
      moved: false,
      recentTransactions: getRecentTransactionsFromSheet(sheet)
    };
  }

  // Case 2: Date changed to a different year sheet
  var newSheet = getTargetSheet(updated.date);
  if (newSheet.getName() !== sheet.getName()) {
    var rawOldM2 = colMValues[targetIndex] ? colMValues[targetIndex][0] : false;
    var targetSkip2 = (updated && updated.skip !== undefined) ? Boolean(updated.skip) : (rawOldM2 === true || String(rawOldM2).toLowerCase() === "true" || rawOldM2 === 1);

    allRows.splice(targetIndex, 1);
    colMValues.splice(targetIndex, 1);
    compactAndWriteRows(sheet, allRows, colMValues, count);

    var addRes = appendTransaction({
      date: updated.date,
      description: newDescVal,
      category: newCatVal,
      from: newFromVal,
      to: newToVal,
      amount: newAmountVal,
      skip: targetSkip2
    });

    return {
      success: true,
      message: "Transaction moved from " + sheet.getName() + " to " + newSheet.getName(),
      sheetName: newSheet.getName(),
      row: addRes.row,
      moved: true,
      recentTransactions: getRecentTransactionsFromSheet(newSheet)
    };
  }

  // Case 3: Date changed within the same sheet
  var rawOldM3 = colMValues[targetIndex] ? colMValues[targetIndex][0] : false;
  var targetSkip3 = (updated && updated.skip !== undefined) ? Boolean(updated.skip) : parseBooleanSkip(rawOldM3);

  allRows.splice(targetIndex, 1);
  colMValues.splice(targetIndex, 1);

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
  colMValues.splice(insertIndex, 0, [targetSkip3]);

  sheet.getRange(startRow, 1, allRows.length, maxCol).setValues(allRows);
  sheet.getRange(startRow, CONFIG.COL.SKIP, colMValues.length, 1).setValues(colMValues);
  sheet.getRange(startRow, CONFIG.COL.DATE, allRows.length, 1).setNumberFormat("dd mmm yyyy");
  sheet.getRange(startRow, CONFIG.COL.AMOUNT, allRows.length, 1).setNumberFormat("$#,##0.00");
  setCellSkipState(sheet.getRange(startRow + insertIndex, CONFIG.COL.SKIP), targetSkip3);
  clearTransactionBorders(sheet);
  SpreadsheetApp.flush();

  var destRow = startRow + insertIndex;
  return {
    success: true,
    message: "Transaction date changed and moved to row " + destRow,
    sheetName: sheet.getName(),
    row: destRow,
    moved: true,
    recentTransactions: getRecentTransactionsFromSheet(sheet)
  };
}

/**
 * Deletes the most recent matching transaction from the budget sheet.
 */
function deleteLastMatchingTransaction(data) {
  var explicitSheetName = data ? (data.sheetName || (data.original && data.original.sheetName)) : null;
  var sheet = (explicitSheetName && SpreadsheetApp.getActiveSpreadsheet().getSheetByName(explicitSheetName)) ||
              getTargetSheet(data ? data.date : null);
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
  var colMValues = sheet.getRange(startRow, CONFIG.COL.SKIP, count, 1).getValues();
  
  var deleteIndex = -1;
  var dateCol = CONFIG.COL.DATE - 1;
  var descCol = CONFIG.COL.DESCRIPTION - 1;
  var amtCol = CONFIG.COL.AMOUNT - 1;

  // 1. If hintRow is provided and valid, verify and use it
  if (hintRow && hintRow >= startRow && hintRow <= lastPopRow) {
    var hIdx = hintRow - startRow;
    var hRawDate = allRows[hIdx][dateCol];
    if (hRawDate !== null && hRawDate !== undefined && String(hRawDate).trim() !== "") {
      var hDesc = String(allRows[hIdx][descCol] || "").trim().toLowerCase();
      var hAmt = parseFloat(String(allRows[hIdx][amtCol] || "").replace(/[^0-9.-]/g, ""));
      var hDateComp = formatComparableDate(hRawDate, tz);
      var descMatch = (!targetDesc || hDesc === targetDesc || (targetDesc === "untitled" && !hDesc));
      var amtMatch = (isNaN(targetAmt) || Math.abs(hAmt - targetAmt) < 0.01);
      var dateMatch = (!targetDateComp || hDateComp === targetDateComp);
      if (descMatch && amtMatch && dateMatch) {
        deleteIndex = hIdx;
      }
    }
  }

  // 1b. If hintRow is valid and description/amount match (ignoring minor date timezone mismatch)
  if (deleteIndex === -1 && hintRow && hintRow >= startRow && hintRow <= lastPopRow) {
    var hIdxB = hintRow - startRow;
    var hRawDateB = allRows[hIdxB][dateCol];
    if (hRawDateB !== null && hRawDateB !== undefined && String(hRawDateB).trim() !== "") {
      var hDescB = String(allRows[hIdxB][descCol] || "").trim().toLowerCase();
      var hAmtB = parseFloat(String(allRows[hIdxB][amtCol] || "").replace(/[^0-9.-]/g, ""));
      var dMatchB = (!targetDesc || hDescB === targetDesc || (targetDesc === "untitled" && !hDescB));
      var aMatchB = (isNaN(targetAmt) || Math.abs(hAmtB - targetAmt) < 0.01);
      if (dMatchB && aMatchB) {
        deleteIndex = hIdxB;
      }
    }
  }
  
  // 2. Scan bottom-up for matching transaction (Column A date is source of truth)
  if (deleteIndex === -1) {
    for (var i = allRows.length - 1; i >= 0; i--) {
      var rawDateI = allRows[i][dateCol];
      if (rawDateI === null || rawDateI === undefined || String(rawDateI).trim() === "") continue;
      var descVal = String(allRows[i][descCol] || "").trim().toLowerCase();
      var amtVal = parseFloat(String(allRows[i][amtCol] || "").replace(/[^0-9.-]/g, ""));
      var dateComp = formatComparableDate(rawDateI, tz);
      
      var matchDesc = (!targetDesc || descVal === targetDesc || (targetDesc === "untitled" && !descVal));
      var matchAmt = (isNaN(targetAmt) || Math.abs(amtVal - targetAmt) < 0.01);
      var matchDate = (!targetDateComp || dateComp === targetDateComp);
      
      if (matchDesc && matchAmt && matchDate) {
        deleteIndex = i;
        break;
      }
    }
  }

  // 3. Fallback: match by description and amount (ignoring date)
  if (deleteIndex === -1 && (!isNaN(targetAmt) || targetDesc)) {
    for (var j = allRows.length - 1; j >= 0; j--) {
      var rawDateJ = allRows[j][dateCol];
      if (rawDateJ === null || rawDateJ === undefined || String(rawDateJ).trim() === "") continue;
      var dVal = String(allRows[j][descCol] || "").trim().toLowerCase();
      var aVal = parseFloat(String(allRows[j][amtCol] || "").replace(/[^0-9.-]/g, ""));
      var mDesc = (!targetDesc || dVal === targetDesc || (targetDesc === "untitled" && !dVal));
      var mAmt = (isNaN(targetAmt) || Math.abs(aVal - targetAmt) < 0.01);
      if (mDesc && mAmt) {
        deleteIndex = j;
        break;
      }
    }
  }

  // 4. Fallback: if no criteria matched, delete bottom-most row with populated Date in Column A
  if (deleteIndex === -1) {
    for (var k = allRows.length - 1; k >= 0; k--) {
      var rawDateK = allRows[k][dateCol];
      if (rawDateK !== null && rawDateK !== undefined && String(rawDateK).trim() !== "") {
        deleteIndex = k;
        break;
      }
    }
  }
  
  if (deleteIndex === -1) {
    return { success: false, error: "Matching transaction not found in sheet." };
  }
  
  var clearedRow = startRow + deleteIndex;
  allRows.splice(deleteIndex, 1);
  colMValues.splice(deleteIndex, 1);
  compactAndWriteRows(sheet, allRows, colMValues, count);

  return { 
    success: true, 
    message: "Transaction deleted and rows compacted.", 
    clearedRow: clearedRow,
    recentTransactions: getRecentTransactionsFromSheet(sheet, CONFIG.RECENT_LIMIT)
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
    var matrixM = [];
    var hasAnySkip = false;
    for (var r = 0; r < rows.length; r++) {
      var it = rows[r];
      matrix.push([it.dateVal, it.descVal, it.catVal, it.fromVal, it.toVal, it.amountVal]);
      var s = Boolean(it.skip);
      if (s) hasAnySkip = true;
      matrixM.push([s ? true : ""]);
    }
    
    sheet.getRange(targetRow, 1, matrix.length, maxCol).setValues(matrix);
    sheet.getRange(targetRow, CONFIG.COL.DATE, matrix.length, 1).setNumberFormat("dd mmm yyyy");
    sheet.getRange(targetRow, CONFIG.COL.AMOUNT, matrix.length, 1).setNumberFormat("$#,##0.00");
    if (hasAnySkip) {
      sheet.getRange(targetRow, CONFIG.COL.SKIP, matrixM.length, 1).setValues(matrixM);
    }
    for (var mr = 0; mr < rows.length; mr++) {
      setCellSkipState(sheet.getRange(targetRow + mr, CONFIG.COL.SKIP), rows[mr].skip);
    }
    clearTransactionBorders(sheet);
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

      var hasSkip = it.skip !== undefined ? Boolean(it.skip) : false;
      addsBySheet[sheetName].rows.push({
        dateVal: dateVal,
        descVal: descVal,
        catVal: catVal,
        fromVal: fromVal,
        toVal: toVal,
        amountVal: amountVal,
        skip: hasSkip
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
    recentTransactions: getRecentTransactionsFromSheet(primarySheet)
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
      var recent = getRecentTransactionsFromSheet(targetSheet, CONFIG.RECENT_LIMIT);
      return createJsonResponse({
        success: true,
        sheetName: targetSheet.getName(),
        recentTransactions: recent
      });
    }

    if (action === "all" || action === "alltransactions") {
      var all = getAllTransactionsFromAllBudgetSheets();
      return createJsonResponse({
        success: true,
        transactions: all,
        totalCount: all.length
      });
    }

    return createJsonResponse(getFormOptions());
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: err.toString()
    });
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
      return createJsonResponse(batchProcessTransactions(data));
    }

    if (action === "undo" || action === "delete") {
      return createJsonResponse(deleteLastMatchingTransaction(data));
    }

    if (action === "edit" || action === "update") {
      return createJsonResponse(editTransaction(data));
    }
    
    return createJsonResponse(appendTransaction(data));
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: err.toString()
    });
  }
}

/**
 * Test function to verify dynamic table options extraction.
 * Select 'testCategoryOptions' in the Apps Script toolbar and click 'Run'.
 */
function testCategoryOptions() {
  var catSheet = getCategorySheet();
  var options = getOptionsFromCategoryTab(catSheet);
  Logger.log("=== Options Loaded from CategoryToFrom ===");
  Logger.log("Categories (" + options.category.length + "): " + JSON.stringify(options.category));
  Logger.log("From Accounts (" + options.from.length + "): " + JSON.stringify(options.from));
  Logger.log("To Accounts (" + options.to.length + "): " + JSON.stringify(options.to));
}

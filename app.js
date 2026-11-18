/**
 * Budget Mobile App - Core Logic
 */

(function () {
  "use strict";

  // Application Version
  const APP_VERSION = "v92";

  // State
  const state = {
    scriptUrl: localStorage.getItem("budget_script_url") || "",
    sheetName: localStorage.getItem("budget_sheet_name") || "Budget",
    hapticsEnabled: localStorage.getItem("budget_haptics_enabled") !== "false",
    accentTheme: localStorage.getItem("budget_accent_theme") || "emerald",
    defaults: {
      category: localStorage.getItem("budget_default_category") || "",
      from: localStorage.getItem("budget_default_from") || "",
      to: localStorage.getItem("budget_default_to") || ""
    },
    selectedDate: getFormattedDate(new Date()),
    selectedCategory: localStorage.getItem("budget_default_category") || "",
    selectedFrom: localStorage.getItem("budget_default_from") || "",
    selectedTo: localStorage.getItem("budget_default_to") || "",
    options: {
      category: JSON.parse(localStorage.getItem("budget_options_cat") || "[]"),
      from: JSON.parse(localStorage.getItem("budget_options_from") || "[]"),
      to: JSON.parse(localStorage.getItem("budget_options_to") || "[]")
    }
  };

  // DOM Elements
  const elements = {
    brandLogo: document.getElementById("brandLogo"),
    amountCard: document.querySelector(".amount-card"),
    statusDot: document.getElementById("statusDot"),
    statusText: document.getElementById("statusText"),
    amountInput: document.getElementById("amountInput"),
    dateDisplay: document.getElementById("dateDisplay"),
    btnDateToday: document.getElementById("btnDateToday"),
    btnDateYesterday: document.getElementById("btnDateYesterday"),
    btnDateCustom: document.getElementById("btnDateCustom"),
    customDateLabel: document.getElementById("customDateLabel"),
    datePicker: document.getElementById("datePicker"),
    descInput: document.getElementById("descInput"),
    btnSelectCategory: document.getElementById("btnSelectCategory"),
    catBtnText: document.getElementById("catBtnText"),
    btnSelectFrom: document.getElementById("btnSelectFrom"),
    fromBtnText: document.getElementById("fromBtnText"),
    btnSelectTo: document.getElementById("btnSelectTo"),
    toBtnText: document.getElementById("toBtnText"),
    btnDefaultCategory: document.getElementById("btnDefaultCategory"),
    defaultCatBtnText: document.getElementById("defaultCatBtnText"),
    btnDefaultFrom: document.getElementById("btnDefaultFrom"),
    defaultFromBtnText: document.getElementById("defaultFromBtnText"),
    btnDefaultTo: document.getElementById("btnDefaultTo"),
    defaultToBtnText: document.getElementById("defaultToBtnText"),
    pickerOverlay: document.getElementById("pickerOverlay"),
    pickerBackdrop: document.getElementById("pickerBackdrop"),
    pickerList: document.getElementById("pickerList"),
    btnSubmit: document.getElementById("btnSubmit"),
    btnSubmitText: document.getElementById("btnSubmitText"),
    toast: document.getElementById("toast"),
    toastIcon: document.getElementById("toastIcon"),
    toastMessage: document.getElementById("toastMessage"),
    btnOpenSettings: document.getElementById("btnOpenSettings"),
    btnCloseSettings: document.getElementById("btnCloseSettings"),
    settingsModal: document.getElementById("settingsModal"),
    scriptUrlInput: document.getElementById("scriptUrlInput"),
    hapticsToggle: document.getElementById("hapticsToggle"),
    settingsVersion: document.getElementById("settingsVersion"),
    themePalette: document.getElementById("themePalette"),
    themeNameBadge: document.getElementById("themeNameBadge"),
    btnSaveSettings: document.getElementById("btnSaveSettings"),
    btnSyncNow: document.getElementById("btnSyncNow"),
    queueBadge: document.getElementById("queueBadge"),
    queueCount: document.getElementById("queueCount"),
    queueStatusText: document.getElementById("queueStatusText"),
    btnSyncQueueNow: document.getElementById("btnSyncQueueNow"),
    btnOpenRecent: document.getElementById("btnOpenRecent"),
    recentModal: document.getElementById("recentModal"),
    btnRefreshRecent: document.getElementById("btnRefreshRecent"),
    btnUndoRecent: document.getElementById("btnUndoRecent"),
    recentList: document.getElementById("recentList"),
    descSplitContainer: document.getElementById("descSplitContainer"),
    quickWheelWrapper: document.getElementById("quickWheelWrapper"),
    wheelCylinder: document.getElementById("wheelCylinder"),
    btnWheelReset: document.getElementById("btnWheelReset"),
    btnOpenQuickFillSettings: document.getElementById("btnOpenQuickFillSettings"),
    quickFillSettingsModal: document.getElementById("quickFillSettingsModal"),
    btnCloseQuickFillSettings: document.getElementById("btnCloseQuickFillSettings"),
    btnAddQuickFillOption: document.getElementById("btnAddQuickFillOption"),
    btnExportPresets: document.getElementById("btnExportPresets"),
    btnImportPresets: document.getElementById("btnImportPresets"),
    importPresetsModal: document.getElementById("importPresetsModal"),
    importModalTitle: document.getElementById("importModalTitle"),
    btnCloseImportPresets: document.getElementById("btnCloseImportPresets"),
    importPasteView: document.getElementById("importPasteView"),
    btnPasteClipboard: document.getElementById("btnPasteClipboard"),
    importFallbackContainer: document.getElementById("importFallbackContainer"),
    importFallbackTextarea: document.getElementById("importFallbackTextarea"),
    btnSubmitFallbackImport: document.getElementById("btnSubmitFallbackImport"),
    importConflictView: document.getElementById("importConflictView"),
    conflictSummaryText: document.getElementById("conflictSummaryText"),
    btnConflictKeepAll: document.getElementById("btnConflictKeepAll"),
    btnConflictReplaceAll: document.getElementById("btnConflictReplaceAll"),
    conflictList: document.getElementById("conflictList"),
    btnApplyConflictResolution: document.getElementById("btnApplyConflictResolution"),
    qfSortableList: document.getElementById("qfSortableList"),
    qfEmptyHint: document.getElementById("qfEmptyHint"),
    transactionEditorModal: document.getElementById("transactionEditorModal"),
    qfEditorTitle: document.getElementById("qfEditorTitle"),
    btnCloseQuickFillEditor: document.getElementById("btnCloseQuickFillEditor"),
    qfTitleInput: document.getElementById("qfTitleInput"),
    qfAmountInput: document.getElementById("qfAmountInput"),
    qfDateField: document.getElementById("qfDateField"),
    btnQfDate: document.getElementById("btnQfDate"),
    qfDateText: document.getElementById("qfDateText"),
    qfDatePicker: document.getElementById("qfDatePicker"),
    qfCategoryHeaderLabel: document.getElementById("qfCategoryHeaderLabel"),
    btnQfCategory: document.getElementById("btnQfCategory"),
    qfCatBtnText: document.getElementById("qfCatBtnText"),
    btnQfFrom: document.getElementById("btnQfFrom"),
    qfFromBtnText: document.getElementById("qfFromBtnText"),
    btnQfTo: document.getElementById("btnQfTo"),
    qfToBtnText: document.getElementById("qfToBtnText"),
    btnSaveQuickFillOption: document.getElementById("btnSaveQuickFillOption"),
    btnDeleteQuickFillOption: document.getElementById("btnDeleteQuickFillOption"),
    qfSkipRow: document.getElementById("qfSkipRow"),
    qfSkipToggle: document.getElementById("qfSkipToggle"),

    // All Transactions View
    btnSeeAllTransactions: document.getElementById("btnSeeAllTransactions"),
    allTransactionsModal: document.getElementById("allTransactionsModal"),
    btnBackToRecent: document.getElementById("btnBackToRecent"),
    allTxCountBadge: document.getElementById("allTxCountBadge"),
    btnRefreshAllTx: document.getElementById("btnRefreshAllTx"),
    allTxSearchInput: document.getElementById("allTxSearchInput"),
    btnClearAllTxSearch: document.getElementById("btnClearAllTxSearch"),
    btnOpenAllTxFilter: document.getElementById("btnOpenAllTxFilter"),
    allTransactionsContainer: document.getElementById("allTransactionsContainer"),
    allTxSentinel: document.getElementById("allTxSentinel"),

    // Filter Modal
    allTxFilterModal: document.getElementById("allTxFilterModal"),
    btnCloseAllTxFilter: document.getElementById("btnCloseAllTxFilter"),
    btnFilterStartDate: document.getElementById("btnFilterStartDate"),
    filterStartDateText: document.getElementById("filterStartDateText"),
    filterStartDatePicker: document.getElementById("filterStartDatePicker"),
    btnFilterEndDate: document.getElementById("btnFilterEndDate"),
    filterEndDateText: document.getElementById("filterEndDateText"),
    filterEndDatePicker: document.getElementById("filterEndDatePicker"),
    filterMinAmount: document.getElementById("filterMinAmount"),
    filterMaxAmount: document.getElementById("filterMaxAmount"),
    btnFilterCategory: document.getElementById("btnFilterCategory"),
    filterCatText: document.getElementById("filterCatText"),
    btnFilterFrom: document.getElementById("btnFilterFrom"),
    filterFromText: document.getElementById("filterFromText"),
    btnFilterTo: document.getElementById("btnFilterTo"),
    filterToText: document.getElementById("filterToText"),
    filterHideSetup: document.getElementById("filterHideSetup"),
    btnApplyAllTxFilters: document.getElementById("btnApplyAllTxFilters"),
    btnResetAllTxFilters: document.getElementById("btnResetAllTxFilters")
  };

  // Default fallback options if sheet hasn't synced yet
  const DEFAULT_OPTIONS = {
    category: ["Groceries", "Dining Out", "Utilities", "Rent/Mortgage", "Transportation", "Entertainment", "Shopping", "Health", "Subscriptions", "Misc"],
    from: ["Checking", "Credit Card", "Cash", "Savings"],
    to: ["Supermarket", "Restaurant", "Amazon", "Gas Station", "Landlord", "Utility Co", "Transfer"]
  };

  // Helper: Format Date to YYYY-MM-DD
  function getFormattedDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // Helper: Display Date String (e.g., "13 Nov 2026")
  function formatHumanDate(dateStr) {
    if (!dateStr) return "Today";
    if (typeof dateStr === "string" && dateStr.includes("-")) {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        if (!isNaN(date.getTime())) {
          const day = date.getDate();
          const month = date.toLocaleString("en-US", { month: "short" });
          const year = date.getFullYear();
          return `${day} ${month} ${year}`;
        }
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = d.getDate();
      const month = d.toLocaleString("en-US", { month: "short" });
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    }
    return String(dateStr);
  }

  // Haptic feedback helper (subtle, light tactile ticks)
  let iosHapticSwitch = null;
  function triggerIOSHaptic() {
    try {
      if (!iosHapticSwitch && document.body) {
        iosHapticSwitch = document.createElement("input");
        iosHapticSwitch.type = "checkbox";
        iosHapticSwitch.setAttribute("switch", "");
        iosHapticSwitch.id = "ios-haptic-trigger";
        iosHapticSwitch.style.position = "fixed";
        iosHapticSwitch.style.top = "-9999px";
        iosHapticSwitch.style.left = "-9999px";
        iosHapticSwitch.style.opacity = "0";
        iosHapticSwitch.style.pointerEvents = "none";
        document.body.appendChild(iosHapticSwitch);
      }
      if (iosHapticSwitch) {
        iosHapticSwitch.click();
      }
    } catch (e) {
      // Ignore
    }
  }

  function haptic(pattern = 12) {
    if (!state.hapticsEnabled) return;
    // 1. Android / standard Vibration API
    if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore
      }
    }
    // 2. iOS Taptic Engine workaround (iOS 18+ switch control)
    triggerIOSHaptic();
  }

  // Toast notification
  let toastTimer = null;
  function showToast(message, type = "success") {
    clearTimeout(toastTimer);
    elements.toast.className = `toast visible ${type}`;
    elements.toastIcon.textContent = type === "success" ? "✓" : "⚠";
    elements.toastMessage.textContent = message;

    toastTimer = setTimeout(() => {
      elements.toast.className = "toast";
    }, 3500);
  }

  // Update Status Indicator
  function updateStatus(status, text) {
    elements.statusDot.className = `status-dot ${status}`;
    elements.statusText.textContent = text;
  }

  // Set Selected Date
  function setDate(dateStr, label = null) {
    state.selectedDate = dateStr;
    const today = getFormattedDate(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yestStr = getFormattedDate(yesterday);

    elements.btnDateToday.classList.remove("active");
    elements.btnDateYesterday.classList.remove("active");
    elements.btnDateCustom.classList.remove("active");

    if (dateStr === today) {
      elements.btnDateToday.classList.add("active");
      elements.dateDisplay.textContent = "Today (" + formatHumanDate(dateStr) + ")";
      elements.customDateLabel.textContent = "Custom";
    } else if (dateStr === yestStr) {
      elements.btnDateYesterday.classList.add("active");
      elements.dateDisplay.textContent = "Yesterday (" + formatHumanDate(dateStr) + ")";
      elements.customDateLabel.textContent = "Custom";
    } else {
      elements.btnDateCustom.classList.add("active");
      const human = formatHumanDate(dateStr);
      elements.dateDisplay.textContent = human;
      elements.customDateLabel.textContent = human;
    }
  }

  // Update Selector Button Display
  function updateButtonDisplay(textElem, buttonElem, value, placeholder = "Select one") {
    if (!textElem || !buttonElem) return;
    if (value && String(value).trim().length > 0) {
      textElem.textContent = value;
      textElem.className = "pill-text selected";
      buttonElem.classList.add("has-value");
      buttonElem.classList.add("active");
    } else {
      textElem.textContent = placeholder;
      textElem.className = "pill-text placeholder";
      buttonElem.classList.remove("has-value");
      buttonElem.classList.remove("active");
    }
  }

  function updateAllButtons() {
    updateButtonDisplay(elements.catBtnText, elements.btnSelectCategory, state.selectedCategory);
    updateButtonDisplay(elements.fromBtnText, elements.btnSelectFrom, state.selectedFrom);
    updateButtonDisplay(elements.toBtnText, elements.btnSelectTo, state.selectedTo);
  }

  function updateDefaultButtons() {
    updateButtonDisplay(elements.defaultCatBtnText, elements.btnDefaultCategory, state.defaults.category, "(None)");
    updateButtonDisplay(elements.defaultFromBtnText, elements.btnDefaultFrom, state.defaults.from, "(None)");
    updateButtonDisplay(elements.defaultToBtnText, elements.btnDefaultTo, state.defaults.to, "(None)");
  }

  // Helper to check if an option exists in a field's allowed list
  function isOptionAllowed(field, optionValue) {
    if (!optionValue || !String(optionValue).trim()) return false;
    const allowed = state.options[field] && state.options[field].length > 0 
      ? state.options[field] 
      : (DEFAULT_OPTIONS[field] || []);
    return allowed.some((opt) => opt.trim().toLowerCase() === optionValue.trim().toLowerCase());
  }

  // Active Picker Modal State
  let activePickerField = null;

  function openPicker(field, isDefault = false, onSelectCallback = null, customCurrentValue = null) {
    activePickerField = field;
    elements.pickerList.innerHTML = "";

    let items = [];
    let currentValue = "";

    const stateKey = `selected${field.charAt(0).toUpperCase() + field.slice(1)}`;
    const fieldOptions = state.options[field] && state.options[field].length > 0 ? state.options[field] : (DEFAULT_OPTIONS[field] || []);
    items = [...fieldOptions];
    currentValue = customCurrentValue !== null
      ? customCurrentValue
      : (isDefault ? state.defaults[field] : state[stateKey]);

    if (isDefault || onSelectCallback) {
      items.push("(None)");
      if (!currentValue) {
        currentValue = "(None)";
      }
    }

    if (!items || items.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.style.color = "var(--text-muted)";
      emptyDiv.style.fontSize = "14px";
      emptyDiv.style.padding = "10px";
      emptyDiv.textContent = "No options available";
      elements.pickerList.appendChild(emptyDiv);
    } else {
      items.forEach((item) => {
        let isConflicting = false;
        let isIncomeSpendingDisallowed = false;

        const itemLower = item.trim().toLowerCase();

        if (customCurrentValue !== null) {
          const otherVal = field === "from" ? (qfEditorState.to || "") : (qfEditorState.from || "");
          const otherLower = otherVal.trim().toLowerCase();
          if (otherLower && otherLower !== "(none)") {
            isConflicting = (itemLower === otherLower);
            isIncomeSpendingDisallowed = 
              (field === "from" && itemLower === "income" && otherLower === "spending") ||
              (field === "to" && itemLower === "spending" && otherLower === "income");
          }
        } else if (!isDefault) {
          isConflicting = (field === "from" && state.selectedTo && itemLower === state.selectedTo.trim().toLowerCase()) ||
                          (field === "to" && state.selectedFrom && itemLower === state.selectedFrom.trim().toLowerCase());
          
          isIncomeSpendingDisallowed = 
            (field === "from" && itemLower === "income" && state.selectedTo && state.selectedTo.trim().toLowerCase() === "spending") ||
            (field === "to" && itemLower === "spending" && state.selectedFrom && state.selectedFrom.trim().toLowerCase() === "income");
        } else if (item !== "(None)") {
          isConflicting = (field === "from" && state.defaults.to && itemLower === state.defaults.to.trim().toLowerCase()) ||
                          (field === "to" && state.defaults.from && itemLower === state.defaults.from.trim().toLowerCase());

          isIncomeSpendingDisallowed = 
            (field === "from" && itemLower === "income" && state.defaults.to && state.defaults.to.trim().toLowerCase() === "spending") ||
            (field === "to" && itemLower === "spending" && state.defaults.from && state.defaults.from.trim().toLowerCase() === "income");
        }

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `picker-option ${item === currentValue ? "active" : ""}`;
        if (isConflicting || isIncomeSpendingDisallowed) {
          btn.style.opacity = "0.35";
        }
        btn.textContent = item;
        btn.addEventListener("click", () => {
          if (onSelectCallback) {
            haptic(12);
            onSelectCallback(item);
            closePicker();
            return;
          }

          if (isIncomeSpendingDisallowed) {
            haptic(12);
            if (isDefault) {
              if (field === "from") {
                state.defaults.from = item;
                state.defaults.to = "";
                localStorage.setItem("budget_default_from", item);
                localStorage.removeItem("budget_default_to");
              } else if (field === "to") {
                state.defaults.to = item;
                state.defaults.from = "";
                localStorage.setItem("budget_default_to", item);
                localStorage.removeItem("budget_default_from");
              }
              updateDefaultButtons();

              if (!state[`selected${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
                state[`selected${field.charAt(0).toUpperCase() + field.slice(1)}`] = state.defaults[field];
                updateAllButtons();
              }
              closePicker();
              return;
            }

            // Homescreen selection: select item and clear the opposing field
            if (field === "from") {
              state.selectedFrom = item;
              state.selectedTo = "";
            } else if (field === "to") {
              state.selectedTo = item;
              state.selectedFrom = "";
            }
            updateAllButtons();
            closePicker();
            return;
          }

          haptic(12);
          if (isDefault) {
            if (item === "(None)") {
              state.defaults[field] = "";
              localStorage.removeItem(`budget_default_${field}`);
              showToast(`Default for ${field} cleared.`, "success");
            } else if (isConflicting) {
              // Swap default From and To (clearing if not a valid option for destination field)
              if (field === "from") {
                const prevFrom = state.defaults.from;
                state.defaults.from = item;
                state.defaults.to = isOptionAllowed("to", prevFrom) ? prevFrom : "";
                localStorage.setItem("budget_default_from", item);
                if (state.defaults.to) {
                  localStorage.setItem("budget_default_to", state.defaults.to);
                } else {
                  localStorage.removeItem("budget_default_to");
                }
              } else if (field === "to") {
                const prevTo = state.defaults.to;
                state.defaults.to = item;
                state.defaults.from = isOptionAllowed("from", prevTo) ? prevTo : "";
                localStorage.setItem("budget_default_to", item);
                if (state.defaults.from) {
                  localStorage.setItem("budget_default_from", state.defaults.from);
                } else {
                  localStorage.removeItem("budget_default_from");
                }
              }
              showToast("Swapped default From and To.", "success");
            } else {
              state.defaults[field] = item;
              localStorage.setItem(`budget_default_${field}`, item);
              showToast(`Default ${field} set to "${item}".`, "success");
            }
            updateDefaultButtons();

            // Also update home button if not currently set
            if (!state[`selected${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
              state[`selected${field.charAt(0).toUpperCase() + field.slice(1)}`] = state.defaults[field];
              updateAllButtons();
            }

            closePicker();
            return;
          }

          // Main Homescreen Selection
          if (isConflicting) {
            // Swap From and To entries (clearing if not a valid option for destination field)
            if (field === "from") {
              const prevFrom = state.selectedFrom;
              state.selectedFrom = item;
              state.selectedTo = isOptionAllowed("to", prevFrom) ? prevFrom : "";
            } else if (field === "to") {
              const prevTo = state.selectedTo;
              state.selectedTo = item;
              state.selectedFrom = isOptionAllowed("from", prevTo) ? prevTo : "";
            }
            showToast("Swapped From and To.", "success");
          } else {
            if (field === "category") {
              state.selectedCategory = item;
            } else if (field === "from") {
              state.selectedFrom = item;
            } else if (field === "to") {
              state.selectedTo = item;
            }
          }

          updateAllButtons();
          closePicker();
        });
        elements.pickerList.appendChild(btn);
      });
    }

    elements.pickerOverlay.classList.add("open");
  }

  function closePicker() {
    elements.pickerOverlay.classList.remove("open");
    activePickerField = null;
  }

  function highlightError(element) {
    if (!element) return;
    element.classList.add("field-error");
    setTimeout(() => {
      element.classList.remove("field-error");
    }, 1200);
  }

  // Fetch Dropdown Chips from Google Apps Script
  async function syncOptions(showNotification = false) {
    if (!state.scriptUrl) {
      updateStatus("", "Setup required");
      return;
    }

    updateStatus("syncing", "Syncing chips...");
    try {
      const fetchUrl = `${state.scriptUrl}${state.scriptUrl.includes("?") ? "&" : "?"}action=getOptions&t=${Date.now()}`;
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      if (data && data.success && data.options) {
        const optKeyMap = { category: "cat", from: "from", to: "to" };
        for (const [field, suffix] of Object.entries(optKeyMap)) {
          if (data.options[field] && data.options[field].length > 0) {
            state.options[field] = data.options[field];
            localStorage.setItem(`budget_options_${suffix}`, JSON.stringify(data.options[field]));
          }
        }

        if (data.sheetName) {
          state.sheetName = data.sheetName;
          localStorage.setItem("budget_sheet_name", data.sheetName);
        }

        if (data.recentTransactions && Array.isArray(data.recentTransactions)) {
          saveRecentTransactions(data.recentTransactions);
          if (elements.recentModal && elements.recentModal.classList.contains("open")) {
            renderRecentList();
          }
        }

        updateAllButtons();
        updateStatus("online", `Connected: ${state.sheetName}`);
        if (showNotification) {
          showToast(`Synced with ${state.sheetName}!`, "success");
        }
      } else {
        throw new Error(data.error || "Failed to load options");
      }
    } catch (err) {
      console.warn("Could not sync options with sheet:", err);
      updateStatus("", state.sheetName ? `Offline (${state.sheetName})` : "Disconnected");
      if (showNotification) {
        showToast("Could not sync with Google Sheets. Check URL.", "error");
      }
    }
  }

  // Cent-shifting state (ATM-style currency entry)
  let currentCents = 0;

  // Format integer cents with thousand-separator commas (e.g. 128567 -> "1,285.67")
  function formatCentsWithCommas(cents) {
    if (cents === 0) return "";
    const dollars = Math.floor(cents / 100);
    const centPart = String(cents % 100).padStart(2, "0");
    const formattedDollars = dollars.toLocaleString("en-US");
    return `${formattedDollars}.${centPart}`;
  }

  // Parse and clamp raw input digits into valid integer cents (max $999,999.99)
  function parseAtmCents(rawStr) {
    const rawDigits = String(rawStr || "").replace(/\D/g, "");
    let cents = parseInt(rawDigits, 10);
    if (isNaN(cents)) cents = 0;
    return Math.min(cents, 99999999);
  }

  // Handle ATM-style cent-shifting input (e.g. 4 -> 0.04, 50 -> 0.50, 12856 -> 128.56, 128567 -> 1,285.67)
  function handleAmountInput() {
    currentCents = parseAtmCents(elements.amountInput.value);
    elements.amountInput.value = formatCentsWithCommas(currentCents);

    // Keep cursor at the end so typing continues naturally from right to left
    requestAnimationFrame(() => {
      elements.amountInput.setSelectionRange(
        elements.amountInput.value.length,
        elements.amountInput.value.length
      );
    });
  }

  // Offline Queue Storage Key & Manager
  const OFFLINE_QUEUE_KEY = "budget_offline_queue";

  function getOfflineQueue() {
    try {
      return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveOfflineQueue(queue) {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error("Failed to save offline queue:", e);
    }
  }

  function enqueueItem(action, payload) {
    const queue = getOfflineQueue();
    const prefix = action === "undo" ? "undo_" : action === "edit" ? "edit_" : "tx_";
    const item = {
      id: prefix + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      queuedAt: Date.now(),
      action,
      ...payload
    };
    queue.push(item);
    saveOfflineQueue(queue);
    updateQueueUI();
    return queue.length;
  }

  function enqueueTransaction(payload) { return enqueueItem("add", payload); }
  function enqueueUndo(payload) { return enqueueItem("undo", payload); }
  function enqueueEdit(payload) { return enqueueItem("edit", payload); }

  function updateQueueUI() {
    const queue = getOfflineQueue();
    const count = queue.length;

    if (elements.queueBadge) {
      if (count > 0) {
        elements.queueBadge.style.display = "inline-flex";
        if (elements.queueCount) elements.queueCount.textContent = count;
      } else {
        elements.queueBadge.style.display = "none";
      }
    }

    if (elements.queueStatusText) {
      if (count === 0) {
        elements.queueStatusText.textContent = "No pending transactions.";
      } else {
        elements.queueStatusText.textContent = `${count} pending change${count === 1 ? "" : "s"} waiting to sync.`;
      }
    }

    if (elements.btnSyncQueueNow) {
      elements.btnSyncQueueNow.style.display = count > 0 ? "inline-flex" : "none";
    }
  }

  let isSyncingQueue = false;
  async function processOfflineQueue(showNotification = false) {
    if (isSyncingQueue) return;
    if (!state.scriptUrl) return;

    const queue = getOfflineQueue();
    if (!queue || queue.length === 0) {
      updateQueueUI();
      return;
    }

    if (!navigator.onLine) {
      if (showNotification) {
        showToast("Still offline. Will sync when connection returns.", "error");
      }
      return;
    }

    isSyncingQueue = true;
    updateStatus("syncing", `Syncing queue (${queue.length})...`);

    const batchItems = [...queue];
    const payload = {
      action: "batch",
      transactions: batchItems.map((item) => {
        if (item.action === "edit" || item.action === "update") {
          return {
            action: "edit",
            row: item.row,
            original: item.original || {
              date: item.date,
              description: item.description,
              category: item.category,
              from: item.from,
              to: item.to,
              amount: item.amount
            },
            updated: item.updated || {
              date: item.date,
              description: item.description,
              category: item.category,
              from: item.from,
              to: item.to,
              amount: item.amount
            }
          };
        }
        return {
          action: item.action || "add",
          date: item.date,
          description: item.description,
          category: item.category,
          from: item.from,
          to: item.to,
          amount: item.amount
        };
      })
    };

    try {
      await fetch(state.scriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      // Safely remove only the items that were included in this batch
      const currentQueue = getOfflineQueue();
      const batchIds = new Set(batchItems.map((it) => it.id));
      const remainingQueue = currentQueue.filter((it) => !batchIds.has(it.id));
      saveOfflineQueue(remainingQueue);

      const syncedCount = batchItems.length;
      isSyncingQueue = false;
      updateQueueUI();

      haptic([25, 50, 25]);
      showToast(`Synced ${syncedCount} pending change${syncedCount === 1 ? "" : "s"} to ${state.sheetName || "Sheet"}!`, "success");

      fetchRecentTransactionsFromSheet();

      if (remainingQueue.length === 0) {
        updateStatus("online", `Connected: ${state.sheetName || "Sheet"}`);
      } else {
        updateStatus("", `${remainingQueue.length} pending sync`);
        processOfflineQueue();
      }
    } catch (err) {
      console.warn("Batch queue sync failed, will retry:", err);
      isSyncingQueue = false;
      updateQueueUI();
      if (showNotification) {
        showToast("Could not sync queue. Check connection.", "error");
      }
      updateStatus("", `${queue.length} pending sync`);
    }
  }

  // Recent Transactions Storage & Manager (Last 6 Entries)
  const RECENT_TRANSACTIONS_LIMIT = 6;
  const RECENT_TXS_KEY = "budget_recent_txs";

  function getRecentTransactions() {
    try {
      return JSON.parse(localStorage.getItem(RECENT_TXS_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveRecentTransactions(txs) {
    try {
      localStorage.setItem(RECENT_TXS_KEY, JSON.stringify(txs.slice(0, RECENT_TRANSACTIONS_LIMIT)));
    } catch (e) {
      console.error("Failed to save recent transactions:", e);
    }
  }

  function addRecentTransaction(tx) {
    const list = getRecentTransactions();
    const item = {
      id: "rc_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      timestamp: Date.now(),
      ...tx
    };
    list.unshift(item);
    saveRecentTransactions(list);
    addToAllTransactions(item);
  }

  function removeRecentTransaction(id) {
    const list = getRecentTransactions().filter((item) => item.id !== id);
    saveRecentTransactions(list);
  }

  let isFetchingRecent = false;
  async function fetchRecentTransactionsFromSheet(showFeedback = false) {
    if (!state.scriptUrl) {
      if (showFeedback) showToast("Please configure Google Script URL in Settings.", "error");
      return;
    }
    if (!navigator.onLine) {
      if (showFeedback) showToast("Offline: showing saved transactions.", "info");
      return;
    }
    if (isFetchingRecent) return;

    isFetchingRecent = true;
    if (elements.btnRefreshRecent) {
      elements.btnRefreshRecent.classList.add("spinning");
    }
    renderRecentList();

    try {
      const fetchUrl = `${state.scriptUrl}${state.scriptUrl.includes("?") ? "&" : "?"}action=recent&t=${Date.now()}`;
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (data && data.success && Array.isArray(data.recentTransactions)) {
        saveRecentTransactions(data.recentTransactions);
        renderRecentList();
        if (showFeedback) {
          haptic(15);
          showToast(`Synced ${data.recentTransactions.length} transaction${data.recentTransactions.length === 1 ? "" : "s"} from Sheet.`, "info");
        }
      } else if (data && data.error) {
        console.warn("Sheet returned error:", data.error);
        if (showFeedback) {
          showToast(`Sheet: ${data.error}`, "error");
        }
      }
    } catch (err) {
      console.warn("Failed to fetch recent transactions from sheet:", err);
      if (showFeedback) {
        showToast("Could not connect to Sheet. Check your URL.", "error");
      }
    } finally {
      isFetchingRecent = false;
      if (elements.btnRefreshRecent) {
        elements.btnRefreshRecent.classList.remove("spinning");
      }
      renderRecentList();
    }
  }

  function openRecentModal() {
    renderRecentList();
    if (elements.recentModal) {
      elements.recentModal.classList.add("open");
    }
    fetchRecentTransactionsFromSheet();
  }

  function closeRecentModal() {
    if (elements.recentModal) {
      elements.recentModal.classList.remove("open");
    }
  }

  function createTransactionRow(item) {
    const row = document.createElement("div");
    row.className = "recent-item";

    const info = document.createElement("div");
    info.className = "recent-info";

    const desc = document.createElement("div");
    desc.className = "recent-desc";
    desc.textContent = item.description || "Untitled";

    const meta = document.createElement("div");
    meta.className = "recent-meta";
    const dateDisplay = item.date ? formatHumanDate(item.date) : "Today";
    const skipSuffix = item.skip ? " · Skipped" : "";
    meta.textContent = `${dateDisplay} · ${item.category || "Uncategorized"}${skipSuffix}`;

    info.appendChild(desc);
    info.appendChild(meta);

    const right = document.createElement("div");
    right.className = "recent-right";

    const amt = document.createElement("div");
    amt.className = "recent-amount";
    amt.textContent = "$" + parseFloat(item.amount || 0).toFixed(2);

    // Color coding:
    // Red if "To" was spending
    // Green if "From" was income
    // Yellow if neither
    const toVal = (item.to || "").trim().toLowerCase();
    const fromVal = (item.from || "").trim().toLowerCase();

    if (toVal === "spending") {
      amt.style.color = "#f87171"; // Red
    } else if (fromVal === "income") {
      amt.style.color = "#34d399"; // Green
    } else {
      amt.style.color = "#facc15"; // Yellow
    }

    right.appendChild(amt);
    row.appendChild(info);
    row.appendChild(right);

    row.addEventListener("click", () => {
      openTransactionEditor(item);
    });

    return row;
  }

  function renderRecentList() {
    if (!elements.recentList) return;
    elements.recentList.innerHTML = "";

    const list = getRecentTransactions();
    if (elements.btnUndoRecent) {
      elements.btnUndoRecent.style.display = (list && list.length > 0) ? "inline-flex" : "none";
    }

    if (!list || list.length === 0) {
      const empty = document.createElement("div");
      empty.className = "recent-empty";
      empty.textContent = isFetchingRecent 
        ? "Loading recent transactions from Sheet..." 
        : "No recent transactions found.";
      elements.recentList.appendChild(empty);
      return;
    }

    list.forEach((item) => {
      elements.recentList.appendChild(createTransactionRow(item));
    });
  }

  async function undoTransaction(item) {
    haptic(15);

    // 1. Remove from recent list
    removeRecentTransaction(item.id);
    renderRecentList();

    // 1b. Remove from all transactions list
    removeFromAllTransactions(item);

    // 2. Remove from offline queue if it hasn't synced yet
    const queue = getOfflineQueue();
    const filteredQueue = queue.filter(
      (q) => !(q.description === item.description && Math.abs(q.amount - item.amount) < 0.01 && q.date === item.date)
    );
    const wasInOfflineQueue = filteredQueue.length !== queue.length;

    if (wasInOfflineQueue) {
      saveOfflineQueue(filteredQueue);
      updateQueueUI();
    } else {
      // 3. Dispatch undo request to Google Sheet (or queue offline if disconnected)
      if (navigator.onLine && state.scriptUrl) {
        try {
          await fetch(state.scriptUrl, {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify({
              action: "undo",
              sheetName: item.sheetName || null,
              row: item.row,
              date: item.date,
              description: item.description,
              category: item.category,
              from: item.from,
              to: item.to,
              amount: item.amount
            })
          });

          setTimeout(() => {
            fetchRecentTransactionsFromSheet();
          }, 1500);
        } catch (e) {
          console.warn("Could not dispatch undo to sheet, queueing offline:", e);
          enqueueUndo({
            row: item.row,
            date: item.date,
            description: item.description,
            category: item.category,
            from: item.from,
            to: item.to,
            amount: item.amount
          });
        }
      } else {
        // Offline: Queue undo action to sync automatically once reconnected
        enqueueUndo({
          row: item.row,
          date: item.date,
          description: item.description,
          category: item.category,
          from: item.from,
          to: item.to,
          amount: item.amount
        });
      }
    }

    closeRecentModal();
    if (!wasInOfflineQueue && !navigator.onLine) {
      showToast("Transaction undone. Offline undo queued to sync.", "info");
    } else {
      showToast("Transaction undone.", "success");
    }
  }

  // Submit Transaction
  async function submitTransaction() {
    const amount = currentCents / 100;

    // Strict validation: Amount required
    if (currentCents <= 0 || isNaN(amount)) {
      haptic([20, 30, 20]);
      const card = elements.amountCard || elements.amountInput.closest(".amount-card");
      highlightError(card);
      elements.amountInput.focus();
      return;
    }

    // Strict validation: Description required
    const desc = activeQuickFill ? activeQuickFill.title : elements.descInput.value.trim();
    if (!desc) {
      haptic([20, 30, 20]);
      highlightError(elements.descInput);
      elements.descInput.focus();
      return;
    }

    // Strict validation: Category required
    if (!state.selectedCategory) {
      haptic([20, 30, 20]);
      highlightError(elements.btnSelectCategory);
      openPicker("category");
      return;
    }

    // Strict validation: From required
    if (!state.selectedFrom) {
      haptic([20, 30, 20]);
      highlightError(elements.btnSelectFrom);
      openPicker("from");
      return;
    }

    // Strict validation: To required
    if (!state.selectedTo) {
      haptic([20, 30, 20]);
      highlightError(elements.btnSelectTo);
      openPicker("to");
      return;
    }

    // Strict validation: From and To cannot be the same
    if (state.selectedFrom.trim().toLowerCase() === state.selectedTo.trim().toLowerCase()) {
      haptic([20, 30, 20]);
      highlightError(elements.btnSelectFrom);
      highlightError(elements.btnSelectTo);
      return;
    }

    // Strict validation: From cannot be Income and To cannot be Spending at the same time
    if (state.selectedFrom.trim().toLowerCase() === "income" && state.selectedTo.trim().toLowerCase() === "spending") {
      haptic([20, 30, 20]);
      highlightError(elements.btnSelectFrom);
      highlightError(elements.btnSelectTo);
      return;
    }

    if (!state.scriptUrl) {
      haptic(25);
      showToast("Please connect your Google Sheet in Settings first.", "error");
      openSettings();
      return;
    }

    const payload = {
      date: state.selectedDate,
      description: desc,
      category: state.selectedCategory,
      from: state.selectedFrom,
      to: state.selectedTo,
      amount: amount
    };

    // Helper to perform successful form reset
    function resetFormFields() {
      currentCents = 0;
      elements.amountInput.value = "";
      elements.descInput.value = "";
      resetWheelToBlank();
      state.selectedCategory = state.defaults.category || "";
      state.selectedFrom = state.defaults.from || "";
      state.selectedTo = state.defaults.to || "";
      updateAllButtons();
      setDate(getFormattedDate(new Date()));
      if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }
    }

    // Offline check: queue immediately if offline
    if (!navigator.onLine) {
      const pendingCount = enqueueTransaction(payload);
      addRecentTransaction(payload);
      haptic(15);
      showToast(`Saved offline (${pendingCount} pending). Will sync when online.`, "success");
      resetFormFields();
      return;
    }

    // If there are already pending items in queue, queue this item too so all items sync in strict chronological order
    if (getOfflineQueue().length > 0) {
      const pendingCount = enqueueTransaction(payload);
      addRecentTransaction(payload);
      haptic(15);
      showToast(`Queued (${pendingCount} pending). Syncing batch...`, "info");
      resetFormFields();
      processOfflineQueue();
      return;
    }

    // UI Busy State
    elements.btnSubmit.disabled = true;
    elements.btnSubmitText.textContent = "Adding to " + (state.sheetName || "Sheet") + "...";

    try {
      await fetch(state.scriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      // Success
      haptic(15);
      const formattedAmount = "$" + amount.toFixed(2);
      showToast(`Added ${formattedAmount} to ${state.sheetName || "Sheet"}!`, "success");
      addRecentTransaction(payload);
      resetFormFields();

      // Refresh recent transactions to fetch actual row numbers from sheet
      setTimeout(() => {
        fetchRecentTransactionsFromSheet();
      }, 1200);

      // Trigger queue process in case older items exist
      if (getOfflineQueue().length > 0) {
        processOfflineQueue();
      }
    } catch (err) {
      console.warn("Submission error, saving to offline queue:", err);
      const pendingCount = enqueueTransaction(payload);
      addRecentTransaction(payload);
      haptic(15);
      showToast(`Saved offline (${pendingCount} pending). Will sync automatically.`, "success");
      resetFormFields();
    } finally {
      elements.btnSubmit.disabled = false;
      elements.btnSubmitText.textContent = "Add Transaction";
    }
  }

  // =========================================================================
  // Theme & Accent Customization Controller (7 Preset Palette)
  // =========================================================================

  function applyTheme(themeId) {
    state.accentTheme = themeId;
    localStorage.setItem("budget_accent_theme", themeId);
    document.documentElement.setAttribute("data-theme", themeId);
    updateThemeUI();
  }

  function updateThemeUI() {
    const themeId = state.accentTheme || "emerald";

    // Update active ring on swatches
    if (elements.themePalette) {
      const swatches = elements.themePalette.querySelectorAll(".theme-swatch");
      swatches.forEach((s) => {
        s.classList.toggle("active", s.dataset.themeId === themeId);
      });
    }

    // Update theme name badge in Settings
    if (elements.themeNameBadge) {
      const activeSwatch = elements.themePalette ? elements.themePalette.querySelector(`.theme-swatch[data-theme-id="${themeId}"]`) : null;
      elements.themeNameBadge.textContent = activeSwatch ? (activeSwatch.dataset.themeName || themeId) : "Emerald";
    }
  }

  function initTheme() {
    const savedTheme = localStorage.getItem("budget_accent_theme") || "emerald";
    state.accentTheme = savedTheme;
    applyTheme(savedTheme);
  }

  function initThemeEvents() {
    if (elements.themePalette) {
      elements.themePalette.addEventListener("click", (e) => {
        const swatch = e.target.closest(".theme-swatch");
        if (!swatch) return;
        const themeId = swatch.dataset.themeId;
        if (themeId) {
          haptic(10);
          applyTheme(themeId);
        }
      });
    }
  }

  // Settings Modal Controls
  function openSettings() {
    elements.scriptUrlInput.value = state.scriptUrl;
    if (elements.hapticsToggle) {
      elements.hapticsToggle.checked = state.hapticsEnabled;
    }
    if (elements.settingsVersion) {
      elements.settingsVersion.textContent = APP_VERSION;
    }
    updateDefaultButtons();
    updateQueueUI();
    updateThemeUI();
    elements.settingsModal.classList.add("open");
  }

  function closeSettings() {
    elements.settingsModal.classList.remove("open");
  }

  function saveSettings() {
    const url = elements.scriptUrlInput.value.trim();
    state.scriptUrl = url;
    localStorage.setItem("budget_script_url", url);
    if (elements.hapticsToggle) {
      state.hapticsEnabled = elements.hapticsToggle.checked;
      localStorage.setItem("budget_haptics_enabled", state.hapticsEnabled ? "true" : "false");
    }
    closeSettings();
    showToast("Settings saved!", "success");
    syncOptions(true);
  }

  // Event Listeners
  elements.btnDateToday.addEventListener("click", () => {
    setDate(getFormattedDate(new Date()));
  });

  elements.btnDateYesterday.addEventListener("click", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setDate(getFormattedDate(yesterday));
  });

  elements.btnDateCustom.addEventListener("click", () => {
    if (elements.datePicker.showPicker) {
      elements.datePicker.showPicker();
    } else {
      elements.datePicker.click();
    }
  });

  elements.datePicker.addEventListener("change", (e) => {
    if (e.target.value) {
      setDate(e.target.value);
    }
  });

  elements.btnSubmit.addEventListener("click", submitTransaction);

  elements.amountInput.addEventListener("input", handleAmountInput);
  elements.amountInput.addEventListener("focus", () => {
    if (currentCents > 0) {
      requestAnimationFrame(() => {
        elements.amountInput.setSelectionRange(
          elements.amountInput.value.length,
          elements.amountInput.value.length
        );
      });
    }
  });

  elements.amountInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      elements.descInput.focus();
    }
  });

  elements.descInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      elements.descInput.blur();
      openPicker("category");
    }
  });

  // Option Picker Listeners
  if (elements.btnSelectCategory) {
    elements.btnSelectCategory.addEventListener("click", () => openPicker("category"));
  }
  if (elements.btnSelectFrom) {
    elements.btnSelectFrom.addEventListener("click", () => openPicker("from"));
  }
  if (elements.btnSelectTo) {
    elements.btnSelectTo.addEventListener("click", () => openPicker("to"));
  }

  // Default Setting Picker Listeners
  if (elements.btnDefaultCategory) {
    elements.btnDefaultCategory.addEventListener("click", () => openPicker("category", true));
  }
  if (elements.btnDefaultFrom) {
    elements.btnDefaultFrom.addEventListener("click", () => openPicker("from", true));
  }
  if (elements.btnDefaultTo) {
    elements.btnDefaultTo.addEventListener("click", () => openPicker("to", true));
  }
  if (elements.pickerBackdrop) {
    elements.pickerBackdrop.addEventListener("click", closePicker);
  }
  if (elements.pickerOverlay) {
    elements.pickerOverlay.addEventListener("click", (e) => {
      // Tap outside the text options closes the picker
      if (!e.target.closest(".picker-option")) {
        closePicker();
      }
    });
  }

  // Clean URL query parameters if loaded via cache-busting reload
  if (window.location.search && window.location.search.includes("v=")) {
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}
  }

  // Tap Logo to Force App Update & Refresh (Purges cache & hard-refreshes)
  async function forceAppUpdate() {
    haptic(15);
    if (!navigator.onLine) {
      showToast("Offline: running latest saved version.", "info");
      return;
    }
    showToast("Purging cache & checking for updates...", "info");

    try {
      // 1. Unregister active service workers so they immediately release control
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.unregister();
        }
      }

      // 2. Purge Cache Storage to eliminate stale app-shell files
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch (e) {
      console.warn("Could not unregister or purge caches:", e);
    }

    // 3. Hard navigate to cache-busted URL so Fastly CDN and browser HTTP cache are bypassed
    const targetUrl = window.location.origin + window.location.pathname + `?v=${Date.now()}`;
    window.location.replace(targetUrl);
  }

  if (elements.brandLogo) {
    elements.brandLogo.addEventListener("click", forceAppUpdate);
  }

  elements.btnOpenSettings.addEventListener("click", () => {
    updateQueueUI();
    openSettings();
  });
  elements.btnCloseSettings.addEventListener("click", closeSettings);
  elements.btnSaveSettings.addEventListener("click", saveSettings);
  if (elements.hapticsToggle) {
    elements.hapticsToggle.addEventListener("change", (e) => {
      state.hapticsEnabled = e.target.checked;
      localStorage.setItem("budget_haptics_enabled", state.hapticsEnabled ? "true" : "false");
      if (state.hapticsEnabled) {
        haptic(15);
      }
    });
  }
  if (elements.settingsVersion) {
    elements.settingsVersion.textContent = APP_VERSION;
  }
  elements.btnSyncNow.addEventListener("click", () => syncOptions(true));
  if (elements.btnSyncQueueNow) {
    elements.btnSyncQueueNow.addEventListener("click", () => processOfflineQueue(true));
  }
  if (elements.queueBadge) {
    elements.queueBadge.addEventListener("click", () => processOfflineQueue(true));
  }

  initThemeEvents();

  // Network and background sync triggers
  window.addEventListener("online", () => {
    updateStatus("online", state.sheetName ? `Connected: ${state.sheetName}` : "Online");
    processOfflineQueue();
  });
  window.addEventListener("offline", () => {
    const queue = getOfflineQueue();
    updateStatus("", queue.length > 0 ? `Offline (${queue.length} pending)` : "Offline");
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && navigator.onLine) {
      processOfflineQueue();
    }
  });
  window.addEventListener("focus", () => {
    if (navigator.onLine) {
      processOfflineQueue();
    }
  });

  if (elements.btnOpenRecent) {
    elements.btnOpenRecent.addEventListener("click", openRecentModal);
  }
  if (elements.btnRefreshRecent) {
    elements.btnRefreshRecent.addEventListener("click", () => {
      fetchRecentTransactionsFromSheet(true);
    });
  }
  if (elements.btnUndoRecent) {
    elements.btnUndoRecent.addEventListener("click", () => {
      const list = getRecentTransactions();
      if (list && list.length > 0) {
        undoTransaction(list[0]);
      } else {
        showToast("No transaction to undo.", "info");
      }
    });
  }
  if (elements.recentModal) {
    elements.recentModal.addEventListener("click", (e) => {
      if (e.target === elements.recentModal) {
        closeRecentModal();
      }
    });
  }

  elements.settingsModal.addEventListener("click", (e) => {
    if (e.target === elements.settingsModal) {
      closeSettings();
    }
  });

  // =========================================================================
  // Quick Fill Options & 3D Rotating Wheel Controller
  // =========================================================================

  const QUICK_FILL_KEY = "budget_quick_fill_options";

  function getQuickFillOptions() {
    try {
      return JSON.parse(localStorage.getItem(QUICK_FILL_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveQuickFillOptions(opts) {
    try {
      localStorage.setItem(QUICK_FILL_KEY, JSON.stringify(opts));
      updateWheelVisibility();
    } catch (e) {
      console.error("Failed to save quick fill options:", e);
    }
  }

  let activeQuickFill = null;
  let currentWheelIndex = 0; // 0 = Blank slot, 1..N = options
  let currentVirtualIndex = 0;
  let isDraggingWheel = false;
  let dragStartY = 0;
  let dragStartVirtual = 0;
  let lastHapticIndex = 0;
  let wheelAnimFrame = null;

  function updateWheelVisibility() {
    const options = getQuickFillOptions();
    if (!elements.descSplitContainer) return;
    if (options.length === 0) {
      elements.descSplitContainer.classList.add("no-wheel");
    } else {
      elements.descSplitContainer.classList.remove("no-wheel");
      renderWheelSlots(currentWheelIndex);
    }
  }

  function renderWheelSlots(virtualIndex = currentVirtualIndex) {
    const options = getQuickFillOptions();
    if (!elements.wheelCylinder) return;

    elements.wheelCylinder.innerHTML = "";
    if (options.length === 0) return;

    // Slot 0 is blank, Slots 1..N are options
    const totalSlots = options.length + 1;

    for (let i = 0; i < totalSlots; i++) {
      const diff = i - virtualIndex;
      if (Math.abs(diff) > 2.8) continue; // Out of view

      const slot = document.createElement("div");
      slot.className = "wheel-slot";

      const opt = i === 0 ? null : options[i - 1];
      const title = opt ? opt.title : "";
      slot.textContent = title;

      // 3D rotation and cylinder translation with tight slot spacing for 72px container
      const angle = diff * -20; // degrees rotation on X axis
      const translateY = diff * 18; // px vertical offset
      const translateZ = Math.max(0, 24 - Math.abs(diff) * 10);
      const scale = Math.max(0.76, 1 - Math.abs(diff) * 0.10);
      const opacity = Math.max(0, 1 - Math.abs(diff) * 0.40);

      slot.style.transform = `rotateX(${angle}deg) translateY(${translateY}px) translateZ(${translateZ}px) scale(${scale})`;
      slot.style.opacity = String(opacity);

      if (Math.abs(diff) < 0.35) {
        slot.classList.add("center");
        if (i > 0) slot.classList.add("active-option");
      } else if (diff < 0) {
        slot.classList.add("above");
      } else {
        slot.classList.add("below");
      }

      elements.wheelCylinder.appendChild(slot);
    }
  }

  function snapWheelToIndex(targetIndex, duration = 200) {
    if (wheelAnimFrame) cancelAnimationFrame(wheelAnimFrame);

    const startVal = currentVirtualIndex;
    const endVal = targetIndex;
    const startTime = performance.now();

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      currentVirtualIndex = startVal + (endVal - startVal) * ease;
      renderWheelSlots(currentVirtualIndex);

      if (progress < 1) {
        wheelAnimFrame = requestAnimationFrame(animate);
      } else {
        currentVirtualIndex = endVal;
        currentWheelIndex = endVal;
        renderWheelSlots(currentWheelIndex);
        onWheelSnapped(endVal);
      }
    }

    wheelAnimFrame = requestAnimationFrame(animate);
  }

  function onWheelSnapped(index) {
    const options = getQuickFillOptions();
    if (index > 0 && index <= options.length) {
      const selected = options[index - 1];
      activeQuickFill = selected;

      // Autofill Dollar Amount (if preset defines an optional amount)
      if (selected.amount && typeof selected.amount === "number" && selected.amount > 0) {
        currentCents = Math.round(selected.amount * 100);
        elements.amountInput.value = formatCentsWithCommas(currentCents);
      }

      // Autofill Category, From, To
      if (selected.category) state.selectedCategory = selected.category;
      if (selected.from) state.selectedFrom = selected.from;
      if (selected.to) state.selectedTo = selected.to;
      updateAllButtons();

      // Expand wheel to 100% width
      elements.descSplitContainer.classList.remove("wheel-scrolling");
      elements.descSplitContainer.classList.add("wheel-expanded");
      haptic(15);
    } else {
      // Reverted to blank slot
      activeQuickFill = null;
      elements.descSplitContainer.classList.remove("wheel-expanded");
      elements.descSplitContainer.classList.remove("wheel-scrolling");
    }
  }

  function resetWheelToBlank() {
    currentWheelIndex = 0;
    currentVirtualIndex = 0;
    activeQuickFill = null;
    if (elements.descSplitContainer) {
      elements.descSplitContainer.classList.remove("wheel-expanded");
      elements.descSplitContainer.classList.remove("wheel-scrolling");
      elements.descSplitContainer.classList.remove("desc-expanded");
    }
    renderWheelSlots(0);
  }

  function initWheelEvents() {
    const wrapper = elements.quickWheelWrapper;
    if (!wrapper) return;

    let startY = 0;
    let recentMoves = [];

    // Explicit non-passive touchmove listener to completely prevent mobile pull-to-refresh
    wrapper.addEventListener("touchmove", (e) => {
      if (isDraggingWheel) {
        e.preventDefault();
      }
    }, { passive: false });

    // Stop touchstart propagation so page-level gesture detectors don't latch pull-down
    wrapper.addEventListener("touchstart", (e) => {
      if (e.target.closest("#btnWheelReset")) return;
      const options = getQuickFillOptions();
      if (options.length === 0) return;
      e.stopPropagation();

      // Dismiss keyboard immediately when touching the wheel
      if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }
    }, { passive: true });

    wrapper.addEventListener("pointerdown", (e) => {
      // If clicking reset button, ignore wheel drag
      if (e.target.closest("#btnWheelReset")) return;

      const options = getQuickFillOptions();
      if (options.length === 0) return;

      // Dismiss keyboard when starting to interact with the wheel
      if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }

      isDraggingWheel = true;
      startY = e.clientY;
      dragStartVirtual = currentVirtualIndex;
      lastHapticIndex = Math.round(currentVirtualIndex);
      recentMoves = [{ y: e.clientY, time: performance.now() }];

      try {
        wrapper.setPointerCapture(e.pointerId);
      } catch (err) {}

      if (wheelAnimFrame) cancelAnimationFrame(wheelAnimFrame);
      e.preventDefault();
    });

    wrapper.addEventListener("pointermove", (e) => {
      if (!isDraggingWheel) return;

      const now = performance.now();
      recentMoves.push({ y: e.clientY, time: now });
      while (recentMoves.length > 1 && now - recentMoves[0].time > 90) {
        recentMoves.shift();
      }

      const options = getQuickFillOptions();
      const deltaY = e.clientY - startY;

      if (Math.abs(deltaY) > 4) {
        elements.descSplitContainer.classList.add("wheel-scrolling");
        if (document.activeElement && typeof document.activeElement.blur === "function") {
          document.activeElement.blur();
        }
      }

      // Ergonomic 64px drag distance per slot (tactile, deliberate control)
      const virtualDelta = -deltaY / 64;
      let newVirtual = dragStartVirtual + virtualDelta;

      // Rubber banding at ends
      if (newVirtual < 0) {
        newVirtual = newVirtual * 0.22;
      } else if (newVirtual > options.length) {
        newVirtual = options.length + (newVirtual - options.length) * 0.22;
      }

      // Mechanical ratchet haptic tick when crossing an option boundary
      const candidateIndex = Math.round(newVirtual);
      if (candidateIndex !== lastHapticIndex && candidateIndex >= 0 && candidateIndex <= options.length) {
        haptic(10);
        lastHapticIndex = candidateIndex;
      }

      currentVirtualIndex = newVirtual;
      renderWheelSlots(currentVirtualIndex);
      e.preventDefault();
    });

    const endDrag = (e) => {
      if (!isDraggingWheel) return;
      isDraggingWheel = false;

      const options = getQuickFillOptions();
      const now = performance.now();

      // Check trailing velocity from last 80ms
      const validMoves = recentMoves.filter(m => now - m.time <= 80);
      let velocityY = 0;
      if (validMoves.length >= 2) {
        const oldest = validMoves[0];
        const latest = validMoves[validMoves.length - 1];
        const dt = latest.time - oldest.time;
        if (dt > 15) {
          velocityY = (latest.y - oldest.y) / dt; // px / ms
        }
      }

      // Moving finger UP (velocityY < 0) scrolls to higher index (+1 or +2)
      // Moving finger DOWN (velocityY > 0) scrolls to lower index (-1 or -2)
      let slotImpulse = 0;
      if (Math.abs(velocityY) > 0.45) {
        const dir = velocityY < 0 ? 1 : -1;
        const mag = Math.abs(velocityY) > 1.2 ? 2 : 1;
        slotImpulse = dir * mag;
      }

      let target = Math.round(currentVirtualIndex + slotImpulse);
      target = Math.max(0, Math.min(options.length, target));

      snapWheelToIndex(target, 240);
    };

    wrapper.addEventListener("pointerup", endDrag);
    wrapper.addEventListener("pointercancel", (e) => {
      if (!isDraggingWheel) return;
      isDraggingWheel = false;
      const options = getQuickFillOptions();
      // On cancel, cleanly snap to nearest slot with zero momentum fling
      const target = Math.max(0, Math.min(options.length, Math.round(currentVirtualIndex)));
      snapWheelToIndex(target, 200);
    });

    // Mouse wheel scrolling for desktop testing
    wrapper.addEventListener("wheel", (e) => {
      e.preventDefault();
      const options = getQuickFillOptions();
      if (options.length === 0) return;

      const dir = e.deltaY > 0 ? 1 : -1;
      let target = currentWheelIndex + dir;
      target = Math.max(0, Math.min(options.length, target));
      if (target !== currentWheelIndex) {
        haptic(10);
        snapWheelToIndex(target, 180);
      }
    }, { passive: false });
  }

  // Right-side X Reset Button on expanded wheel
  if (elements.btnWheelReset) {
    elements.btnWheelReset.addEventListener("click", (e) => {
      e.stopPropagation();
      haptic(15);
      elements.btnWheelReset.blur();
      resetWheelToBlank();

      // Reset Dollar Amount to 0 (cleared)
      currentCents = 0;
      if (elements.amountInput) {
        elements.amountInput.value = "";
      }

      // Reset Category, From, To to default values
      state.selectedCategory = state.defaults.category || "";
      state.selectedFrom = state.defaults.from || "";
      state.selectedTo = state.defaults.to || "";
      updateAllButtons();

      // Clear description
      if (elements.descInput) {
        elements.descInput.value = "";
      }
    });
  }

  // Dual-edge bezier typing expansion on description input
  if (elements.descInput) {
    elements.descInput.addEventListener("input", () => {
      if (elements.descInput.value.length > 0) {
        if (currentWheelIndex !== 0) {
          resetWheelToBlank();
        }
        elements.descSplitContainer.classList.add("desc-expanded");
      } else {
        elements.descSplitContainer.classList.remove("desc-expanded");
      }
    });
  }

  // =========================================================================
  // Quick Fill Settings Manager & Reorderable List
  // =========================================================================

  function openQuickFillSettings() {
    renderQuickFillSettingsList();
    elements.quickFillSettingsModal.classList.add("open");
  }

  function closeQuickFillSettings() {
    elements.quickFillSettingsModal.classList.remove("open");
  }

  function renderQuickFillSettingsList() {
    const list = elements.qfSortableList;
    if (!list) return;

    list.innerHTML = "";
    const options = getQuickFillOptions();

    if (options.length === 0) {
      if (elements.qfEmptyHint) elements.qfEmptyHint.style.display = "block";
      return;
    }

    if (elements.qfEmptyHint) elements.qfEmptyHint.style.display = "none";

    options.forEach((opt, index) => {
      const itemEl = document.createElement("div");
      itemEl.className = "qf-item";
      itemEl.dataset.id = opt.id;
      itemEl.dataset.index = index;

      // Drag handle
      const handle = document.createElement("div");
      handle.className = "qf-drag-handle";
      handle.innerHTML = "&#9776;"; // ☰ hamburger drag handle
      handle.title = "Drag to reorder";

      // Info text
      const info = document.createElement("div");
      info.className = "qf-item-info";
      const title = document.createElement("div");
      title.className = "qf-item-title";
      title.textContent = opt.title;

      const badges = document.createElement("div");
      badges.className = "qf-item-badges";
      const amtBadge = opt.amount && opt.amount > 0 ? `$${opt.amount.toFixed(2)} • ` : "";
      const catText = opt.category || "No Category";
      const fromText = opt.from || "Any";
      const toText = opt.to || "Any";
      badges.textContent = `${amtBadge}${catText} • ${fromText} → ${toText}`;

      info.appendChild(title);
      info.appendChild(badges);

      // Actions
      const actions = document.createElement("div");
      actions.className = "qf-item-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "qf-action-btn";
      editBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      `;
      editBtn.title = "Edit option";
      editBtn.addEventListener("click", () => {
        openQuickFillEditor(opt);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "qf-action-btn delete";
      deleteBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      deleteBtn.title = "Delete option";
      deleteBtn.addEventListener("click", () => {
        haptic(15);
        const filtered = getQuickFillOptions().filter((o) => o.id !== opt.id);
        saveQuickFillOptions(filtered);
        renderQuickFillSettingsList();
        showToast(`Option "${opt.title}" removed.`, "info");
      });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      itemEl.appendChild(handle);
      itemEl.appendChild(info);
      itemEl.appendChild(actions);

      list.appendChild(itemEl);
    });

    initSortableDrag(list);
  }

  // Fluid GPU-Transform Drag-to-Reorder Engine for Quick Fill Options
  function initSortableDrag(container) {
    const handles = container.querySelectorAll(".qf-drag-handle");
    if (!handles.length) return;

    handles.forEach((handle) => {
      // Prevent browser default touch behavior on the handle
      handle.addEventListener("touchstart", (e) => {
        e.preventDefault();
      }, { passive: false });

      handle.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const itemEl = handle.closest(".qf-item");
        if (!itemEl) return;

        const allItems = [...container.querySelectorAll(".qf-item")];
        const startIndex = allItems.indexOf(itemEl);
        if (startIndex === -1 || allItems.length < 2) return;

        haptic(15);

        // Precompute initial geometry of all items
        const itemHeights = allItems.map((el) => el.offsetHeight);
        const gap = 10; // CSS gap between items in px
        const itemStep = itemHeights[startIndex] + gap;

        // Calculate initial vertical midpoints of all items relative to viewport
        const initialRects = allItems.map((el) => el.getBoundingClientRect());
        const startClientY = e.clientY;
        let currentTargetIndex = startIndex;

        // Visual setup for dragged item
        itemEl.classList.add("dragging");
        itemEl.style.zIndex = "1000";
        itemEl.style.position = "relative";
        itemEl.style.transition = "box-shadow 0.2s ease, opacity 0.2s ease";

        // Setup transitions on all OTHER items so they glide smoothly
        allItems.forEach((el, idx) => {
          if (idx !== startIndex) {
            el.style.transition = "transform 0.2s cubic-bezier(0.2, 0, 0, 1)";
          }
        });

        // Set pointer capture on handle
        try {
          handle.setPointerCapture(e.pointerId);
        } catch (err) {}

        const onPointerMove = (moveEvt) => {
          moveEvt.preventDefault();
          const deltaY = moveEvt.clientY - startClientY;

          // Dragged item follows the finger directly with GPU transform
          itemEl.style.transform = `translateY(${deltaY}px) scale(1.02)`;

          // Current midpoint of the dragged item
          const draggedMidY = initialRects[startIndex].top + initialRects[startIndex].height / 2 + deltaY;

          // Determine target index by comparing against initial midpoints
          let newTarget = startIndex;
          for (let i = 0; i < allItems.length; i++) {
            if (i === startIndex) continue;
            const mid = initialRects[i].top + initialRects[i].height / 2;
            if (i < startIndex && draggedMidY < mid) {
              newTarget = Math.min(newTarget, i);
            } else if (i > startIndex && draggedMidY > mid) {
              newTarget = Math.max(newTarget, i);
            }
          }

          if (newTarget !== currentTargetIndex) {
            haptic(10);
            currentTargetIndex = newTarget;

            // Shift other items to visually make room for dragged item
            allItems.forEach((el, i) => {
              if (i === startIndex) return;
              if (startIndex < currentTargetIndex) {
                // Dragging downwards: items between startIndex and currentTargetIndex shift UP
                if (i > startIndex && i <= currentTargetIndex) {
                  el.style.transform = `translateY(-${itemStep}px)`;
                } else {
                  el.style.transform = "translateY(0px)";
                }
              } else {
                // Dragging upwards: items between currentTargetIndex and startIndex shift DOWN
                if (i >= currentTargetIndex && i < startIndex) {
                  el.style.transform = `translateY(${itemStep}px)`;
                } else {
                  el.style.transform = "translateY(0px)";
                }
              }
            });
          }
        };

        const onPointerEnd = (endEvt) => {
          try {
            handle.releasePointerCapture(endEvt.pointerId);
          } catch (err) {}

          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("pointerup", onPointerEnd);
          window.removeEventListener("pointercancel", onPointerEnd);

          // Clean up all inline styles
          allItems.forEach((el) => {
            el.style.transform = "";
            el.style.transition = "";
            el.style.zIndex = "";
            el.style.position = "";
          });
          itemEl.classList.remove("dragging");

          // Commit reordered array to state and localStorage if changed
          if (currentTargetIndex !== startIndex) {
            const options = getQuickFillOptions();
            const [moved] = options.splice(startIndex, 1);
            options.splice(currentTargetIndex, 0, moved);
            saveQuickFillOptions(options);
            haptic(15);
            renderQuickFillSettingsList();
          }
        };

        window.addEventListener("pointermove", onPointerMove, { passive: false });
        window.addEventListener("pointerup", onPointerEnd);
        window.addEventListener("pointercancel", onPointerEnd);
      });
    });
  }

  // =========================================================================
  // Unified Editor Dialog (Add / Edit Quick Fill Option & Edit Recent Transaction)
  // Reuses the exact same modal sheet, inputs, and picker components.
  // =========================================================================

  let editorMode = "preset"; // "preset" | "transaction"
  let editorTxOriginal = null;
  let editorTxDate = "";

  let qfEditorState = {
    id: null,
    title: "",
    amount: null,
    category: "",
    from: "",
    to: ""
  };
  let qfEditorCents = 0;

  function handleQfAmountInput() {
    qfEditorCents = parseAtmCents(elements.qfAmountInput.value);
    elements.qfAmountInput.value = formatCentsWithCommas(qfEditorCents);
    requestAnimationFrame(() => {
      elements.qfAmountInput.setSelectionRange(
        elements.qfAmountInput.value.length,
        elements.qfAmountInput.value.length
      );
    });
  }

  function openQuickFillEditor(opt = null) {
    editorMode = "preset";
    editorTxOriginal = null;
    editorTxDate = "";

    if (elements.qfDateField) elements.qfDateField.style.display = "none";
    if (elements.qfSkipRow) elements.qfSkipRow.style.display = "none";
    if (elements.qfCategoryHeaderLabel) elements.qfCategoryHeaderLabel.textContent = "Autofill Values";

    if (opt) {
      qfEditorState = { ...opt };
      elements.qfEditorTitle.textContent = "Edit Quick Fill Option";
      elements.btnDeleteQuickFillOption.style.display = "block";
    } else {
      qfEditorState = {
        id: null,
        title: "",
        amount: null,
        category: "",
        from: "",
        to: ""
      };
      elements.qfEditorTitle.textContent = "Add Quick Fill Option";
      elements.btnDeleteQuickFillOption.style.display = "none";
    }

    elements.btnSaveQuickFillOption.textContent = "Save Option";
    elements.qfTitleInput.value = qfEditorState.title;
    if (qfEditorState.amount && qfEditorState.amount > 0) {
      qfEditorCents = Math.round(qfEditorState.amount * 100);
      elements.qfAmountInput.value = formatCentsWithCommas(qfEditorCents);
    } else {
      qfEditorCents = 0;
      elements.qfAmountInput.value = "";
    }
    elements.qfCatBtnText.textContent = qfEditorState.category || "(None)";
    elements.qfFromBtnText.textContent = qfEditorState.from || "(None)";
    elements.qfToBtnText.textContent = qfEditorState.to || "(None)";

    elements.transactionEditorModal.classList.add("open");
  }

  function openTransactionEditor(tx) {
    if (!tx) return;
    editorMode = "transaction";
    editorTxOriginal = tx;
    editorTxDate = tx.date || getFormattedDate(new Date());

    if (elements.qfDateField) elements.qfDateField.style.display = "block";
    if (elements.qfDateText) elements.qfDateText.textContent = formatHumanDate(editorTxDate);
    if (elements.qfDatePicker) elements.qfDatePicker.value = editorTxDate;
    if (elements.qfCategoryHeaderLabel) elements.qfCategoryHeaderLabel.textContent = "Category & Accounts";
    if (elements.qfSkipRow) {
      elements.qfSkipRow.style.display = "flex";
      if (elements.qfSkipToggle) {
        elements.qfSkipToggle.checked = Boolean(tx.skip);
      }
    }

    elements.qfEditorTitle.textContent = "Edit Transaction";
    elements.btnSaveQuickFillOption.textContent = "Save Changes";
    elements.btnDeleteQuickFillOption.style.display = "block";

    const desc = (tx.description && tx.description !== "Untitled") ? tx.description : "";
    elements.qfTitleInput.value = desc;

    const rawAmt = parseFloat(tx.amount || 0);
    if (rawAmt > 0) {
      qfEditorCents = Math.round(rawAmt * 100);
      elements.qfAmountInput.value = formatCentsWithCommas(qfEditorCents);
    } else {
      qfEditorCents = 0;
      elements.qfAmountInput.value = "";
    }

    qfEditorState = {
      id: tx.id || null,
      title: desc,
      amount: rawAmt > 0 ? rawAmt : null,
      category: tx.category || "",
      from: tx.from || "",
      to: tx.to || ""
    };

    elements.qfCatBtnText.textContent = qfEditorState.category || "(None)";
    elements.qfFromBtnText.textContent = qfEditorState.from || "(None)";
    elements.qfToBtnText.textContent = qfEditorState.to || "(None)";

    elements.transactionEditorModal.classList.add("open");
    haptic(15);
  }

  function closeQuickFillEditor() {
    elements.transactionEditorModal.classList.remove("open");
  }

  function saveEditedTransaction() {
    const title = elements.qfTitleInput.value.trim();
    if (!title) {
      haptic([20, 30, 20]);
      highlightError(elements.qfTitleInput);
      elements.qfTitleInput.focus();
      return;
    }

    const amount = qfEditorCents > 0 ? (qfEditorCents / 100) : 0;
    if (amount <= 0) {
      haptic([20, 30, 20]);
      highlightError(elements.qfAmountInput);
      elements.qfAmountInput.focus();
      return;
    }

    const orig = editorTxOriginal || {};
    const updatedDate = editorTxDate || orig.date || getFormattedDate(new Date());
    const isSkip = Boolean(elements.qfSkipToggle && elements.qfSkipToggle.checked);
    const updatedTx = {
      id: orig.id,
      sheetName: orig.sheetName || null,
      row: orig.row,
      date: updatedDate,
      description: title,
      amount: amount,
      category: qfEditorState.category || "",
      from: qfEditorState.from || "",
      to: qfEditorState.to || "",
      skip: isSkip
    };

    // Check if anything actually changed
    const dateChanged = (orig.date || "") !== updatedTx.date;
    const descChanged = (orig.description || "").trim() !== updatedTx.description;
    const amtChanged = Math.abs((parseFloat(orig.amount) || 0) - updatedTx.amount) >= 0.009;
    const catChanged = (orig.category || "") !== updatedTx.category;
    const fromChanged = (orig.from || "") !== updatedTx.from;
    const toChanged = (orig.to || "") !== updatedTx.to;
    const skipChanged = Boolean(orig.skip) !== isSkip;

    if (!dateChanged && !descChanged && !amtChanged && !catChanged && !fromChanged && !toChanged && !skipChanged) {
      closeQuickFillEditor();
      return;
    }

    // 1. Optimistically update local recent transactions list
    const recentList = getRecentTransactions();
    const idx = recentList.findIndex(
      (t) => (t.id && orig.id && t.id === orig.id) ||
             (t.description === orig.description && Math.abs(t.amount - orig.amount) < 0.01 && t.date === orig.date)
    );
    if (idx !== -1) {
      recentList[idx] = { ...recentList[idx], ...updatedTx };
      saveRecentTransactions(recentList);
      renderRecentList();
    }

    // 1b. Optimistically update all transactions list
    const allList = loadAllTransactionsFromStorage();
    const aIdx = allList.findIndex(
      (t) => (t.id && orig.id && t.id === orig.id) ||
             (orig.sheetName && orig.row && t.sheetName === orig.sheetName && t.row === orig.row) ||
             (t.description === orig.description && Math.abs(t.amount - orig.amount) < 0.01 && t.date === orig.date)
    );
    if (aIdx !== -1) {
      allList[aIdx] = { ...allList[aIdx], ...updatedTx };
      saveAllTransactionsToStorage(allList);
      applyAllTxFiltersAndRender(false);
    }

    // 2. If it was pending in the offline queue, update it in place
    const queue = getOfflineQueue();
    const qIdx = queue.findIndex(
      (q) => (q.id && orig.id && q.id === orig.id) ||
             (q.description === orig.description && Math.abs(q.amount - orig.amount) < 0.01 && q.date === orig.date)
    );
    const wasInOfflineQueue = qIdx !== -1;

    if (wasInOfflineQueue) {
      queue[qIdx] = {
        ...queue[qIdx],
        date: updatedTx.date,
        description: updatedTx.description,
        amount: updatedTx.amount,
        category: updatedTx.category,
        from: updatedTx.from,
        to: updatedTx.to,
        skip: updatedTx.skip
      };
      saveOfflineQueue(queue);
      updateQueueUI();
    } else {
      // 3. Dispatch edit to Google Sheet (or queue offline if disconnected)
      if (navigator.onLine && state.scriptUrl) {
        try {
          fetch(state.scriptUrl, {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify({
              action: "edit",
              sheetName: orig.sheetName || null,
              row: orig.row,
              original: orig,
              updated: updatedTx
            })
          });
          setTimeout(() => {
            fetchRecentTransactionsFromSheet();
            if (elements.allTransactionsModal && elements.allTransactionsModal.classList.contains("open")) {
              fetchAllTransactionsFromSheet(false);
            }
          }, 1500);
        } catch (e) {
          console.warn("Could not dispatch edit to sheet, queueing offline:", e);
          enqueueEdit({
            sheetName: orig.sheetName || null,
            row: orig.row,
            original: orig,
            updated: updatedTx
          });
        }
      } else {
        enqueueEdit({
          sheetName: orig.sheetName || null,
          row: orig.row,
          original: orig,
          updated: updatedTx
        });
      }
    }

    editorTxOriginal = { ...orig, ...updatedTx };
    closeQuickFillEditor();
    haptic(15);
    showToast("Transaction updated!", "success");
  }

  function saveQuickFillOption() {
    if (editorMode === "transaction") {
      saveEditedTransaction();
      return;
    }

    const title = elements.qfTitleInput.value.trim();
    if (!title) {
      haptic([20, 30, 20]);
      highlightError(elements.qfTitleInput);
      elements.qfTitleInput.focus();
      return;
    }

    // Parse optional dollar amount (from ATM-style decimal-first entry)
    const amount = qfEditorCents > 0 ? (qfEditorCents / 100) : null;

    const options = getQuickFillOptions();
    if (qfEditorState.id) {
      // Update existing
      const idx = options.findIndex((o) => o.id === qfEditorState.id);
      if (idx !== -1) {
        options[idx] = {
          ...options[idx],
          title,
          amount,
          category: qfEditorState.category,
          from: qfEditorState.from,
          to: qfEditorState.to
        };
      }
    } else {
      // Add new
      options.push({
        id: "qf_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        title,
        amount,
        category: qfEditorState.category,
        from: qfEditorState.from,
        to: qfEditorState.to
      });
    }

    saveQuickFillOptions(options);
    closeQuickFillEditor();
    renderQuickFillSettingsList();
    haptic(15);
    showToast(`Option "${title}" saved to wheel!`, "success");
  }

  // Unified Dialog Date Picker Wiring
  if (elements.btnQfDate) {
    elements.btnQfDate.addEventListener("click", () => {
      if (elements.qfDatePicker) {
        if (elements.qfDatePicker.showPicker) {
          elements.qfDatePicker.showPicker();
        } else {
          elements.qfDatePicker.click();
        }
      }
    });
  }

  if (elements.qfDatePicker) {
    elements.qfDatePicker.addEventListener("change", (e) => {
      if (e.target.value) {
        editorTxDate = e.target.value;
        if (elements.qfDateText) {
          elements.qfDateText.textContent = formatHumanDate(editorTxDate);
        }
      }
    });
  }

  // Quick Fill Option Dialog Button Wiring
  if (elements.btnQfCategory) {
    elements.btnQfCategory.addEventListener("click", () => {
      openPicker("category", false, (val) => {
        qfEditorState.category = val === "(None)" ? "" : val;
        elements.qfCatBtnText.textContent = qfEditorState.category || "(None)";
      }, qfEditorState.category);
    });
  }

  if (elements.btnQfFrom) {
    elements.btnQfFrom.addEventListener("click", () => {
      openPicker("from", false, (val) => {
        qfEditorState.from = val === "(None)" ? "" : val;
        elements.qfFromBtnText.textContent = qfEditorState.from || "(None)";
      }, qfEditorState.from);
    });
  }

  if (elements.btnQfTo) {
    elements.btnQfTo.addEventListener("click", () => {
      openPicker("to", false, (val) => {
        qfEditorState.to = val === "(None)" ? "" : val;
        elements.qfToBtnText.textContent = qfEditorState.to || "(None)";
      }, qfEditorState.to);
    });
  }

  if (elements.btnSaveQuickFillOption) {
    elements.btnSaveQuickFillOption.addEventListener("click", saveQuickFillOption);
  }

  if (elements.qfAmountInput) {
    elements.qfAmountInput.addEventListener("input", handleQfAmountInput);
    elements.qfAmountInput.addEventListener("focus", () => {
      if (qfEditorCents > 0) {
        requestAnimationFrame(() => {
          elements.qfAmountInput.setSelectionRange(
            elements.qfAmountInput.value.length,
            elements.qfAmountInput.value.length
          );
        });
      }
    });
  }

  if (elements.btnDeleteQuickFillOption) {
    elements.btnDeleteQuickFillOption.addEventListener("click", () => {
      if (editorMode === "transaction") {
        closeQuickFillEditor();
        if (editorTxOriginal) {
          undoTransaction(editorTxOriginal);
        }
        return;
      }

      if (qfEditorState.id) {
        haptic(15);
        const filtered = getQuickFillOptions().filter((o) => o.id !== qfEditorState.id);
        saveQuickFillOptions(filtered);
        closeQuickFillEditor();
        renderQuickFillSettingsList();
        showToast("Option deleted.", "info");
      }
    });
  }

  // Pluralization helper
  function formatPresetCount(count) {
    return `${count} ${count === 1 ? "preset" : "presets"}`;
  }

  // Preset Backup & Restore (Export / Import Wheel Presets)
  async function exportQuickFillPresets() {
    const options = getQuickFillOptions();
    if (!options || options.length === 0) {
      showToast("No presets to export.", "info");
      return;
    }

    const jsonStr = JSON.stringify(options, null, 2);

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(jsonStr);
        haptic(15);
        showToast(`Copied ${formatPresetCount(options.length)} to clipboard!`, "success");
        return;
      }
    } catch (e) {
      // Fallback below
    }

    // Fallback: off-screen textarea copy without prompt
    try {
      const t = document.createElement("textarea");
      t.value = jsonStr;
      t.style.position = "fixed";
      t.style.top = "-9999px";
      t.style.left = "-9999px";
      t.style.opacity = "0";
      t.style.pointerEvents = "none";
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      document.body.removeChild(t);
      haptic(15);
      showToast(`Copied ${formatPresetCount(options.length)} to clipboard!`, "success");
    } catch (err) {
      showToast("Unable to copy presets to clipboard.", "error");
    }
  }

  // In-memory conflict resolution queue
  let pendingConflicts = [];
  let pendingNonConflicts = [];

  function openImportModal() {
    pendingConflicts = [];
    pendingNonConflicts = [];
    if (elements.importModalTitle) elements.importModalTitle.textContent = "Import Presets";
    if (elements.importPasteView) elements.importPasteView.style.display = "block";
    if (elements.importConflictView) elements.importConflictView.style.display = "none";
    if (elements.importFallbackContainer) elements.importFallbackContainer.style.display = "none";
    if (elements.importFallbackTextarea) elements.importFallbackTextarea.value = "";
    if (elements.importPresetsModal) elements.importPresetsModal.classList.add("open");
  }

  function closeImportModal() {
    if (elements.importPresetsModal) elements.importPresetsModal.classList.remove("open");
  }

  async function handlePasteClipboardClick() {
    haptic(15);
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          processImportData(text.trim());
          return;
        }
      }
    } catch (err) {
      console.warn("Clipboard read error or denied:", err);
    }

    // If direct clipboard reading is unavailable or blocked by browser permissions,
    // gracefully show the clean in-app fallback textarea
    if (elements.importFallbackContainer) {
      elements.importFallbackContainer.style.display = "block";
      if (elements.importFallbackTextarea) {
        elements.importFallbackTextarea.focus();
      }
      showToast("Clipboard blocked. Paste text manually below.", "info");
    }
  }

  function handleFallbackImportSubmit() {
    const text = elements.importFallbackTextarea ? elements.importFallbackTextarea.value.trim() : "";
    if (!text) {
      showToast("Please paste preset data first.", "info");
      return;
    }
    processImportData(text);
  }

  function formatPresetDetails(p) {
    const amtStr = p.amount && p.amount > 0 ? `$${p.amount.toFixed(2)}` : "No amt";
    const catStr = p.category || "No cat";
    const routeStr = (p.from || p.to) ? `${p.from || "Any"} → ${p.to || "Any"}` : "";
    return routeStr ? `${amtStr} • ${catStr} • ${routeStr}` : `${amtStr} • ${catStr}`;
  }

  function processImportData(jsonText) {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error("Invalid format: expected array.");
      }

      const validPresets = [];
      parsed.forEach((item) => {
        if (!item || typeof item !== "object") return;
        const title = String(item.title || "").trim();
        if (!title) return;

        validPresets.push({
          id: item.id || ("qf_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5)),
          title: title,
          amount: typeof item.amount === "number" && item.amount > 0 ? item.amount : null,
          category: typeof item.category === "string" ? item.category : "",
          from: typeof item.from === "string" ? item.from : "",
          to: typeof item.to === "string" ? item.to : ""
        });
      });

      if (validPresets.length === 0) {
        haptic([20, 30, 20]);
        showToast("No valid presets found.", "error");
        return;
      }

      const existing = getQuickFillOptions();

      // Detect conflicts based on identical title/description (case-insensitive)
      const existingMap = new Map();
      existing.forEach((p) => {
        existingMap.set(p.title.trim().toLowerCase(), p);
      });

      const conflicts = [];
      const nonConflicts = [];

      validPresets.forEach((incoming) => {
        const key = incoming.title.trim().toLowerCase();
        if (existingMap.has(key)) {
          conflicts.push({
            incoming: incoming,
            existing: existingMap.get(key),
            choice: "replace" // Default to replace incoming
          });
        } else {
          nonConflicts.push(incoming);
        }
      });

      // Scenario A: No conflicts at all!
      if (conflicts.length === 0) {
        const finalPresets = [...existing, ...nonConflicts];
        saveQuickFillOptions(finalPresets);
        renderQuickFillSettingsList();
        updateWheelVisibility();
        closeImportModal();
        haptic(15);
        showToast(`Imported ${formatPresetCount(validPresets.length)} successfully!`, "success");
        return;
      }

      // Scenario B: 1+ conflicts exist. Show Conflict Resolution View!
      pendingConflicts = conflicts;
      pendingNonConflicts = nonConflicts;
      renderConflictList();

      if (elements.importPasteView) elements.importPasteView.style.display = "none";
      if (elements.importConflictView) elements.importConflictView.style.display = "flex";
      if (elements.importModalTitle) elements.importModalTitle.textContent = "Resolve Conflicts";
      if (elements.conflictSummaryText) {
        elements.conflictSummaryText.textContent = `${formatPresetCount(conflicts.length)} already exist:`;
      }
      haptic(15);
    } catch (err) {
      console.error("Import parse error:", err);
      haptic([20, 30, 20]);
      showToast("Invalid JSON data. Import failed.", "error");
    }
  }

  function renderConflictList() {
    if (!elements.conflictList) return;
    elements.conflictList.innerHTML = "";

    pendingConflicts.forEach((conflict, index) => {
      const card = document.createElement("div");
      card.className = "conflict-item";
      card.dataset.index = index;

      // Title
      const title = document.createElement("div");
      title.className = "conflict-item-title";
      title.textContent = conflict.incoming.title;

      // Comparison Box
      const comp = document.createElement("div");
      comp.className = "conflict-comparison";

      // Row: Existing
      const existingRow = document.createElement("div");
      existingRow.className = "conflict-row";
      existingRow.innerHTML = `
        <span class="conflict-tag existing">Existing</span>
        <span class="conflict-details" title="${formatPresetDetails(conflict.existing)}">${formatPresetDetails(conflict.existing)}</span>
      `;

      // Row: Incoming
      const incomingRow = document.createElement("div");
      incomingRow.className = "conflict-row";
      incomingRow.innerHTML = `
        <span class="conflict-tag incoming">Imported</span>
        <span class="conflict-details" title="${formatPresetDetails(conflict.incoming)}">${formatPresetDetails(conflict.incoming)}</span>
      `;

      comp.appendChild(existingRow);
      comp.appendChild(incomingRow);

      // Segmented Toggle Group
      const group = document.createElement("div");
      group.className = "conflict-toggle-group";

      const keepBtn = document.createElement("button");
      keepBtn.type = "button";
      keepBtn.className = `conflict-choice-btn ${conflict.choice === "keep" ? "active" : ""}`;
      keepBtn.dataset.choice = "keep";
      keepBtn.textContent = "Keep Existing";

      const replaceBtn = document.createElement("button");
      replaceBtn.type = "button";
      replaceBtn.className = `conflict-choice-btn ${conflict.choice === "replace" ? "active" : ""}`;
      replaceBtn.dataset.choice = "replace";
      replaceBtn.textContent = "Replace";

      keepBtn.addEventListener("click", () => {
        haptic(10);
        conflict.choice = "keep";
        keepBtn.classList.add("active");
        replaceBtn.classList.remove("active");
      });

      replaceBtn.addEventListener("click", () => {
        haptic(10);
        conflict.choice = "replace";
        replaceBtn.classList.add("active");
        keepBtn.classList.remove("active");
      });

      group.appendChild(keepBtn);
      group.appendChild(replaceBtn);

      card.appendChild(title);
      card.appendChild(comp);
      card.appendChild(group);

      elements.conflictList.appendChild(card);
    });
  }

  function setAllConflictsChoice(choice) {
    haptic(15);
    pendingConflicts.forEach((c) => {
      c.choice = choice;
    });
    if (elements.conflictList) {
      const cards = elements.conflictList.querySelectorAll(".conflict-item");
      cards.forEach((card) => {
        const keepBtn = card.querySelector('.conflict-choice-btn[data-choice="keep"]');
        const replaceBtn = card.querySelector('.conflict-choice-btn[data-choice="replace"]');
        if (keepBtn && replaceBtn) {
          if (choice === "keep") {
            keepBtn.classList.add("active");
            replaceBtn.classList.remove("active");
          } else {
            replaceBtn.classList.add("active");
            keepBtn.classList.remove("active");
          }
        }
      });
    }
  }

  function applyConflictResolution() {
    const existing = getQuickFillOptions();
    
    // Map existing items by lowercase title
    const finalMap = new Map();
    existing.forEach((p) => {
      finalMap.set(p.title.trim().toLowerCase(), p);
    });

    // Apply user choice for each conflict
    pendingConflicts.forEach((c) => {
      const key = c.incoming.title.trim().toLowerCase();
      if (c.choice === "replace") {
        // Replace with imported data while keeping original id for continuity
        finalMap.set(key, {
          ...c.incoming,
          id: (finalMap.get(key) && finalMap.get(key).id) || c.incoming.id
        });
      }
      // If "keep", finalMap already has existing item unchanged!
    });

    // Append non-conflicting new items
    pendingNonConflicts.forEach((p) => {
      const key = p.title.trim().toLowerCase();
      if (!finalMap.has(key)) {
        finalMap.set(key, p);
      }
    });

    const finalPresets = Array.from(finalMap.values());
    saveQuickFillOptions(finalPresets);
    renderQuickFillSettingsList();
    updateWheelVisibility();
    closeImportModal();
    haptic(15);
    showToast(`Import finished! ${formatPresetCount(finalPresets.length)} ready.`, "success");
  }

  if (elements.btnExportPresets) {
    elements.btnExportPresets.addEventListener("click", exportQuickFillPresets);
  }

  if (elements.btnImportPresets) {
    elements.btnImportPresets.addEventListener("click", openImportModal);
  }

  if (elements.btnCloseImportPresets) {
    elements.btnCloseImportPresets.addEventListener("click", closeImportModal);
  }

  if (elements.btnPasteClipboard) {
    elements.btnPasteClipboard.addEventListener("click", handlePasteClipboardClick);
  }

  if (elements.btnSubmitFallbackImport) {
    elements.btnSubmitFallbackImport.addEventListener("click", handleFallbackImportSubmit);
  }

  if (elements.btnConflictKeepAll) {
    elements.btnConflictKeepAll.addEventListener("click", () => setAllConflictsChoice("keep"));
  }

  if (elements.btnConflictReplaceAll) {
    elements.btnConflictReplaceAll.addEventListener("click", () => setAllConflictsChoice("replace"));
  }

  if (elements.btnApplyConflictResolution) {
    elements.btnApplyConflictResolution.addEventListener("click", applyConflictResolution);
  }

  if (elements.importPresetsModal) {
    elements.importPresetsModal.addEventListener("click", (e) => {
      if (e.target === elements.importPresetsModal) closeImportModal();
    });
  }

  if (elements.btnOpenQuickFillSettings) {
    elements.btnOpenQuickFillSettings.addEventListener("click", () => {
      closeSettings();
      openQuickFillSettings();
    });
  }

  if (elements.btnCloseQuickFillSettings) {
    elements.btnCloseQuickFillSettings.addEventListener("click", closeQuickFillSettings);
  }

  if (elements.btnAddQuickFillOption) {
    elements.btnAddQuickFillOption.addEventListener("click", () => openQuickFillEditor());
  }

  if (elements.btnCloseQuickFillEditor) {
    elements.btnCloseQuickFillEditor.addEventListener("click", closeQuickFillEditor);
  }

  if (elements.quickFillSettingsModal) {
    elements.quickFillSettingsModal.addEventListener("click", (e) => {
      if (e.target === elements.quickFillSettingsModal) closeQuickFillSettings();
    });
  }

  if (elements.transactionEditorModal) {
    elements.transactionEditorModal.addEventListener("click", (e) => {
      if (e.target === elements.transactionEditorModal) closeQuickFillEditor();
    });
  }

  // ==========================================================================
  // All Transactions Full-Screen Feed & Multi-Year Management (v73)
  // ==========================================================================

  const ALL_TXS_KEY = "budget_all_txs";
  let allTransactionsList = [];
  let filteredTransactionsList = [];
  let allTxRenderOffset = 0;
  const ALL_TX_CHUNK_SIZE = 50;
  let allTxObserver = null;
  let searchDebounceTimer = null;
  let lastRenderedDate = null;
  let isFetchingAllTx = false;

  const allTxFilterState = {
    search: "",
    startDate: "",
    endDate: "",
    minCents: 0,
    maxCents: 0,
    category: "",
    from: "",
    to: "",
    hideSetup: true
  };

  const filterDraftState = {
    startDate: "",
    endDate: "",
    minCents: 0,
    maxCents: 0,
    category: "",
    from: "",
    to: "",
    hideSetup: true
  };

  function loadAllTransactionsFromStorage() {
    try {
      const raw = localStorage.getItem(ALL_TXS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          allTransactionsList = parsed;
          return allTransactionsList;
        }
      }
    } catch (e) {
      console.warn("Failed to load cached all transactions", e);
    }
    allTransactionsList = [];
    return allTransactionsList;
  }

  function saveAllTransactionsToStorage(txs) {
    try {
      allTransactionsList = Array.isArray(txs) ? txs : [];
      localStorage.setItem(ALL_TXS_KEY, JSON.stringify(allTransactionsList));
    } catch (e) {
      console.warn("Failed to save all transactions to cache", e);
    }
  }

  function addToAllTransactions(tx) {
    const list = loadAllTransactionsFromStorage();
    const item = {
      id: tx.id || ("tx_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6)),
      sheetName: tx.sheetName || null,
      row: tx.row || null,
      date: tx.date || getFormattedDate(new Date()),
      description: tx.description || "Untitled",
      category: tx.category || "",
      from: tx.from || "",
      to: tx.to || "",
      amount: parseFloat(tx.amount) || 0,
      timestamp: Date.now()
    };
    list.unshift(item);
    saveAllTransactionsToStorage(list);
    if (elements.allTransactionsModal && elements.allTransactionsModal.classList.contains("open")) {
      applyAllTxFiltersAndRender(false);
    }
  }

  function removeFromAllTransactions(item) {
    const list = loadAllTransactionsFromStorage();
    const filtered = list.filter((t) => {
      if (item.id && t.id && t.id === item.id) return false;
      if (item.sheetName && item.row && t.sheetName === item.sheetName && t.row === item.row) return false;
      if (item.description === t.description && Math.abs(item.amount - t.amount) < 0.01 && item.date === t.date) return false;
      return true;
    });
    saveAllTransactionsToStorage(filtered);
    if (elements.allTransactionsModal && elements.allTransactionsModal.classList.contains("open")) {
      applyAllTxFiltersAndRender(false);
    }
  }

  async function fetchAllTransactionsFromSheet(showFeedback = false) {
    if (!state.scriptUrl) {
      if (showFeedback) showToast("Google Script URL not configured", "error");
      return;
    }
    if (!navigator.onLine) {
      if (showFeedback) showToast("Offline: showing cached transactions.", "info");
      return;
    }
    if (isFetchingAllTx) return;

    isFetchingAllTx = true;
    if (elements.btnRefreshAllTx) {
      elements.btnRefreshAllTx.classList.add("rotating");
    }

    try {
      const url = `${state.scriptUrl}${state.scriptUrl.includes("?") ? "&" : "?"}action=all&t=${Date.now()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.transactions)) {
        saveAllTransactionsToStorage(data.transactions);
        applyAllTxFiltersAndRender(false);
        if (showFeedback) showToast(`Synced ${data.transactions.length} transactions from Sheet`, "success");
      } else if (showFeedback) {
        showToast("No transactions found in Sheet.", "info");
      }
    } catch (err) {
      console.warn("Error fetching all transactions:", err);
      if (showFeedback) showToast("Could not sync with sheet (offline?)", "error");
    } finally {
      isFetchingAllTx = false;
      if (elements.btnRefreshAllTx) {
        elements.btnRefreshAllTx.classList.remove("rotating");
      }
    }
  }

  function formatCurrency(val) {
    const num = parseFloat(val) || 0;
    return "$" + num.toFixed(2);
  }

  function matchesFilter(tx) {
    if (!tx) return false;

    // 0. Hide Setup Transactions
    if (allTxFilterState.hideSetup) {
      if ((tx.description || "").trim().toLowerCase() === "setup") {
        return false;
      }
    }

    // 1. Text search
    if (allTxFilterState.search) {
      const q = allTxFilterState.search.toLowerCase().trim();
      const desc = String(tx.description || "").toLowerCase();
      const cat = String(tx.category || "").toLowerCase();
      const from = String(tx.from || "").toLowerCase();
      const to = String(tx.to || "").toLowerCase();
      const dateStr = String(tx.date || "");
      const humanDate = formatHumanDate(dateStr).toLowerCase();
      const amtStr = String(tx.amount || "");
      
      const match = desc.includes(q) || cat.includes(q) || from.includes(q) || 
                    to.includes(q) || dateStr.includes(q) || humanDate.includes(q) ||
                    amtStr.includes(q);
      if (!match) return false;
    }

    // 2. Date Range
    if (allTxFilterState.startDate && tx.date) {
      if (tx.date < allTxFilterState.startDate) return false;
    }
    if (allTxFilterState.endDate && tx.date) {
      if (tx.date > allTxFilterState.endDate) return false;
    }

    // 3. Amount Range
    if (allTxFilterState.minCents > 0) {
      const txCents = Math.round((parseFloat(tx.amount) || 0) * 100);
      if (txCents < allTxFilterState.minCents) return false;
    }
    if (allTxFilterState.maxCents > 0) {
      const txCents = Math.round((parseFloat(tx.amount) || 0) * 100);
      if (txCents > allTxFilterState.maxCents) return false;
    }

    // 4. Category
    if (allTxFilterState.category && allTxFilterState.category !== "(All)" && allTxFilterState.category !== "(None)") {
      if (tx.category !== allTxFilterState.category) return false;
    }

    // 5. From Account
    if (allTxFilterState.from && allTxFilterState.from !== "(All)" && allTxFilterState.from !== "(None)") {
      if (tx.from !== allTxFilterState.from) return false;
    }

    // 6. To Account
    if (allTxFilterState.to && allTxFilterState.to !== "(All)" && allTxFilterState.to !== "(None)") {
      if (tx.to !== allTxFilterState.to) return false;
    }

    return true;
  }

  function formatDateSeparator(dateStr) {
    if (!dateStr) return "Unknown Date";
    const todayStr = getFormattedDate(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getFormattedDate(yesterday);

    const pretty = formatHumanDate(dateStr);
    if (dateStr === todayStr) {
      return `Today · ${pretty}`;
    }
    if (dateStr === yesterdayStr) {
      return `Yesterday · ${pretty}`;
    }
    return pretty;
  }

  function isAnyFilterActive() {
    return Boolean(
      allTxFilterState.startDate ||
      allTxFilterState.endDate ||
      allTxFilterState.minCents > 0 ||
      allTxFilterState.maxCents > 0 ||
      (allTxFilterState.category && allTxFilterState.category !== "(All)" && allTxFilterState.category !== "(None)") ||
      (allTxFilterState.from && allTxFilterState.from !== "(All)" && allTxFilterState.from !== "(None)") ||
      (allTxFilterState.to && allTxFilterState.to !== "(All)" && allTxFilterState.to !== "(None)") ||
      !allTxFilterState.hideSetup
    );
  }

  function updateFilterButtonActiveState() {
    const hasFilter = isAnyFilterActive();
    if (elements.btnOpenAllTxFilter) {
      elements.btnOpenAllTxFilter.classList.toggle("has-filter", hasFilter);
    }
  }

  function applyAllTxFiltersAndRender(resetScroll = true) {
    if (!elements.allTransactionsContainer) return;
    filteredTransactionsList = allTransactionsList.filter(matchesFilter);

    if (elements.allTxCountBadge) {
      elements.allTxCountBadge.textContent = filteredTransactionsList.length;
    }

    updateFilterButtonActiveState();

    allTxRenderOffset = 0;
    lastRenderedDate = null;
    elements.allTransactionsContainer.innerHTML = "";

    if (filteredTransactionsList.length === 0) {
      const empty = document.createElement("div");
      empty.className = "recent-empty";
      empty.style.padding = "40px 16px";
      empty.textContent = allTransactionsList.length === 0 
        ? "No transactions found." 
        : "No transactions match your search/filters.";
      elements.allTransactionsContainer.appendChild(empty);
      return;
    }

    appendNextAllTxChunk();

    if (resetScroll && elements.allTransactionsContainer) {
      elements.allTransactionsContainer.scrollTop = 0;
    }
  }

  function appendNextAllTxChunk() {
    if (!elements.allTransactionsContainer) return;
    if (allTxRenderOffset >= filteredTransactionsList.length) return;

    const chunk = filteredTransactionsList.slice(allTxRenderOffset, allTxRenderOffset + ALL_TX_CHUNK_SIZE);
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < chunk.length; i++) {
      try {
        const item = chunk[i];
        const itemDate = item.date || "";

        // Check if we need a date separator header
        if (itemDate !== lastRenderedDate) {
          lastRenderedDate = itemDate;
          const sep = document.createElement("div");
          sep.className = "all-tx-date-separator";
          
          const textSpan = document.createElement("span");
          textSpan.className = "all-tx-date-text";
          textSpan.textContent = formatDateSeparator(itemDate);
          sep.appendChild(textSpan);

          const lineSpan = document.createElement("div");
          lineSpan.className = "all-tx-date-line";
          sep.appendChild(lineSpan);

          fragment.appendChild(sep);
        }

        // Transaction row
        const row = createTransactionRow(item);
        fragment.appendChild(row);
      } catch (rowErr) {
        console.error("Error rendering transaction row:", rowErr);
      }
    }

    elements.allTransactionsContainer.appendChild(fragment);
    if (elements.allTxSentinel) {
      elements.allTransactionsContainer.appendChild(elements.allTxSentinel);
    }
    allTxRenderOffset += chunk.length;
  }

  function setupAllTxObserver() {
    if (allTxObserver) {
      try {
        allTxObserver.disconnect();
      } catch (e) {}
    }
    if (!elements.allTxSentinel) return;

    try {
      allTxObserver = new IntersectionObserver((entries) => {
        if (entries[0] && entries[0].isIntersecting) {
          appendNextAllTxChunk();
        }
      }, {
        root: null,
        rootMargin: "300px"
      });

      allTxObserver.observe(elements.allTxSentinel);
    } catch (e) {
      console.warn("IntersectionObserver init error:", e);
    }
  }

  function resetAllTxFilters() {
    allTxFilterState.startDate = "";
    allTxFilterState.endDate = "";
    allTxFilterState.minCents = 0;
    allTxFilterState.maxCents = 0;
    allTxFilterState.category = "";
    allTxFilterState.from = "";
    allTxFilterState.to = "";
    allTxFilterState.hideSetup = true;
    syncDraftWithActiveFilter();
    updateFilterModalUI();
    applyAllTxFiltersAndRender(true);
    haptic(15);
  }

  function openAllTxFilterModal() {
    syncDraftWithActiveFilter();
    updateFilterModalUI();
    elements.allTxFilterModal.classList.add("open");
  }

  function closeAllTxFilterModal() {
    elements.allTxFilterModal.classList.remove("open");
  }

  function syncDraftWithActiveFilter() {
    filterDraftState.startDate = allTxFilterState.startDate;
    filterDraftState.endDate = allTxFilterState.endDate;
    filterDraftState.minCents = allTxFilterState.minCents;
    filterDraftState.maxCents = allTxFilterState.maxCents;
    filterDraftState.category = allTxFilterState.category;
    filterDraftState.from = allTxFilterState.from;
    filterDraftState.to = allTxFilterState.to;
    filterDraftState.hideSetup = allTxFilterState.hideSetup !== false;
  }

  function updateFilterModalUI() {
    if (elements.filterStartDateText) {
      elements.filterStartDateText.textContent = filterDraftState.startDate 
        ? formatHumanDate(filterDraftState.startDate) 
        : "Start Date";
      elements.filterStartDateText.classList.toggle("placeholder", !filterDraftState.startDate);
    }
    if (elements.filterStartDatePicker) {
      elements.filterStartDatePicker.value = filterDraftState.startDate || "";
    }

    if (elements.filterEndDateText) {
      elements.filterEndDateText.textContent = filterDraftState.endDate 
        ? formatHumanDate(filterDraftState.endDate) 
        : "End Date";
      elements.filterEndDateText.classList.toggle("placeholder", !filterDraftState.endDate);
    }
    if (elements.filterEndDatePicker) {
      elements.filterEndDatePicker.value = filterDraftState.endDate || "";
    }

    if (elements.filterMinAmount) {
      elements.filterMinAmount.value = filterDraftState.minCents > 0 
        ? formatCentsWithCommas(filterDraftState.minCents) 
        : "";
    }
    if (elements.filterMaxAmount) {
      elements.filterMaxAmount.value = filterDraftState.maxCents > 0 
        ? formatCentsWithCommas(filterDraftState.maxCents) 
        : "";
    }

    if (elements.filterCatText) {
      elements.filterCatText.textContent = filterDraftState.category || "(None)";
      elements.filterCatText.classList.toggle("placeholder", !filterDraftState.category || filterDraftState.category === "(None)");
    }
    if (elements.filterFromText) {
      elements.filterFromText.textContent = filterDraftState.from || "(None)";
      elements.filterFromText.classList.toggle("placeholder", !filterDraftState.from || filterDraftState.from === "(None)");
    }
    if (elements.filterToText) {
      elements.filterToText.textContent = filterDraftState.to || "(None)";
      elements.filterToText.classList.toggle("placeholder", !filterDraftState.to || filterDraftState.to === "(None)");
    }

    if (elements.filterHideSetup) {
      elements.filterHideSetup.checked = filterDraftState.hideSetup !== false;
    }
  }

  function applyFilterModal() {
    allTxFilterState.startDate = filterDraftState.startDate;
    allTxFilterState.endDate = filterDraftState.endDate;
    allTxFilterState.minCents = filterDraftState.minCents;
    allTxFilterState.maxCents = filterDraftState.maxCents;
    allTxFilterState.category = filterDraftState.category;
    allTxFilterState.from = filterDraftState.from;
    allTxFilterState.to = filterDraftState.to;
    allTxFilterState.hideSetup = filterDraftState.hideSetup !== false;

    closeAllTxFilterModal();
    applyAllTxFiltersAndRender(true);
    haptic(15);
  }

  function openAllTransactionsPage() {
    haptic(15);
    if (elements.allTransactionsModal) {
      elements.allTransactionsModal.classList.add("open");
    }

    try {
      loadAllTransactionsFromStorage();
      setupAllTxObserver();
      applyAllTxFiltersAndRender(true);
    } catch (err) {
      console.error("Error opening all transactions page:", err);
    }

    // Background sync from sheet
    try {
      fetchAllTransactionsFromSheet(false);
    } catch (e) {
      console.warn("fetchAllTransactionsFromSheet error:", e);
    }
  }

  function closeAllTransactionsPage() {
    if (elements.allTransactionsModal) {
      elements.allTransactionsModal.classList.remove("open");
    }
  }

  // Wiring All Transactions & Filter Listeners
  if (elements.btnSeeAllTransactions) {
    elements.btnSeeAllTransactions.addEventListener("click", (e) => {
      e.preventDefault();
      openAllTransactionsPage();
    });
  }

  // Backup event delegation in case DOM event bubbling or dynamic container replacement occurs
  if (elements.recentModal) {
    elements.recentModal.addEventListener("click", (e) => {
      const btn = e.target.closest("#btnSeeAllTransactions");
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        openAllTransactionsPage();
      }
    });
  }

  // Backup scroll-based chunk loading for All Transactions container
  if (elements.allTransactionsContainer) {
    elements.allTransactionsContainer.addEventListener("scroll", () => {
      const el = elements.allTransactionsContainer;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 250) {
        appendNextAllTxChunk();
      }
    }, { passive: true });
  }

  if (elements.btnBackToRecent) {
    elements.btnBackToRecent.addEventListener("click", closeAllTransactionsPage);
  }

  if (elements.btnRefreshAllTx) {
    elements.btnRefreshAllTx.addEventListener("click", () => {
      fetchAllTransactionsFromSheet(true);
    });
  }

  if (elements.btnOpenAllTxFilter) {
    elements.btnOpenAllTxFilter.addEventListener("click", openAllTxFilterModal);
  }

  if (elements.btnCloseAllTxFilter) {
    elements.btnCloseAllTxFilter.addEventListener("click", closeAllTxFilterModal);
  }

  if (elements.allTxFilterModal) {
    elements.allTxFilterModal.addEventListener("click", (e) => {
      if (e.target === elements.allTxFilterModal) closeAllTxFilterModal();
    });
  }

  if (elements.btnApplyAllTxFilters) {
    elements.btnApplyAllTxFilters.addEventListener("click", applyFilterModal);
  }

  if (elements.btnResetAllTxFilters) {
    elements.btnResetAllTxFilters.addEventListener("click", resetAllTxFilters);
  }

  // Date pickers in Filter Modal
  if (elements.btnFilterStartDate) {
    elements.btnFilterStartDate.addEventListener("click", () => {
      if (elements.filterStartDatePicker) {
        if (elements.filterStartDatePicker.showPicker) {
          elements.filterStartDatePicker.showPicker();
        } else {
          elements.filterStartDatePicker.click();
        }
      }
    });
  }

  if (elements.filterStartDatePicker) {
    elements.filterStartDatePicker.addEventListener("change", (e) => {
      filterDraftState.startDate = e.target.value || "";
      if (elements.filterStartDateText) {
        elements.filterStartDateText.textContent = filterDraftState.startDate 
          ? formatHumanDate(filterDraftState.startDate) 
          : "Start Date";
        elements.filterStartDateText.classList.toggle("placeholder", !filterDraftState.startDate);
      }
    });
  }

  if (elements.btnFilterEndDate) {
    elements.btnFilterEndDate.addEventListener("click", () => {
      if (elements.filterEndDatePicker) {
        if (elements.filterEndDatePicker.showPicker) {
          elements.filterEndDatePicker.showPicker();
        } else {
          elements.filterEndDatePicker.click();
        }
      }
    });
  }

  if (elements.filterEndDatePicker) {
    elements.filterEndDatePicker.addEventListener("change", (e) => {
      filterDraftState.endDate = e.target.value || "";
      if (elements.filterEndDateText) {
        elements.filterEndDateText.textContent = filterDraftState.endDate 
          ? formatHumanDate(filterDraftState.endDate) 
          : "End Date";
        elements.filterEndDateText.classList.toggle("placeholder", !filterDraftState.endDate);
      }
    });
  }

  // Amounts in Filter Modal
  if (elements.filterMinAmount) {
    elements.filterMinAmount.addEventListener("input", () => {
      filterDraftState.minCents = parseAtmCents(elements.filterMinAmount.value);
      elements.filterMinAmount.value = filterDraftState.minCents > 0 ? formatCentsWithCommas(filterDraftState.minCents) : "";
    });
  }

  if (elements.filterMaxAmount) {
    elements.filterMaxAmount.addEventListener("input", () => {
      filterDraftState.maxCents = parseAtmCents(elements.filterMaxAmount.value);
      elements.filterMaxAmount.value = filterDraftState.maxCents > 0 ? formatCentsWithCommas(filterDraftState.maxCents) : "";
    });
  }

  // Category, From, To pickers in Filter Modal
  if (elements.btnFilterCategory) {
    elements.btnFilterCategory.addEventListener("click", () => {
      openPicker("category", false, (val) => {
        const choice = (val === "(None)" || !val) ? "" : val;
        filterDraftState.category = choice;
        if (elements.filterCatText) {
          elements.filterCatText.textContent = choice || "(None)";
          elements.filterCatText.classList.toggle("placeholder", !choice);
        }
      }, filterDraftState.category || "(None)");
    });
  }

  if (elements.btnFilterFrom) {
    elements.btnFilterFrom.addEventListener("click", () => {
      openPicker("from", false, (val) => {
        const choice = (val === "(None)" || !val) ? "" : val;
        filterDraftState.from = choice;
        if (elements.filterFromText) {
          elements.filterFromText.textContent = choice || "(None)";
          elements.filterFromText.classList.toggle("placeholder", !choice);
        }
      }, filterDraftState.from || "(None)");
    });
  }

  if (elements.btnFilterTo) {
    elements.btnFilterTo.addEventListener("click", () => {
      openPicker("to", false, (val) => {
        const choice = (val === "(None)" || !val) ? "" : val;
        filterDraftState.to = choice;
        if (elements.filterToText) {
          elements.filterToText.textContent = choice || "(None)";
          elements.filterToText.classList.toggle("placeholder", !choice);
        }
      }, filterDraftState.to || "(None)");
    });
  }

  // Hide Setup Transactions toggle in Filter Modal
  if (elements.filterHideSetup) {
    elements.filterHideSetup.addEventListener("change", (e) => {
      filterDraftState.hideSetup = e.target.checked;
    });
  }

  // Search input & clear button
  if (elements.allTxSearchInput) {
    elements.allTxSearchInput.addEventListener("input", () => {
      const q = elements.allTxSearchInput.value;
      if (elements.btnClearAllTxSearch) {
        elements.btnClearAllTxSearch.style.display = q ? "block" : "none";
      }
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        allTxFilterState.search = q;
        applyAllTxFiltersAndRender(true);
      }, 150);
    });
  }

  if (elements.btnClearAllTxSearch) {
    elements.btnClearAllTxSearch.addEventListener("click", () => {
      elements.allTxSearchInput.value = "";
      elements.btnClearAllTxSearch.style.display = "none";
      allTxFilterState.search = "";
      applyAllTxFiltersAndRender(true);
    });
  }

  // Register Service Worker for PWA (Firefox / Chrome / Safari)
  if ("serviceWorker" in navigator) {
    const registerSW = () => {
      navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).then((reg) => {
        if (navigator.onLine) {
          reg.update();
        }
      }).catch((err) => {
        console.log("ServiceWorker registration skipped/failed:", err);
      });
    };

    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
    }
  }

  // Init
  initTheme();
  setDate(getFormattedDate(new Date()));
  updateAllButtons();
  updateDefaultButtons();
  updateQueueUI();
  updateWheelVisibility();
  initWheelEvents();

  if (state.scriptUrl) {
    if (navigator.onLine) {
      syncOptions(false);
      processOfflineQueue();
    } else {
      const queue = getOfflineQueue();
      updateStatus("", queue.length > 0 ? `Offline (${queue.length} pending)` : (state.sheetName ? `Offline (${state.sheetName})` : "Offline"));
    }
  } else {
    updateStatus("", "Tap ⚙ to connect sheet");
  }
})();

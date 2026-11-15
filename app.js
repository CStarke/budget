/**
 * Budget Mobile App - Core Logic
 */

(function () {
  "use strict";

  // State
  const state = {
    scriptUrl: localStorage.getItem("budget_script_url") || "",
    sheetName: localStorage.getItem("budget_sheet_name") || "Budget",
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
    pickerTitle: document.getElementById("pickerTitle"),
    pickerList: document.getElementById("pickerList"),
    pickerCancelBtn: document.getElementById("pickerCancelBtn"),
    btnSubmit: document.getElementById("btnSubmit"),
    btnSubmitText: document.getElementById("btnSubmitText"),
    toast: document.getElementById("toast"),
    toastIcon: document.getElementById("toastIcon"),
    toastMessage: document.getElementById("toastMessage"),
    btnOpenSettings: document.getElementById("btnOpenSettings"),
    btnCloseSettings: document.getElementById("btnCloseSettings"),
    settingsModal: document.getElementById("settingsModal"),
    scriptUrlInput: document.getElementById("scriptUrlInput"),
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
    descInputWrapper: document.getElementById("descInputWrapper"),
    quickWheelWrapper: document.getElementById("quickWheelWrapper"),
    wheelCylinder: document.getElementById("wheelCylinder"),
    btnWheelReset: document.getElementById("btnWheelReset"),
    btnOpenQuickFillSettings: document.getElementById("btnOpenQuickFillSettings"),
    quickFillSettingsModal: document.getElementById("quickFillSettingsModal"),
    btnCloseQuickFillSettings: document.getElementById("btnCloseQuickFillSettings"),
    btnAddQuickFillOption: document.getElementById("btnAddQuickFillOption"),
    qfSortableList: document.getElementById("qfSortableList"),
    qfEmptyHint: document.getElementById("qfEmptyHint"),
    quickFillEditorModal: document.getElementById("quickFillEditorModal"),
    qfEditorTitle: document.getElementById("qfEditorTitle"),
    btnCloseQuickFillEditor: document.getElementById("btnCloseQuickFillEditor"),
    qfTitleInput: document.getElementById("qfTitleInput"),
    qfAmountInput: document.getElementById("qfAmountInput"),
    btnQfCategory: document.getElementById("btnQfCategory"),
    qfCatBtnText: document.getElementById("qfCatBtnText"),
    btnQfFrom: document.getElementById("btnQfFrom"),
    qfFromBtnText: document.getElementById("qfFromBtnText"),
    btnQfTo: document.getElementById("btnQfTo"),
    qfToBtnText: document.getElementById("qfToBtnText"),
    btnSaveQuickFillOption: document.getElementById("btnSaveQuickFillOption"),
    btnDeleteQuickFillOption: document.getElementById("btnDeleteQuickFillOption")
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
  function updateButtonDisplay(textElem, buttonElem, value) {
    if (!textElem || !buttonElem) return;
    if (value && String(value).trim().length > 0) {
      textElem.textContent = value;
      textElem.className = "pill-text selected";
      buttonElem.classList.add("has-value");
      buttonElem.classList.add("active");
    } else {
      textElem.textContent = "Select one";
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

  function openPicker(field, isDefault = false, onSelectCallback = null) {
    activePickerField = field;
    elements.pickerList.innerHTML = "";

    let items = [];
    let currentValue = "";

    if (field === "category") {
      items = [...(state.options.category.length > 0 ? state.options.category : DEFAULT_OPTIONS.category)];
      currentValue = isDefault ? state.defaults.category : state.selectedCategory;
    } else if (field === "from") {
      items = [...(state.options.from.length > 0 ? state.options.from : DEFAULT_OPTIONS.from)];
      currentValue = isDefault ? state.defaults.from : state.selectedFrom;
    } else if (field === "to") {
      items = [...(state.options.to.length > 0 ? state.options.to : DEFAULT_OPTIONS.to)];
      currentValue = isDefault ? state.defaults.to : state.selectedTo;
    }

    if (isDefault || onSelectCallback) {
      items.push("(None)");
      if (!currentValue) {
        currentValue = "(None)";
      }
    }

    if (elements.pickerTitle) {
      elements.pickerTitle.textContent = "";
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

        if (!isDefault) {
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
        if (data.options.category && data.options.category.length > 0) {
          state.options.category = data.options.category;
          localStorage.setItem("budget_options_cat", JSON.stringify(data.options.category));
        }
        if (data.options.from && data.options.from.length > 0) {
          state.options.from = data.options.from;
          localStorage.setItem("budget_options_from", JSON.stringify(data.options.from));
        }
        if (data.options.to && data.options.to.length > 0) {
          state.options.to = data.options.to;
          localStorage.setItem("budget_options_to", JSON.stringify(data.options.to));
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

  // Handle ATM-style cent-shifting input (e.g. 4 -> 0.04, 50 -> 0.50, 12856 -> 128.56, 128567 -> 1,285.67)
  function handleAmountInput() {
    const rawDigits = elements.amountInput.value.replace(/\D/g, "");
    let cents = parseInt(rawDigits, 10);
    if (isNaN(cents)) cents = 0;

    // Max limit $999,999.99
    if (cents > 99999999) {
      cents = 99999999;
    }

    currentCents = cents;
    elements.amountInput.value = formatCentsWithCommas(cents);

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

  function enqueueTransaction(payload) {
    const queue = getOfflineQueue();
    const item = {
      id: "tx_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      queuedAt: Date.now(),
      action: "add",
      ...payload
    };
    queue.push(item);
    saveOfflineQueue(queue);
    updateQueueUI();
    return queue.length;
  }

  function enqueueUndo(payload) {
    const queue = getOfflineQueue();
    const item = {
      id: "undo_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      queuedAt: Date.now(),
      action: "undo",
      ...payload
    };
    queue.push(item);
    saveOfflineQueue(queue);
    updateQueueUI();
    return queue.length;
  }

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

    let syncedCount = 0;
    let hadUndo = false;
    while (queue.length > 0) {
      const item = queue[0];
      const isUndo = item.action === "undo";
      const payload = isUndo ? {
        action: "undo",
        date: item.date,
        description: item.description,
        category: item.category,
        from: item.from,
        to: item.to,
        amount: item.amount
      } : {
        date: item.date,
        description: item.description,
        category: item.category,
        from: item.from,
        to: item.to,
        amount: item.amount
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

        // Sent successfully, remove from queue
        queue.shift();
        saveOfflineQueue(queue);
        syncedCount++;
        if (isUndo) hadUndo = true;
        updateQueueUI();
      } catch (err) {
        console.warn("Queue sync paused:", err);
        break;
      }
    }

    isSyncingQueue = false;
    updateQueueUI();

    const remaining = queue.length;
    if (syncedCount > 0) {
      haptic([25, 50, 25]);
      showToast(`Synced ${syncedCount} offline change${syncedCount === 1 ? "" : "s"} to ${state.sheetName || "Sheet"}!`, "success");
      if (hadUndo) {
        fetchRecentTransactionsFromSheet();
      }
    }

    if (remaining === 0) {
      updateStatus("online", `Connected: ${state.sheetName || "Sheet"}`);
    } else {
      updateStatus("", `${remaining} pending sync`);
    }
  }

  // Recent Transactions Storage & Manager (Last 5 Entries)
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
      localStorage.setItem(RECENT_TXS_KEY, JSON.stringify(txs.slice(0, 5)));
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

    list.forEach((item, index) => {
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
      meta.textContent = `${dateDisplay} · ${item.category || "Uncategorized"}`;

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
      elements.recentList.appendChild(row);
    });
  }

  async function undoTransaction(item) {
    haptic(15);

    // 1. Remove from recent list
    removeRecentTransaction(item.id);

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
          }, 500);
        } catch (e) {
          console.warn("Could not dispatch undo to sheet, queueing offline:", e);
          enqueueUndo({
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
          date: item.date,
          description: item.description,
          category: item.category,
          from: item.from,
          to: item.to,
          amount: item.amount
        });
      }
    }

    // 4. Restore values into form for easy editing
    currentCents = Math.round(parseFloat(item.amount) * 100);
    elements.amountInput.value = formatCentsWithCommas(currentCents);
    elements.descInput.value = item.description || "";
    resetWheelToBlank();
    if (elements.descInput.value.length > 0) {
      elements.descSplitContainer.classList.add("desc-expanded");
    }
    state.selectedCategory = item.category || "";
    state.selectedFrom = item.from || "";
    state.selectedTo = item.to || "";
    if (item.date) {
      setDate(item.date);
    }
    updateAllButtons();

    closeRecentModal();
    if (!wasInOfflineQueue && !navigator.onLine) {
      showToast("Undone & restored. Offline undo queued to sync.", "info");
    } else {
      showToast("Transaction undone & restored to form.", "success");
    }
    elements.amountInput.focus();
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
      elements.amountInput.focus();
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

  // Settings Modal Controls
  function openSettings() {
    elements.scriptUrlInput.value = state.scriptUrl;
    updateDefaultButtons();
    updateQueueUI();
    elements.settingsModal.classList.add("open");
  }

  function closeSettings() {
    elements.settingsModal.classList.remove("open");
  }

  function saveSettings() {
    const url = elements.scriptUrlInput.value.trim();
    state.scriptUrl = url;
    localStorage.setItem("budget_script_url", url);
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
  if (elements.pickerCancelBtn) {
    elements.pickerCancelBtn.addEventListener("click", closePicker);
  }

  // Tap Logo to Force App Update & Refresh
  async function forceAppUpdate() {
    haptic(15);
    if (!navigator.onLine) {
      showToast("Offline: running latest saved version.", "info");
      return;
    }
    showToast("Checking for updates...", "info");
    if ("serviceWorker" in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update();
        }
      } catch (e) {}
    }
    setTimeout(() => {
      window.location.reload();
    }, 400);
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
  elements.btnSyncNow.addEventListener("click", () => syncOptions(true));
  if (elements.btnSyncQueueNow) {
    elements.btnSyncQueueNow.addEventListener("click", () => processOfflineQueue(true));
  }
  if (elements.queueBadge) {
    elements.queueBadge.addEventListener("click", () => processOfflineQueue(true));
  }

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
    }, { passive: true });

    wrapper.addEventListener("pointerdown", (e) => {
      // If clicking reset button, ignore wheel drag
      if (e.target.closest("#btnWheelReset")) return;

      const options = getQuickFillOptions();
      if (options.length === 0) return;

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
      elements.descInput.focus();
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
  // Add / Edit Quick Fill Option Dialog
  // =========================================================================

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
    const rawDigits = elements.qfAmountInput.value.replace(/\D/g, "");
    let cents = parseInt(rawDigits, 10);
    if (isNaN(cents)) cents = 0;
    if (cents > 99999999) cents = 99999999;
    qfEditorCents = cents;
    elements.qfAmountInput.value = formatCentsWithCommas(cents);
    requestAnimationFrame(() => {
      elements.qfAmountInput.setSelectionRange(
        elements.qfAmountInput.value.length,
        elements.qfAmountInput.value.length
      );
    });
  }

  function openQuickFillEditor(opt = null) {
    if (opt) {
      qfEditorState = { ...opt };
      elements.qfEditorTitle.textContent = "Edit Wheel Option";
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
      elements.qfEditorTitle.textContent = "Add Wheel Option";
      elements.btnDeleteQuickFillOption.style.display = "none";
    }

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

    elements.quickFillEditorModal.classList.add("open");
    if (!opt) {
      setTimeout(() => elements.qfTitleInput.focus(), 200);
    }
  }

  function closeQuickFillEditor() {
    elements.quickFillEditorModal.classList.remove("open");
  }

  function saveQuickFillOption() {
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

  // Quick Fill Option Dialog Button Wiring
  if (elements.btnQfCategory) {
    elements.btnQfCategory.addEventListener("click", () => {
      openPicker("category", false, (val) => {
        qfEditorState.category = val === "(None)" ? "" : val;
        elements.qfCatBtnText.textContent = qfEditorState.category || "(None)";
      });
    });
  }

  if (elements.btnQfFrom) {
    elements.btnQfFrom.addEventListener("click", () => {
      openPicker("from", false, (val) => {
        qfEditorState.from = val === "(None)" ? "" : val;
        elements.qfFromBtnText.textContent = qfEditorState.from || "(None)";
      });
    });
  }

  if (elements.btnQfTo) {
    elements.btnQfTo.addEventListener("click", () => {
      openPicker("to", false, (val) => {
        qfEditorState.to = val === "(None)" ? "" : val;
        elements.qfToBtnText.textContent = qfEditorState.to || "(None)";
      });
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

  if (elements.quickFillEditorModal) {
    elements.quickFillEditorModal.addEventListener("click", (e) => {
      if (e.target === elements.quickFillEditorModal) closeQuickFillEditor();
    });
  }

  // Register Service Worker for PWA (Firefox / Chrome / Safari)
  if ("serviceWorker" in navigator) {
    const registerSW = () => {
      navigator.serviceWorker.register("./sw.js").then((reg) => {
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

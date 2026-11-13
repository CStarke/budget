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
    recentList: document.getElementById("recentList")
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

  function openPicker(field, isDefault = false) {
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

    if (isDefault) {
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
        elements.queueStatusText.textContent = `${count} transaction${count === 1 ? "" : "s"} waiting to sync.`;
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
    while (queue.length > 0) {
      const item = queue[0];
      const payload = {
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
      showToast(`Synced ${syncedCount} offline transaction${syncedCount === 1 ? "" : "s"} to ${state.sheetName || "Sheet"}!`, "success");
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
    if (filteredQueue.length !== queue.length) {
      saveOfflineQueue(filteredQueue);
      updateQueueUI();
    }

    // 3. Dispatch undo request to Google Sheet if online
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
        console.warn("Could not dispatch undo to sheet:", e);
      }
    }

    // 4. Restore values into form for easy editing
    currentCents = Math.round(parseFloat(item.amount) * 100);
    elements.amountInput.value = formatCentsWithCommas(currentCents);
    elements.descInput.value = item.description || "";
    state.selectedCategory = item.category || "";
    state.selectedFrom = item.from || "";
    state.selectedTo = item.to || "";
    if (item.date) {
      setDate(item.date);
    }
    updateAllButtons();

    closeRecentModal();
    showToast("Transaction undone & restored to form.", "success");
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
    const desc = elements.descInput.value.trim();
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

  // Register Service Worker for Firefox / Chrome PWA
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").then((reg) => {
        reg.update();
      }).catch((err) => {
        console.log("ServiceWorker registration skipped/failed:", err);
      });
    });
  }

  // Init
  setDate(getFormattedDate(new Date()));
  updateAllButtons();
  updateDefaultButtons();
  updateQueueUI();

  if (state.scriptUrl) {
    syncOptions(false);
    if (navigator.onLine) {
      processOfflineQueue();
    }
  } else {
    updateStatus("", "Tap ⚙ to connect sheet");
  }
})();

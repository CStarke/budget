/**
 * Budget Mobile App - Core Logic
 */

(function () {
  "use strict";

  // State
  const state = {
    scriptUrl: localStorage.getItem("budget_script_url") || "",
    sheetName: localStorage.getItem("budget_sheet_name") || "Budget",
    selectedDate: getFormattedDate(new Date()),
    selectedCategory: "",
    selectedFrom: "",
    selectedTo: "",
    options: {
      category: JSON.parse(localStorage.getItem("budget_options_cat") || "[]"),
      from: JSON.parse(localStorage.getItem("budget_options_from") || "[]"),
      to: JSON.parse(localStorage.getItem("budget_options_to") || "[]")
    }
  };

  // DOM Elements
  const elements = {
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
    btnUpdateApp: document.getElementById("btnUpdateApp"),
    queueBadge: document.getElementById("queueBadge"),
    queueCount: document.getElementById("queueCount"),
    queueStatusText: document.getElementById("queueStatusText"),
    btnSyncQueueNow: document.getElementById("btnSyncQueueNow")
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
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  // Haptic feedback helper
  function haptic(pattern = 10) {
    if (navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore vibration errors
      }
    }
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

  // Active Picker Modal State
  let activePickerField = null;

  function openPicker(field) {
    activePickerField = field;
    elements.pickerList.innerHTML = "";

    let items = [];
    let currentValue = "";

    if (field === "category") {
      items = state.options.category.length > 0 ? state.options.category : DEFAULT_OPTIONS.category;
      currentValue = state.selectedCategory;
    } else if (field === "from") {
      items = state.options.from.length > 0 ? state.options.from : DEFAULT_OPTIONS.from;
      currentValue = state.selectedFrom;
    } else if (field === "to") {
      items = state.options.to.length > 0 ? state.options.to : DEFAULT_OPTIONS.to;
      currentValue = state.selectedTo;
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
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `picker-option ${item === currentValue ? "active" : ""}`;
        btn.textContent = item;
        btn.addEventListener("click", () => {
          haptic(12);
          if (field === "category") {
            state.selectedCategory = item;
          } else if (field === "from") {
            state.selectedFrom = item;
          } else if (field === "to") {
            state.selectedTo = item;
          }
          updateAllButtons();
          closePicker();
        });
        elements.pickerList.appendChild(btn);
      });
    }

    elements.pickerOverlay.classList.add("open");
    haptic(10);
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

  // Submit Transaction
  async function submitTransaction() {
    const amount = currentCents / 100;

    // Strict validation: Amount required
    if (currentCents <= 0 || isNaN(amount)) {
      haptic([30, 60, 30]);
      showToast("Amount is required.", "error");
      highlightError(elements.amountInput);
      elements.amountInput.focus();
      return;
    }

    // Strict validation: Description required
    const desc = elements.descInput.value.trim();
    if (!desc) {
      haptic([30, 60, 30]);
      showToast("Description is required.", "error");
      highlightError(elements.descInput);
      elements.descInput.focus();
      return;
    }

    // Strict validation: Category required
    if (!state.selectedCategory) {
      haptic([30, 60, 30]);
      showToast("Category is required.", "error");
      highlightError(elements.btnSelectCategory);
      openPicker("category");
      return;
    }

    // Strict validation: From required
    if (!state.selectedFrom) {
      haptic([30, 60, 30]);
      showToast("From account is required.", "error");
      highlightError(elements.btnSelectFrom);
      openPicker("from");
      return;
    }

    // Strict validation: To required
    if (!state.selectedTo) {
      haptic([30, 60, 30]);
      showToast("To destination is required.", "error");
      highlightError(elements.btnSelectTo);
      openPicker("to");
      return;
    }

    if (!state.scriptUrl) {
      haptic(40);
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
      state.selectedCategory = "";
      state.selectedFrom = "";
      state.selectedTo = "";
      updateAllButtons();
      setDate(getFormattedDate(new Date()));
      elements.amountInput.focus();
    }

    // Offline check: queue immediately if offline
    if (!navigator.onLine) {
      const pendingCount = enqueueTransaction(payload);
      haptic([20, 50, 20]);
      showToast(`Saved offline (${pendingCount} pending). Will sync when online.`, "success");
      resetFormFields();
      return;
    }

    // UI Busy State
    elements.btnSubmit.disabled = true;
    elements.btnSubmitText.textContent = "Adding to " + (state.sheetName || "Sheet") + "...";
    haptic(15);

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
      haptic([25, 60, 25]);
      const formattedAmount = "$" + amount.toFixed(2);
      showToast(`Added ${formattedAmount} to ${state.sheetName || "Sheet"}!`, "success");
      resetFormFields();

      // Trigger queue process in case older items exist
      if (getOfflineQueue().length > 0) {
        processOfflineQueue();
      }
    } catch (err) {
      console.warn("Submission error, saving to offline queue:", err);
      const pendingCount = enqueueTransaction(payload);
      haptic([20, 50, 20]);
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
    haptic(10);
    setDate(getFormattedDate(new Date()));
  });

  elements.btnDateYesterday.addEventListener("click", () => {
    haptic(10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setDate(getFormattedDate(yesterday));
  });

  elements.btnDateCustom.addEventListener("click", () => {
    haptic(10);
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
      submitTransaction();
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

  // Force App Update & Clear Cache
  async function forceAppUpdate() {
    haptic(20);
    showToast("Updating app...", "success");
    if ("caches" in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (e) {}
    }
    if ("serviceWorker" in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      } catch (e) {}
    }
    setTimeout(() => {
      window.location.reload(true);
    }, 350);
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
  if (elements.btnUpdateApp) {
    elements.btnUpdateApp.addEventListener("click", forceAppUpdate);
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

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
    categoryChips: document.getElementById("categoryChips"),
    fromChips: document.getElementById("fromChips"),
    toChips: document.getElementById("toChips"),
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
    btnSyncNow: document.getElementById("btnSyncNow")
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

  // Render Chip Clouds
  function renderChips(container, items, stateKey, onSelect) {
    container.innerHTML = "";
    if (!items || items.length === 0) {
      const emptySpan = document.createElement("span");
      emptySpan.className = "chip-empty";
      emptySpan.textContent = "No chips found";
      container.appendChild(emptySpan);
      return;
    }

    items.forEach((item) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `chip ${state[stateKey] === item ? "active" : ""}`;
      chip.textContent = item;

      chip.addEventListener("click", () => {
        haptic(10);
        if (state[stateKey] === item) {
          state[stateKey] = ""; // deselect
        } else {
          state[stateKey] = item;
        }
        renderAllChips();
        if (onSelect) onSelect(state[stateKey]);
      });

      container.appendChild(chip);
    });
  }

  function renderAllChips() {
    const cats = state.options.category.length > 0 ? state.options.category : DEFAULT_OPTIONS.category;
    const froms = state.options.from.length > 0 ? state.options.from : DEFAULT_OPTIONS.from;
    const tos = state.options.to.length > 0 ? state.options.to : DEFAULT_OPTIONS.to;

    renderChips(elements.categoryChips, cats, "selectedCategory");
    renderChips(elements.fromChips, froms, "selectedFrom");
    renderChips(elements.toChips, tos, "selectedTo");
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

        renderAllChips();
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

  // Submit Transaction
  async function submitTransaction() {
    const amount = currentCents / 100;

    if (currentCents <= 0 || isNaN(amount)) {
      haptic(40);
      showToast("Please enter a valid amount.", "error");
      elements.amountInput.focus();
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
      description: elements.descInput.value.trim(),
      category: state.selectedCategory,
      from: state.selectedFrom,
      to: state.selectedTo,
      amount: amount
    };

    // UI Busy State
    elements.btnSubmit.disabled = true;
    elements.btnSubmitText.textContent = "Adding to " + (state.sheetName || "Sheet") + "...";
    haptic(15);

    try {
      // POST to Google Apps Script
      const response = await fetch(state.scriptUrl, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result && result.success) {
        // Success!
        haptic([25, 60, 25]);
        const formattedAmount = "$" + amount.toFixed(2);
        showToast(`Added ${formattedAmount} to ${result.sheetName || state.sheetName}!`, "success");

        // Reset form
        currentCents = 0;
        elements.amountInput.value = "";
        elements.descInput.value = "";
        setDate(getFormattedDate(new Date())); // reset to today

        // Keep category or reset
        elements.amountInput.focus();
      } else {
        throw new Error(result.error || "Failed to save entry");
      }
    } catch (err) {
      console.error("Submission failed:", err);
      haptic([50, 100, 50]);
      showToast("Failed to save: " + (err.message || "Network error"), "error");
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

  elements.btnOpenSettings.addEventListener("click", openSettings);
  elements.btnCloseSettings.addEventListener("click", closeSettings);
  elements.btnSaveSettings.addEventListener("click", saveSettings);
  elements.btnSyncNow.addEventListener("click", () => syncOptions(true));

  elements.settingsModal.addEventListener("click", (e) => {
    if (e.target === elements.settingsModal) {
      closeSettings();
    }
  });

  // Register Service Worker for Firefox / Chrome PWA
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch((err) => {
        console.log("ServiceWorker registration skipped/failed:", err);
      });
    });
  }

  // Init
  setDate(getFormattedDate(new Date()));
  renderAllChips();

  if (state.scriptUrl) {
    syncOptions(false);
  } else {
    updateStatus("", "Tap ⚙ to connect sheet");
  }
})();

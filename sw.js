/**
 * Service Worker for "Budget" App (v9)
 * Network-First with Cache Fallback strategy:
 * - When online: Always loads the freshest version and updates cache in background.
 * - When offline: Falls back to cached assets seamlessly.
 */

const CACHE_NAME = "budget-app-v9";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon.svg"
];

// Install: Cache core application assets
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
});

// Activate: Delete any older caches and claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-First for app assets (guarantees latest updates when online, offline fallback)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // If request is to Google Apps Script or external fonts/API, pass through
  if (url.hostname.includes("script.google.com") || url.hostname.includes("google.com") || url.hostname.includes("gstatic.com")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-First strategy
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if network is unavailable (offline mode)
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
      })
  );
});

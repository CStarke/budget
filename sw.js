/**
 * Service Worker for "Budget" App
 * Provides instant offline loading and caching for app assets.
 */

const CACHE_NAME = "budget-app-v2";
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
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old cache versions
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

// Fetch: Cache-first for local static assets, Network-first for Google Apps Script API calls
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // If request is to Google Apps Script or external API, pass through to network
  if (url.hostname.includes("script.google.com") || url.hostname.includes("google.com")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // App Shell Cache First strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Revalidate in background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* Offline */});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});

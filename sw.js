/**
 * Service Worker for "Budget" PWA (v96)
 * 
 * Strategy: Cache-First for App Shell + Stale-While-Revalidate
 * - Offline-First: The app shell loads instantly (<50ms) even in Airplane Mode or with zero reception.
 * - Auto-Revalidate: When online, checks for updates in the background and refreshes the cache.
 * - Navigation Fallback: Guarantees index.html is always served for any page load offline.
 * - Google Apps Script: Passed directly to network (offline queue handles offline logging).
 */

const CACHE_NAME = "budget-app-v96";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./style.css?v=v96",
  "./app.js",
  "./app.js?v=v96",
  "./manifest.json",
  "./icons/icon.svg",
  "./icons/brand-logo.svg"
];

// 1. Install: Pre-cache all core app shell assets immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
});

// 2. Activate: Clean up any older caches and claim clients immediately
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

// 3. Fetch: Handle all requests with offline-first reliability
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // A. Google Apps Script (Transactions & Sync): Always bypass cache to network
  if (url.hostname.includes("script.google.com")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // B. Navigation Requests (Opening the app, refreshing, launching from home screen):
  // Return cached index.html immediately so the app launches with ZERO delay offline
  if (event.request.mode === "navigate") {
    // If cache-busting parameter present (?v=...), always fetch fresh from network
    if (url.searchParams.has("v")) {
      event.respondWith(
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put("./index.html", clone);
                cache.put("./", networkResponse.clone());
              });
            }
            return networkResponse;
          })
          .catch(() => caches.match("./index.html", { ignoreSearch: true }))
      );
      return;
    }

    event.respondWith(
      caches.match(event.request, { ignoreSearch: true })
        .then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return caches.match("./index.html", { ignoreSearch: true });
        })
        .then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return caches.match("./", { ignoreSearch: true });
        })
        .then((cachedResponse) => {
          // If we have the cached shell, return it immediately
          if (cachedResponse) {
            // Trigger background network fetch to keep cache fresh when online
            fetch(event.request)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  const clone = networkResponse.clone();
                  caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, clone);
                    cache.put("./index.html", networkResponse.clone());
                    cache.put("./", networkResponse.clone());
                  });
                }
              })
              .catch(() => {});
            return cachedResponse;
          }

          // If not in cache yet (first run), fetch from network and cache
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, clone);
              });
            }
            return networkResponse;
          });
        })
        .catch(() => {
          // Final fallback to cached index.html
          return caches.match("./index.html", { ignoreSearch: true })
            .then((res) => res || caches.match("./", { ignoreSearch: true }));
        })
    );
    return;
  }

  // C. App Shell Static Assets (CSS, JS, SVGs, Manifest):
  // Stale-While-Revalidate: Serve from cache immediately, update cache in background
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((exactMatch) => {
        const matchPromise = exactMatch
          ? Promise.resolve(exactMatch)
          : caches.match(event.request, { ignoreSearch: true });

        return matchPromise.then((cachedResponse) => {
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const clone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, clone);
                });
              }
              return networkResponse;
            })
            .catch(() => null);

          // Return cached version immediately if available; otherwise wait for network
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // D. External Resources (Google Fonts, etc.):
  // Return cached font if available; if network fails, return clean fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback gracefully so page rendering is never blocked offline
          return new Response("", { status: 200, headers: { "Content-Type": "text/css" } });
        });
    })
  );
});

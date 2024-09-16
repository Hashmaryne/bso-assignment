// Define the cache name and resources to cache
const CACHE_NAME = "pwa-cache-v1";

// Install event: Cache static assets during installation
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/", // Add any static routes here
        "/manifest.json",
        "/icon-192x192.png",
        "/icon-512x512.png",
        // Add more files if needed
      ]);
    })
  );
  self.skipWaiting(); // Activate worker immediately
});

// Activate event: Clean up old caches if any
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control of uncontrolled clients
});

// Fetch event: Intercept network requests and implement cache logic
self.addEventListener("fetch", (event) => {
  // Only cache GET requests
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If we find a match in the cache, return it
      if (cachedResponse) {
        // Check for a fresh version of the file in the background
        event.waitUntil(
          fetch(event.request).then((networkResponse) => {
            // Update the cache with a new version if it's different
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          })
        );
        return cachedResponse;
      }

      // If not in cache, fetch from network and cache the response
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});

const filesToCache = ["/offline.html"];
const cacheName = "offline-cache";

self.addEventListener("install", e => {
  console.log("Service worker installed!");

  // Cache files
  e.waitUntil(
    caches.open(cacheName).then(c => {
      console.log("[SW] Caching...");
      c.addAll(filesToCache);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", e => {
  console.log("Service worker activated!");

  // Delete old cache
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(k => {
          if (k != cacheName) {
            return caches.delete(k);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// The real magic
self.addEventListener("fetch", e => {
  console.log("[SW] Fetching");

  if (e.request.mode !== "navigate") {
    // This request is NOT a page navigation
    // We don't wanna do anything here
    return;
  }

  e.respondWith(
    // Fetch the request first
    fetch(e.request)
      // Catch the fetch. Fetch errors out if the client and/or server are offline
      .catch(() => {
        // Return the offline.html page if the user is offline
        return caches.open(cacheName).then(c => c.match("offline.html"));
      })
  );
});

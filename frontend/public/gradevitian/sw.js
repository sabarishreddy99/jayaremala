/* gradeVITian service worker.
 *
 * Purpose: makes the site an installable PWA (Chromium browsers require a service
 * worker with a fetch handler before they fire the install prompt) and gives page
 * navigations a light offline fallback.
 *
 * Strategy is deliberately conservative — NETWORK-FIRST, and only for navigation
 * requests. Calculators, /_next/ chunks, and API calls go straight to the network
 * untouched, so users never see a stale build; the cache is only ever a fallback
 * when the device is offline.
 */
const CACHE = "gv-cache-v1";

self.addEventListener("install", () => {
  // Activate this worker as soon as it's installed — no waiting for old tabs.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from previous versions.
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Only handle top-level page navigations; everything else is passthrough.
  if (request.method !== "GET" || request.mode !== "navigate") return;

  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(request);
        const cache = await caches.open(CACHE);
        cache.put(request, fresh.clone());
        return fresh;
      } catch {
        // Offline: serve the last good copy of this page, or the home shell.
        const cached = await caches.match(request);
        return cached || (await caches.match("/")) || Response.error();
      }
    })(),
  );
});

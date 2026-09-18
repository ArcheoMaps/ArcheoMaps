// Scribe Curator service worker.
// Cache-first app shell so the queue, decisions and progress work with no connection.
// Remote proposal images are intentionally left to the network (not pre-cached) —
// image URLs come from whatever bundle was imported and the app already handles a
// failed image with a placeholder, per the design brief.
//
// IMPORTANT — release discipline (audit H-07): bump CACHE_VERSION here to
// match APP_VERSION in index.html on every release that changes either
// file. The browser only re-checks this file byte-for-byte to decide
// whether a new worker exists; a version bump is what makes that check see
// a change. Without it, editing only index.html could previously mean a
// stale cached copy kept being served indefinitely with no banner ever
// appearing, because no new worker was ever detected. The navigation
// (index.html) fetch strategy below now also fixes the underlying case
// directly — it goes to the network first whenever one's available — so a
// forgotten version bump degrades to "one background reload" rather than
// silently running old code indefinitely.
const CACHE_VERSION = "scribe-curator-shell-v0.3.2";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL_FILES))
  );
  // Do NOT self.skipWaiting() here automatically — we want the "update available"
  // banner in the page to control when the new version takes over, so an install
  // mid-review-session never yanks the UI out from under the user.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only manage same-origin app-shell requests; let everything else (remote
  // images, etc.) go straight to the network with no interference.
  if (url.origin !== self.location.origin) return;

  // The HTML document itself is network-first: when online, always fetch
  // the latest index.html rather than serving a cached copy and quietly
  // refreshing it in the background for next time. That background-refresh
  // pattern was the other half of audit H-07 — editing only index.html,
  // with no service-worker.js byte change, meant the FIRST load after a
  // release still served old code with no way to know a newer one existed.
  // Falling back to cache only covers the offline case, which is the one
  // this app actually needs an app-shell cache for.
  const isNavigation = req.mode === "navigate" || req.destination === "document";
  if (isNavigation) {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          if (resp && resp.ok) {
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, resp.clone()));
          }
          return resp;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  // Static shell assets (manifest, icons): cache-first with a background
  // refresh is fine here — nothing about them changes the app's behaviour
  // mid-session the way stale HTML/JS could.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((resp) => {
          if (resp && resp.ok) {
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, resp.clone()));
          }
          return resp;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

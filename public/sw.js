/* Kora service worker — offline-tolerant app shell (Day 1 scaffold).
 * Strategy:
 * - Precache the app shell (/, manifest, icons) on install.
 * - Navigations: network-first, fall back to cache, then offline page (/offline).
 * - Static assets (icons/manifest): cache-first.
 * - Everything else: pass through (Supabase realtime/API must never be cached).
 */
const VERSION = "kora-shell-v2";
const APP_SHELL = ["/", "/offline", "/manifest.webmanifest"];
const STATIC_CACHE = "kora-static-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== VERSION && k !== STATIC_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Never cache API / realtime / auth traffic.
  if (
    url.hostname.includes("supabase.co") ||
    url.pathname.startsWith("/rest/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/realtime/")
  ) {
    return;
  }

  // Static PWA assets: cache-first.
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then(
          (hit) =>
            hit ||
            fetch(request).then((res) => {
              if (res.ok) cache.put(request, res.clone());
              return res;
            }),
        ),
      ),
    );
    return;
  }

  // Navigations: network-first with offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches
            .open(VERSION)
            .then((cache) => cache.put("/", copy))
            .catch(() => {});
          return res;
        })
        .catch(() =>
          caches
            .match("/", { ignoreSearch: true })
            .then((hit) => hit || caches.match("/offline")),
        ),
    );
  }
});

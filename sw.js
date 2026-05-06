const CACHE_NAME = "pet-runner-v5";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./game.js",
  "./manifest.webmanifest",
  "./assets/generated/action-sheet.png",
  "./assets/generated/bg-seamless-1.png",
  "./assets/generated/bg-seamless-2.png",
  "./assets/generated/bg-seamless-3.png",
  "./assets/generated/character-sheet.png",
  "./assets/generated/items-sheet.png",
  "./assets/generated/obstacles-sheet.png",
  "./assets/generated/pause-button.png",
  "./assets/generated/run-sheet.png",
  "./assets/generated/sticker-coins-sheet.png",
  "./assets/generated/ui-sheet.png",
  "./assets/generated/sns-stickers/angry-annoyed.png",
  "./assets/generated/sns-stickers/happy-yay.png",
  "./assets/generated/sns-stickers/letsgo-action.png",
  "./assets/generated/sns-stickers/sorry-oops.png",
  "./assets/generated/sns-stickers/thanks-love.png",
  "./assets/generated/sns-stickers/tired-sleepy.png",
  "./assets/generated/pwa/apple-touch-icon.png",
  "./assets/generated/pwa/icon-192.png",
  "./assets/generated/pwa/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    }),
  );
});

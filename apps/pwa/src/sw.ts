const COOP_HEADER = "same-origin";
const COEP_HEADER = "require-corp";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request).then((response) => {
      const headers = new Headers(response.headers);
      headers.set("Cross-Origin-Opener-Policy", COOP_HEADER);
      headers.set("Cross-Origin-Embedder-Policy", COEP_HEADER);
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    })
  );
});

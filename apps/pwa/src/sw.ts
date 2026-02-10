import { precacheAndRoute } from "workbox-precaching";

const COOP_HEADER = "same-origin";
const COEP_HEADER = "require-corp";

precacheAndRoute(self.__WB_MANIFEST);

function withSecurityHeaders(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("Cross-Origin-Opener-Policy", COOP_HEADER);
  headers.set("Cross-Origin-Embedder-Policy", COEP_HEADER);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

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

  const scope = self.registration.scope;
  const fallbackUrl = new URL("index.html", scope).toString();

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => withSecurityHeaders(response))
        .catch(async () => {
          const cached = await caches.match(fallbackUrl);
          return cached ? withSecurityHeaders(cached) : Response.error();
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return withSecurityHeaders(cached);
      return fetch(request).then((response) => withSecurityHeaders(response));
    })
  );
});

// Timbrature – funzionamento offline.
// La pagina viene presa da internet quando c'è connessione (così gli aggiornamenti arrivano subito)
// e dalla copia salvata sul telefono quando non c'è campo.
const CACHE = "timbrature-v1";
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.add(new Request("./", { cache: "no-cache" }))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.url.includes("version.json")) return; // il controllo aggiornamenti va sempre su internet
  if (req.mode === "navigate" || /\/(index\.html)?(\?.*)?$/.test(new URL(req.url).pathname + new URL(req.url).search)) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 4000); // con campo debole non aspetta troppo
        const res = await fetch(req.url, { cache: "no-cache", signal: ctrl.signal });
        clearTimeout(t);
        if (res.ok) { await cache.put("./", res.clone()); return res; }
        throw new Error("http " + res.status);
      } catch (err) {
        const hit = await cache.match("./");
        if (hit) return hit;
        throw err;
      }
    })());
  }
});

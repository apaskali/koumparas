// Κουμπαράς — κρατά την εφαρμογή στο κινητό ώστε να ανοίγει αμέσως, και χωρίς ίντερνετ.
// Σε κάθε νέα έκδοση του index.html αλλάζει ο αριθμός έκδοσης παρακάτω.
const CACHE = 'koumparas-v5';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  // Κάθε αρχείο αποθηκεύεται χωριστά: αν λείπει ένα, τα υπόλοιπα αποθηκεύονται κανονικά.
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(FILES.map(f => c.add(new Request(f, { cache: 'reload' })).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Άνοιγμα της εφαρμογής: δίνεται αμέσως η αποθηκευμένη σελίδα, χωρίς αναμονή για δίκτυο.
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then(hit => hit || caches.match('./'))
        .then(hit => hit || fetch(req))
    );
    return;
  }

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res.ok && new URL(req.url).origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }))
  );
});

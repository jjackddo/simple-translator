// MP3(해시 기반, 내용 불변) → 캐시 우선
// 그 외 리소스 → 네트워크 우선 (업데이트 즉시 반영, 오프라인엔 캐시 폴백)
const CACHE = 'vn-phrasebook-v10';
const PRECACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './config.js',
  './phrases.js',
  './manifest.json',
  './icon.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isImmutableAudio(url) {
  return url.pathname.includes('/audio/') && url.pathname.endsWith('.mp3');
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // 캐시 우선 (절대 안 바뀌는 해시 기반 MP3)
  if (isImmutableAudio(url)) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(resp => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return resp;
        });
      })
    );
    return;
  }

  // 네트워크 우선 (HTML/JS/CSS/config 등 — 업데이트 즉시 반영)
  e.respondWith(
    fetch(e.request).then(resp => {
      if (resp.ok && resp.type === 'basic') {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return resp;
    }).catch(() => caches.match(e.request))
  );
});

const CACHE_NAME = 'tp-helper-v8.4'; // <--- ВАЖНО: Меняйте эту цифру при каждом обновлении кода!
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png'
  // Добавьте сюда другие картинки, если есть
];

// 1. Установка SW
self.addEventListener('install', (event) => {
  // Заставляет браузер немедленно активировать новый SW, не дожидаясь закрытия всех вкладок
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Кэширование файлов');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Активация и удаление старого кэша
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[SW] Удаление старого кэша', key);
          return caches.delete(key);
        }
      }));
    })
  );
  // Заставляет SW немедленно взять под контроль открытые страницы
  return self.clients.claim();
});

// 3. Стратегия запросов: Network First для HTML, Cache First для остального
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Если это запрос к HTML странице (навигация) - пробуем сначала сеть
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Если сеть доступна, обновляем кэш свежей версией
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // Если сети нет, берем из кэша
          return caches.match(request);
        })
    );
  } else {
    // Для картинок, скриптов и стилей - сначала кэш, потом сеть (или как было раньше)
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request);
      })
    );
  }
});
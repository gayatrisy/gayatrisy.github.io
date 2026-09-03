var CACHE_NAME = 'aurin-v1';
var CORE_ASSETS = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache){ return cache.addAll(CORE_ASSETS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  if(url.origin !== location.origin) return; // let cross-origin requests (Google Fonts) go straight to network

  event.respondWith(
    caches.match(event.request).then(function(cached){
      var networkFetch = fetch(event.request).then(function(response){
        if(response && response.status === 200){
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        }
        return response;
      }).catch(function(){
        return cached || caches.match('./index.html');
      });
      return cached || networkFetch;
    })
  );
});

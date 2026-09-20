/* V11.7.3 SPRING BALANCE · static-29 */
const CACHE='spmp-v117-static-29';

const STATIC=[
  './',
  './index.html',
  './smartpack-v11.js',
  './access-v11.5.js',
  './planner-v11.5.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './group-logo.webp',
  './smartpack-logo.webp',
  './multiplast-logo.webp',
  './IndustrialOS_Modello_Import_Dati_Azienda_V11.6.3.xlsx'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(STATIC)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;

  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;

  // HTML/navigation: prefer fresh network.
  if(req.mode==='navigate' || /\.html$/i.test(url.pathname)){
    event.respondWith(
      fetch(req,{cache:'no-store'})
        .then(res=>{
          const copy=res.clone();
          caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});
          return res;
        })
        .catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
    );
    return;
  }

  // JS, icons, logos and other static assets:
  // serve cached immediately and refresh in background.
  event.respondWith(
    caches.match(req).then(cached=>{
      const refresh=fetch(req)
        .then(res=>{
          if(res && res.ok){
            const copy=res.clone();
            caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});
          }
          return res;
        })
        .catch(()=>cached);

      return cached || refresh;
    })
  );
});

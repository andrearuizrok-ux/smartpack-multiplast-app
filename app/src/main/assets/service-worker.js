/* V11.8.0 PERSISTENT SESSION · static-36 */
const CACHE='spmp-v118-static-36';

const CORE_STATIC=[
  './access-v11.5.js',
  './planner-v11.5.js',
  './group-logo.webp',
  './smartpack-logo.webp',
  './multiplast-logo.webp',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

async function cacheAvailable(){
  const cache=await caches.open(CACHE);
  await Promise.allSettled(
    CORE_STATIC.map(async url=>{
      try{
        const response=await fetch(url,{cache:'reload'});
        if(response && response.ok) await cache.put(url,response);
      }catch(_){}
    })
  );
}

self.addEventListener('install',event=>{
  event.waitUntil(cacheAvailable());
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
  if(req.method!=='GET')return;

  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;

  // HTML/navigation should remain fresh.
  if(req.mode==='navigate'||/\.html$/i.test(url.pathname)){
    event.respondWith(
      fetch(req,{cache:'no-store'})
        .catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
    );
    return;
  }

  // Core static assets: stale-while-revalidate.
  event.respondWith(
    caches.match(req).then(cached=>{
      const network=fetch(req).then(response=>{
        if(response&&response.ok){
          const copy=response.clone();
          caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});
        }
        return response;
      }).catch(()=>cached);

      return cached||network;
    })
  );
});

/* V11.9.3 LOGIN REAL FIX · static-48 */
const CACHE='spmp-v119-static-48';

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
  await Promise.allSettled(CORE_STATIC.map(async url=>{
    try{
      const response=await fetch(url,{cache:'no-store'});
      if(response&&response.ok)await cache.put(url,response.clone());
    }catch(_){}
  }));
}

self.addEventListener('install',event=>{
  event.waitUntil(cacheAvailable());
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

function isCriticalCode(url){
  return /\.(?:js|css)$/i.test(url.pathname) ||
         /(?:access-v11\.5|planner-v11\.5|smartpack-v11)\.js$/i.test(url.pathname);
}

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;

  // Documento: sempre prova la versione corrente dalla rete.
  if(req.mode==='navigate'||/\.html$/i.test(url.pathname)){
    event.respondWith(
      fetch(req,{cache:'no-store'})
        .then(res=>res)
        .catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
    );
    return;
  }

  // Codice applicativo: NETWORK FIRST.
  // Impedisce che venga eseguito planner/access della build precedente.
  if(isCriticalCode(url)){
    event.respondWith((async()=>{
      try{
        const res=await fetch(req,{cache:'no-store'});
        if(res&&res.ok){
          const copy=res.clone();
          caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});
        }
        return res;
      }catch(_){
        const cached=await caches.match(req);
        if(cached)return cached;
        throw _;
      }
    })());
    return;
  }

  // Asset visuali: cache immediata + refresh in background.
  event.respondWith(caches.match(req).then(cached=>{
    const network=fetch(req).then(res=>{
      if(res&&res.ok){
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});
      }
      return res;
    }).catch(()=>cached);
    return cached||network;
  }));
});

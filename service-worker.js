
const CACHE='home-maintenance-v42';
const SHELL=['./','./index.html','./styles.css','./app.js','./cloud-sync.js','./cloud-config.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.hostname.includes('supabase.co')) return;
  if(url.pathname.endsWith('/cloud-config.js')){event.respondWith(fetch(req,{cache:'no-store'}));return;}
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(res=>{
      const copy=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return res;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  if(url.origin===location.origin && /\.(js|css|webmanifest)$/.test(url.pathname)){
    event.respondWith(fetch(req).then(res=>{
      const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res;
    }).catch(()=>caches.match(req)));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req)));
});

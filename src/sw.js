/* Holt immer zuerst die neueste Version. Ohne Netz oder bei sehr langsamem Netz kommt die gespeicherte. */
const CACHE='tagwerk';
const CORE=__CORE__;
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)))});
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin||u.pathname.endsWith('/version.json'))return;
  e.respondWith((async()=>{
    const c=await caches.open(CACHE),key=e.request.mode==='navigate'?'./':e.request;
    const stored=await c.match(key,{ignoreSearch:true});
    const live=fetch(u.href,{cache:'no-cache',credentials:'same-origin'}).then(r=>{if(r.ok)c.put(key,r.clone());return r});
    if(!stored)return live;
    const slow=new Promise(res=>setTimeout(()=>res(stored),3000));
    return Promise.race([live.catch(()=>stored),slow]);
  })());
});

/* Holt immer zuerst die neueste Version. Ohne Netz oder bei sehr langsamem Netz kommt die gespeicherte. */
const CACHE='tagwerk';
const CORE=["./", "config.js", "fb.js", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "img/apfel.webp", "img/erde.webp", "img/uhr.webp", "img/auto.webp", "img/hand.webp", "img/lego.webp", "img/klettern.webp", "img/birne.webp", "img/boxen.webp", "fonts/nunito-latin-700-normal.woff2", "fonts/nunito-latin-800-normal.woff2", "fonts/nunito-latin-900-normal.woff2", "fonts/nunito-sans-latin-400-normal.woff2", "fonts/nunito-sans-latin-600-normal.woff2", "fonts/nunito-sans-latin-700-normal.woff2"];
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

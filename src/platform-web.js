/* ---------- Plattform: eigene Web-App mit Firebase ---------- */
const APP_VERSION='__VERSION__';
let fbAuth=null;
const AUTH_ERRORS={
  'auth/invalid-credential':'E-Mail oder Passwort stimmt nicht.',
  'auth/wrong-password':'E-Mail oder Passwort stimmt nicht.',
  'auth/user-not-found':'E-Mail oder Passwort stimmt nicht.',
  'auth/invalid-email':'Diese E-Mail-Adresse sieht nicht richtig aus.',
  'auth/email-already-in-use':'Für diese E-Mail gibt es schon ein Konto. Melde dich an.',
  'auth/weak-password':'Das Passwort braucht mindestens 6 Zeichen.',
  'auth/network-request-failed':'Keine Verbindung. Prüfe dein Internet und versuche es nochmal.',
  'auth/too-many-requests':'Zu viele Versuche. Warte kurz und versuche es nochmal.'
};
function loginScreen(F){
  return new Promise(done=>{
    const el=document.createElement('div');el.id='login';
    let mode='in',mail='';
    const draw=()=>{
      el.innerHTML=`<form class="login-card" id="login-form" novalidate>
        <div class="brand">Tagwerk</div>
        <p class="lead">${mode==='in'?'Melde dich an, um zu deinen Daten zu kommen.':'Lege dein Konto an. Das machst du nur einmal.'}</p>
        <div class="fld"><label for="l-mail">E-Mail</label><input type="email" id="l-mail" value="${esc(mail)}" autocomplete="username" inputmode="email" autocapitalize="off" required></div>
        <div class="fld"><label for="l-pass">Passwort</label><input type="password" id="l-pass" autocomplete="${mode==='in'?'current-password':'new-password'}" required></div>
        <p class="l-err" id="l-err" role="alert" hidden></p>
        <button class="btn wide">${mode==='in'?'Anmelden':'Konto erstellen'}</button>
        <div class="l-links"><button type="button" class="link quiet" id="l-mode">${mode==='in'?'Konto erstellen':'Ich habe schon ein Konto'}</button>${mode==='in'?'<button type="button" class="link quiet" id="l-reset">Passwort vergessen</button>':''}</div>
      </form>`;
    };
    const say=t=>{const e=el.querySelector('#l-err');e.textContent=t;e.hidden=!t};
    const why=e=>AUTH_ERRORS[e?.code]||'Das hat nicht geklappt. Versuche es nochmal.';
    el.addEventListener('click',async e=>{
      if(e.target.id==='l-mode'){mail=el.querySelector('#l-mail').value;mode=mode==='in'?'neu':'in';draw()}
      if(e.target.id==='l-reset'){
        const m=el.querySelector('#l-mail').value.trim();
        if(!m){say('Trag zuerst deine E-Mail ein.');return}
        try{await F.sendPasswordResetEmail(fbAuth,m);say('Wir haben dir einen Link zum Zurücksetzen geschickt.')}catch(x){say(why(x))}
      }
    });
    el.addEventListener('submit',async e=>{
      e.preventDefault();
      const m=el.querySelector('#l-mail').value.trim(),p=el.querySelector('#l-pass').value,b=el.querySelector('button.btn');
      if(!m||!p){say('Trag E-Mail und Passwort ein.');return}
      b.disabled=true;say('');
      try{
        const r=mode==='in'?await F.signInWithEmailAndPassword(fbAuth,m,p):await F.createUserWithEmailAndPassword(fbAuth,m,p);
        el.remove();done(r.user);
      }catch(x){say(why(x));b.disabled=false}
    });
    draw();document.body.append(el);
  });
}
const PLATFORM={
  web:true,
  localNote:'Tagwerk speichert gerade nur auf diesem Gerät.',
  async db(){
    const cfg=window.TAGWERK_FIREBASE,F=window.FB;
    if(!cfg?.apiKey||!F)return null;
    const app=F.initializeApp(cfg);
    fbAuth=F.getAuth(app);
    let fs;
    try{fs=F.initializeFirestore(app,{ignoreUndefinedProperties:true,localCache:F.persistentLocalCache({tabManager:F.persistentMultipleTabManager()})})}
    catch{fs=F.initializeFirestore(app,{ignoreUndefinedProperties:true})}
    const known=await new Promise(res=>{const off=F.onAuthStateChanged(fbAuth,u=>{off();res(u)})});
    const user=known||await loginScreen(F),uid=user.uid;
    /* Änderungen liegen sofort sicher im Gerät und gehen online, sobald Netz da ist. Darum wird nicht auf den Server gewartet. */
    const fire=p=>{p.catch(()=>{ui.saveError=true;renderBanner()});return Promise.resolve()};
    return{
      collection:c=>({onSnapshot:(next,err)=>F.onSnapshot(F.collection(fs,'users',uid,c),{includeMetadataChanges:true},q=>next({docs:q.docs.map(d=>({id:d.id,data:()=>d.data()})),metadata:q.metadata}),err)}),
      doc:p=>{const[c,id]=p.split('/'),r=F.doc(fs,'users',uid,c,id);return{set:d=>fire(F.setDoc(r,d)),delete:()=>fire(F.deleteDoc(r))}}
    };
  },
  async logout(){await flush();await window.FB.signOut(fbAuth);location.reload()},
  async save(data,filename){
    const file=new File([data],filename,{type:'application/json'});
    if(navigator.canShare?.({files:[file]})){
      try{await navigator.share({files:[file]})}catch(e){if(e?.name==='AbortError')throw{code:'declined'};throw e}
      return true;
    }
    const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=filename;document.body.append(a);a.click();a.remove();
    return true;
  }
};
/* Neue Versionen werden beim Öffnen geladen. Bleibt die App im Hintergrund offen, prüft sie beim Zurückkehren. */
async function checkUpdate(){
  try{
    const r=await fetch('version.json?t='+Date.now(),{cache:'no-store'}),{v}=await r.json();
    if(v&&v!==APP_VERSION&&!isTyping()&&document.getElementById('sheet').hidden){await flush();location.reload()}
  }catch{}
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkUpdate()});
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));

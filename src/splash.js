/* ---------- Startbild ---------- */
const sky=`<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BDE9FC"/><stop offset=".62" stop-color="#E6F8FF"/><stop offset="1" stop-color="#FBFEFF"/></linearGradient>
<linearGradient id="gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4FAD8"/><stop offset="1" stop-color="#A9E796"/></linearGradient></defs><rect width="1000" height="1000" fill="url(#sk)"/>`;
const hills=`<path d="M0 860Q260 760 560 850T1000 830V1000H0Z" fill="#D5F5C6"/><path d="M0 920Q320 830 640 915T1000 900V1000H0Z" fill="url(#gl)"/>`;
const bub=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" fill-opacity=".25" stroke="#fff" stroke-width="3"/><circle cx="${x-r*.35}" cy="${y-r*.35}" r="${r*.16}" fill="#fff"/>`;
const FLAME=sky+`<defs><linearGradient id="fa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC56B"/><stop offset="1" stop-color="#FF8F5E"/></linearGradient><linearGradient id="fi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6C4"/><stop offset="1" stop-color="#FFD76E"/></linearGradient><radialGradient id="fg"><stop offset="0" stop-color="#FFE3A8"/><stop offset="1" stop-color="#FFE3A8" stop-opacity="0"/></radialGradient></defs>`+bub(170,600,46)+bub(830,560,64)+bub(770,740,24)+hills+`<circle cx="500" cy="690" r="340" fill="url(#fg)"/><g transform="translate(125 170) scale(.75)"><g class="flame"><path d="M500 470C560 590 700 640 700 780A200 190 0 0 1 300 780C300 690 370 660 390 590 420 640 450 650 470 620 490 580 480 520 500 470Z" fill="url(#fa)" stroke="#fff" stroke-width="7"/><path d="M505 640C540 710 610 730 610 805A110 105 0 0 1 390 805C390 750 440 730 505 640Z" fill="url(#fi)"/><ellipse cx="385" cy="745" rx="24" ry="62" fill="#fff" fill-opacity=".6" transform="rotate(14 385 745)"/></g></g>`;
const TRI=(l,t,c,dl)=>`<span class="qt" style="left:${l}%;top:${t}%;background:${c};animation-delay:${dl}s"></span>`;
const LEAF=(l,dl)=>`<span class="ql" style="left:${l}%;animation-delay:${dl}s"></span>`;
const FX={
  klettern:TRI(6,20,'#6FD3F2',.5)+TRI(90,30,'#B98CFF',2.3),
  birne:TRI(5,26,'#F7B52C',1.4)+TRI(92,36,'#7BDB6E',3),
  boxen:TRI(6,30,'#6FD3F2',.9)+TRI(92,40,'#F24E7A',2.6),
  auto:TRI(6,10,'#6FD3F2',0)+TRI(90,8,'#F7B52C',1.8)+TRI(92,74,'#7BDB6E',3.2)+TRI(3,74,'#B98CFF',2.6),
  hand:TRI(5,12,'#6FD3F2',.6)+TRI(90,16,'#7C5CFF',2.4)+TRI(4,52,'#3F7DF0',3.8)+TRI(92,60,'#6FD3F2',1.3),
  lego:TRI(8,14,'#F24E7A',1)+TRI(88,30,'#F7B52C',2.8)+TRI(5,62,'#7BDB6E',3.4)+TRI(92,70,'#3F7DF0',.4),
  apfel:TRI(4,8,'#6FD3F2',0)+TRI(88,10,'#B98CFF',2.2)+TRI(92,46,'#F7B52C',1.1)+TRI(3,66,'#7BDB6E',3.6),
  erde:LEAF(8,0)+LEAF(86,2)+LEAF(22,4),
  uhr:TRI(8,24,'#7C5CFF',0)+TRI(92,70,'#3F7DF0',2)+TRI(3,84,'#F7B52C',3.5)+TRI(90,4,'#6FD3F2',1.4)+TRI(6,48,'#FF8FA3',4.6)
};
/* Welcher Glückwunsch steht an? Ein erreichtes Ziel zuerst, dann Serien. Gerissene Serien werden still zurückgesetzt. */
function celebration(){
  for(const[id,t]of Object.entries(S.targets)){
    const st=targetState({id,...t});
    if(st.reached&&!t.celebrated){put('targets',id,{...clone(t),celebrated:true},false);return{big:'Ziel erreicht',sub:t.name}}
    if(!st.reached&&t.celebrated)put('targets',id,{...clone(t),celebrated:false},false);
  }
  let hit=null;
  for(const id of projectIds()){
    const c=projectStreak(id),mile=MILES.filter(x=>x<=c).pop()||0,seen=P(id).celebrated||0;
    if(mile>seen&&!hit){hit={big:`${c} in Folge erledigt`,sub:P(id).name};setProject(id,{celebrated:mile})}
    else if(mile<seen)setProject(id,{celebrated:mile});
  }
  for(const t of dailyTasks()){
    const c=dailyStreak(t),mile=DAY_MILES.filter(x=>x<=c).pop()||0,seen=t.celebrated||0;
    if(mile>seen&&!hit){hit={big:`${c} Tage in Folge`,sub:t.name};put('dailytasks',t.id,{...clone(S.dailytasks[t.id]),celebrated:mile},false)}
    else if(mile<seen)put('dailytasks',t.id,{...clone(S.dailytasks[t.id]),celebrated:mile},false);
  }
  return hit;
}
let splashReady=()=>{};
function splash(){
  const el=document.getElementById('splash');let gone=false,shown=false;
  const paint=(scene,card)=>{const art=ART[scene];el.innerHTML=`<svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${art?sky+hills:FLAME}</svg>${art?`<div class="q-art"><div class="q-fx">${FX[scene]||''}</div><img src="${art}" alt=""></div>`:''}${card}<div class="q-hint">Tippen, um zu starten</div>`};
  const showQuote=()=>{
    let last=-1;
    try{last=+(localStorage.getItem('tagwerk-quote')??-1)}catch{}
    let i=Math.floor(Math.random()*QUOTES.length);if(i===last)i=(i+1)%QUOTES.length;
    try{localStorage.setItem('tagwerk-quote',i)}catch{}
    const[scene,text,who]=QUOTES[i];
    paint(scene,`<div class="q-card"><p class="q-text">„${esc(text)}“</p><p class="q-who">~ ${esc(who)}</p></div>`);
  };
  const showCheer=c=>paint('flamme',`<div class="q-card"><p class="q-text">Glückwunsch!</p><p class="q-big">${esc(c.big)}</p><p class="q-who">${esc(c.sub)}</p></div>`);
  el.innerHTML=`<svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${sky}</svg>`;
  splashReady=()=>{
    if(shown||gone)return;shown=true;
    const c=celebration();
    if(c)showCheer(c);else showQuote();
  };
  setTimeout(()=>{if(!shown&&!gone){shown=true;showQuote()}},1500);
  const leave=()=>{if(gone)return;gone=true;el.classList.add('out');setTimeout(()=>el.remove(),1000)};
  el.addEventListener('click',leave);
  el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();leave()}});
  el.focus({preventScroll:true});
}

/* ---------- Start ---------- */
{const h=location.hash.slice(1);if(h)applyRoute(h)}
splash();
boot();

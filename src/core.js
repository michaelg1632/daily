/* ---------- Datum ---------- */
const WD=['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];
const WD2=['Mo','Di','Mi','Do','Fr','Sa','So'];
const MON=['Jänner','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d,12)};
const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return iso(d)};
const addMonths=(s,n)=>{const d=parse(s),day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+n);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return iso(d)};
const today=()=>iso(new Date());
const dow=s=>(parse(s).getDay()+6)%7;
function isoWeek(s){const d=parse(s);d.setDate(d.getDate()+3-((d.getDay()+6)%7));const w1=new Date(d.getFullYear(),0,4,12);return 1+Math.round(((d-w1)/864e5-3+((w1.getDay()+6)%7))/7)}
const dayOfYear=s=>{const d=parse(s);return Math.round((d-new Date(d.getFullYear(),0,1,12))/864e5)+1};
const daysInYear=s=>{const y=parse(s).getFullYear();return(y%4==0&&y%100!=0)||y%400==0?366:365};
const shortDate=s=>{const d=parse(s);return d.getDate()+'. '+MON[d.getMonth()]};
const longDate=s=>WD[dow(s)]+', '+shortDate(s);
const dayName=s=>{const t=today();if(s===t)return'Heute';if(s===addDays(t,1))return'Morgen';if(s===addDays(t,-1))return'Gestern';return longDate(s)};
const daysBetween=(a,b)=>Math.round((parse(b)-parse(a))/864e5);
const weekStart=s=>addDays(s,-dow(s));

/* ---------- Text und Zahlen ---------- */
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>{const n=parseFloat(String(v??'').trim().replace(/\s/g,'').replace(',','.'));return Number.isFinite(n)?n:null};
const fmt=v=>v==null?'–':String(Math.round(v*100)/100).replace('.',',');
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const clone=o=>JSON.parse(JSON.stringify(o));
const plural=(n,one,many)=>n===1?'1 '+one:n+' '+many;
const sameName=(a,b)=>String(a).trim().toLowerCase()===String(b).trim().toLowerCase();
const shortTitle=t=>{const i=String(t).indexOf(' - ');return i>0?t.slice(i+3):t};

/* ---------- Speicher ---------- */
const MAX_PHOTOS=12,THUMB=240,PHOTO_LIMIT=900000;
const canPhoto=()=>PLATFORM.web&&!ui.local&&!!db;
const COLS=['projects','activities','measurements','dailytasks','dailylog','targets','setbacks'];
const S=Object.fromEntries(COLS.map(c=>[c,{}]));
const ui={view:'heute',proj:null,act:null,back:'heute',sel:today(),month:null,dsel:null,edit:false,open:new Set(),metric:null,range:90,ready:false,local:false,stale:false,saveError:false};
let db=null;
const pending=new Map();
let flushing=false,flushTimer=null;
const LS='tagwerk-v2';

function put(col,id,data,rerender=true){
  if(data===null)delete S[col][id];else S[col][id]=data;
  pending.set(col+'/'+id,data);
  clearTimeout(flushTimer);flushTimer=setTimeout(flush,300);
  if(rerender)render();
}
async function flush(){
  clearTimeout(flushTimer);
  if(ui.local){pending.clear();try{localStorage.setItem(LS,JSON.stringify(S))}catch{}return}
  if(!db||flushing)return;
  flushing=true;
  while(pending.size){
    const[path,data]=pending.entries().next().value;
    const write=()=>data===null?db.doc(path).delete():db.doc(path).set(data);
    try{
      try{await write()}catch(e){
        if(e?.code!=='unavailable')throw e;
        await new Promise(r=>setTimeout(r,800+Math.random()*700));await write();
      }
    }catch(e){
      ui.saveError=true;renderBanner();
      toast(e?.code==='quota_exceeded'?'Der Speicher ist voll. Lösche alte Einträge.':'Speichern hat nicht geklappt. Lade die Seite neu und versuche es nochmal.');
    }
    if(pending.get(path)===data)pending.delete(path);
  }
  flushing=false;
}
addEventListener('pagehide',flush);
document.addEventListener('visibilitychange',()=>{if(document.hidden)flush();else softRender()});

function isTyping(){const a=document.activeElement;return!!a?.matches?.('input[type=text],textarea')&&!a.closest('#sheet')}
let deferred=false;
function softRender(){if(!document.getElementById('sheet').hidden||isTyping()){deferred=true;return}render()}
document.addEventListener('focusout',()=>setTimeout(()=>{if(deferred&&!isTyping()&&document.getElementById('sheet').hidden){deferred=false;render()}},60));
let lastDay=today();
setInterval(()=>{if(today()!==lastDay){lastDay=today();ui.sel=lastDay;softRender()}},60000);

async function boot(){
  render();
  await new Promise(r=>setTimeout(r,0));
  try{db=await PLATFORM.db()}catch{db=null}
  if(!db){
    ui.local=true;ui.ready=true;
    try{const r=JSON.parse(localStorage.getItem(LS)||'null');if(r)Object.assign(S,r)}catch{}
    for(const c of COLS)S[c]=S[c]||{};
    render();splashReady();return;
  }
  const left=new Set(COLS);
  const timer=setTimeout(()=>{ui.stale=true;renderBanner();if(!ui.ready){ui.ready=true;render()}},10000);
  for(const col of COLS){
    db.collection(col).onSnapshot(q=>{
      const next={};
      for(const d of q.docs)next[d.id]=d.data();
      for(const[path,val]of pending){const[c,id]=path.split('/');if(c===col){if(val===null)delete next[id];else next[id]=val}}
      S[col]=next;
      if(!q.metadata.fromCache&&left.delete(col)&&!left.size){clearTimeout(timer);ui.stale=false;ui.ready=true;render();splashReady()}
      if(q.docs.length)ui.ready=true;
      softRender();
    },()=>{clearTimeout(timer);ui.stale=true;ui.ready=true;renderBanner();softRender()});
  }
}

/* ---------- Projekte ---------- */
const EMPTY_PROJECT={name:'',metrics:[],groups:[],quick:[]};
const P=id=>S.projects[id]||EMPTY_PROJECT;
const hasProject=id=>!!id&&!!S.projects[id]?.name;
const projectIds=()=>Object.keys(S.projects).filter(hasProject).sort((a,b)=>(S.projects[a].order||0)-(S.projects[b].order||0));
const metricsOf=id=>P(id).metrics||[];
const groupsOf=id=>P(id).groups||[];
const metricOf=(pid,id)=>metricsOf(pid).find(x=>x.id===id);
function fieldsOf(id){
  if(!hasProject(id))return{checklist:true,duration:true,sets:false,photos:true};
  const p=P(id),f=p.fields||{};
  return{checklist:f.checklist!==false,duration:f.duration!==false,sets:f.sets??!!p.training,photos:f.photos===true};
}
const colorOf=id=>P(id).color||'';
function itemsOf(pid,gid){
  const gs=groupsOf(pid),known=gs.map(g=>g.id);
  return metricsOf(pid).filter(x=>x.groupId===gid||(gs[0]?.id===gid&&!known.includes(x.groupId)));
}
function setProject(pid,patch){put('projects',pid,{...clone(P(pid)),...patch},false)}
function nextOrder(col){return Math.max(0,...Object.values(S[col]).map(x=>x.order||0))+1}
function projectFromTemplate(tid,name,color){
  const t=TEMPLATES.find(x=>x.id===tid)||TEMPLATES[0];
  const groups=[],metrics=[];
  for(const[gname,ids]of t.groups){
    const gid='g'+uid()+groups.length;groups.push({id:gid,name:gname});
    for(const mid of ids){const it=catalogItem(mid);if(it)metrics.push({...it,groupId:gid})}
  }
  return{name,color:color||PALETTE[t.color][1],template:t.id,order:nextOrder('projects'),fields:{checklist:true,duration:true,sets:!!t.sets},quick:[...t.quick],groups,metrics};
}

/* ---------- Aktivitäten ---------- */
const acts=()=>Object.entries(S.activities).map(([id,a])=>({id,...a}));
const byTime=(a,b)=>(a.date+(a.time||'99')).localeCompare(b.date+(b.time||'99'));
const actsOn=d=>acts().filter(a=>a.date===d).sort(byTime);
const actsOf=pid=>acts().filter(a=>a.projectId===pid);
const statusOf=a=>a.status||'planned';
const overdue=()=>{const t=today();return acts().filter(a=>a.date<t&&statusOf(a)==='planned').sort(byTime).reverse()};
function newActivity(fields){return{title:'',date:today(),time:'',projectId:'',status:'planned',note:'',exercises:[],checklist:[],duration:null,values:{},...fields}}

/* Serie: erledigte Aktivitäten in Folge. Ausgelassen oder nicht abgehakt beendet sie, heute Geplantes noch nicht. */
function projectStreak(pid){
  const t=today(),l=actsOf(pid).filter(a=>a.date<=t).sort(byTime).reverse();
  let n=0;
  for(const a of l){
    const s=statusOf(a);
    if(s==='done')n++;
    else if(s==='missed'||a.date<t)break;
  }
  return n;
}
function bestOfExercise(ex,unit){
  const key=unit==='Wdh.'?'reps':'kg';let b=null;
  for(const s of ex.sets||[])if(typeof s[key]==='number'&&(b===null||s[key]>b))b=s[key];
  return b;
}
/* Verlauf eines Werts: pro Tag ein Punkt, aus Aktivitäten, älteren Tageswerten und Übungen. */
function series(m,pid){
  const map={},t=today(),sum=m.mode==='sum';
  const add=(d,v)=>{if(sum)map[d]=(map[d]||0)+v;else map[d]=v};
  for(const[d,x]of Object.entries(S.measurements)){const v=x.values?.[m.id];if(typeof v==='number'&&d<=t)add(d,v)}
  for(const a of acts().filter(x=>x.projectId===pid&&x.date<=t).sort(byTime)){
    const v=a.values?.[m.id];
    if(typeof v==='number')add(a.date,v);
    if(m.kind==='exercise')for(const ex of a.exercises||[])if(sameName(ex.name,m.ex||m.name)){
      const b=bestOfExercise(ex,m.unit);
      if(b!==null&&(map[a.date]===undefined||b>map[a.date]))map[a.date]=b;
    }
  }
  return Object.entries(map).map(([d,v])=>({d,v})).sort((a,b)=>a.d.localeCompare(b.d));
}
const sumOf=(pts,from='')=>pts.filter(p=>p.d>=from).reduce((n,p)=>n+p.v,0);
function metricNow(m,pid){
  const s=series(m,pid);
  if(!s.length)return null;
  return m.mode==='sum'?sumOf(s,today().slice(0,8)+'01'):s[s.length-1].v;
}
const metricLabel=(m,pid)=>{const v=metricNow(m,pid);return v===null?'Noch kein Wert':(m.mode==='sum'?'Monat: ':'')+fmt(v)+' '+m.unit};

/* ---------- Ziele ---------- */
const targetsOf=pid=>Object.entries(S.targets).map(([id,t])=>({id,...t})).filter(t=>t.projectId===pid).sort((a,b)=>(a.order||0)-(b.order||0));
function targetState(t){
  let cur=0,start=t.start||0;
  if(t.kind==='milestone')return{cur:t.done?1:0,start:0,target:1,pct:t.done?1:0,reached:!!t.done};
  if(t.kind==='count')cur=actsOf(t.projectId).filter(a=>statusOf(a)==='done'&&a.date>=(t.created||'')).length;
  else{
    const m=metricOf(t.projectId,t.metricId);
    if(!m)return{cur:null,start,target:t.target,pct:0,reached:false,lost:true};
    const s=series(m,t.projectId);
    if(m.mode==='sum')cur=sumOf(s,t.created||'')+start;
    else cur=s.length?s[s.length-1].v:start;
  }
  const span=t.target-start;
  const reached=span>=0?cur>=t.target:cur<=t.target;
  return{cur,start,target:t.target,pct:reached?1:span?Math.max(0,Math.min(1,(cur-start)/span)):0,reached};
}
function targetUnit(t){return t.kind==='count'?'erledigt':metricOf(t.projectId,t.metricId)?.unit||''}
function targetDue(t,st){
  if(!t.due||st.reached)return'';
  const n=daysBetween(today(),t.due);
  return n<0?`${plural(-n,'Tag','Tage')} überfällig`:n===0?'Heute fällig':`Noch ${plural(n,'Tag','Tage')}`;
}

/* ---------- Daily Tasks ---------- */
const dailyTasks=()=>Object.entries(S.dailytasks).map(([id,t])=>({id,...t})).filter(t=>!t.archived).sort((a,b)=>(a.time||'99').localeCompare(b.time||'99')||(a.order||0)-(b.order||0));
const dailyOnDay=(t,d)=>(!t.start||d>=t.start)&&(!t.days||!t.days.length||t.days.includes(dow(d)));
const dailyFor=d=>dailyTasks().filter(t=>dailyOnDay(t,d));
const dailyDone=(id,d)=>!!S.dailylog[d]?.done?.[id];
function dailyStreak(t){
  let n=0,d=today();
  if(!dailyOnDay(t,d)||!dailyDone(t.id,d))d=addDays(d,-1);
  for(let i=0;i<3000&&!(t.start&&d<t.start);i++){
    if(dailyOnDay(t,d)){if(!dailyDone(t.id,d))break;n++}
    d=addDays(d,-1);
  }
  return n;
}
const dayLog=d=>clone(S.dailylog[d]||{date:d,done:{}});
const setbacksOf=pid=>Object.entries(S.setbacks).map(([id,s])=>({id,...s})).filter(s=>s.projectId===pid).sort((a,b)=>(b.date+(b.at||'')).localeCompare(a.date+(a.at||'')));

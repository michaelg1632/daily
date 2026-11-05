/* ---------- Navigation ---------- */
const hashFor=()=>ui.view==='projekt'?'projekt-'+ui.proj:ui.view==='aktivitaet'?'aktivitaet-'+ui.act:ui.view;
function applyRoute(h){
  if(h.startsWith('projekt-')){ui.view='projekt';ui.proj=h.slice(8)}
  else if(h.startsWith('aktivitaet-')){ui.view='aktivitaet';ui.act=h.slice(11)}
  else if(VIEWS.some(x=>x[0]===h))ui.view=h;
  else if(h==='fitness')ui.view='projekte';
}
function go(view,o={}){
  Object.assign(ui,{view,edit:false},o);
  try{location.hash=hashFor()}catch{}
  render();scrollTo(0,0);
}
addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(h&&h!==hashFor()){applyRoute(h);render()}});
function openProject(id){ui.open=new Set(['s:ziele','s:werte','s:akt','s:daily']);ui.metric=null;go('projekt',{proj:id})}

/* ---------- Hilfen ---------- */
const act=()=>clone(S.activities[ui.act]);
const saveAct=(a,r=true)=>put('activities',ui.act,a,r);
const focusOn=id=>document.getElementById(id)?.focus();
const lastProject=()=>{try{const id=localStorage.getItem('tagwerk-lastproject');return hasProject(id)?id:''}catch{return''}};
let toastT;
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,2400)}
function ensureGroup(pid,name){
  const gs=clone(groupsOf(pid)),g=gs.find(x=>sameName(x.name,name));
  if(g)return{id:g.id,groups:gs};
  const id='g'+uid();gs.push({id,name});return{id,groups:gs};
}
function ensureExerciseMetric(name,pid){
  if(!hasProject(pid)||metricsOf(pid).some(x=>x.kind==='exercise'&&sameName(x.ex||x.name,name)))return;
  const known=CATALOG.flatMap(([,l])=>l).find(x=>x.kind==='exercise'&&sameName(x.name,name));
  const{id,groups}=ensureGroup(pid,'Übungen');
  setProject(pid,{groups,metrics:[...clone(metricsOf(pid)),{...(known||{id:'c'+uid(),name,unit:'kg',mode:'last',kind:'exercise'}),groupId:id}]});
}
function addExercise(name){
  const a=act();ensureExerciseMetric(name,a.projectId);
  a.exercises=(a.exercises||[]).concat({name,sets:[{kg:null,reps:null}]});saveAct(a);focusOn(`s-${a.exercises.length-1}-0-kg`);
}
function moveDayValue(mid,d){
  const x=S.measurements[d];if(x?.values?.[mid]==null)return;
  const c=clone(x);delete c.values[mid];put('measurements',d,c,false);
}
function createActivities(f){
  const{count,step,...base}=f;
  let d=base.date;
  for(let i=0;i<count;i++){
    put('activities',uid()+i,newActivity({...base,date:d}),false);
    d=step==='d'?addDays(d,1):step==='w'?addDays(d,7):step==='2w'?addDays(d,14):step==='m'?addMonths(base.date,i+1):d;
  }
}
async function exportAll(){
  const data=JSON.stringify({app:'Tagwerk',date:today(),data:S},null,1),filename=`tagwerk-sicherung-${today()}.json`;
  try{if(await PLATFORM.save(data,filename)){toast('Sicherung gespeichert');return}}
  catch(e){if(e?.code==='declined')return}
  try{await navigator.clipboard.writeText(data);toast('Daten in die Zwischenablage kopiert')}catch{toast('Sichern ist in dieser Ansicht nicht möglich.')}
}
async function importBackup(file){
  try{
    const j=JSON.parse(await file.text()),d=j.data||j;let n=0;
    for(const c of COLS)for(const[id,v]of Object.entries(d[c]||{})){put(c,id,v,false);n++}
    if(!n){toast('In dieser Datei wurden keine Einträge gefunden.');return}
    render();toast(`${n} Einträge übernommen`);
  }catch{toast('Diese Datei konnte nicht gelesen werden.')}
}

/* ---------- Aktionen ---------- */
const A={
  nav(e){const v=e.dataset.v;if(v==='projekte'){ui.open.clear();ui.metric=null}go(v)},
  close(){closeSheet()},
  tg(e){const k=e.dataset.k;if(ui.open.has(k))ui.open.delete(k);else ui.open.add(k);render()},
  treeEdit(){ui.edit=!ui.edit;if(ui.edit)ui.open.add('s:werte');render()},
  /* Aktivitäten */
  open(e){ui.back=ui.view==='aktivitaet'?ui.back:ui.view;go('aktivitaet',{act:e.dataset.id})},
  backTo(){const b=ui.back||'heute';b==='projekt'?go('projekt'):go(b)},
  toggle(e){const id=e.dataset.id,a=clone(S.activities[id]);a.status=statusOf(a)==='done'?'planned':'done';put('activities',id,a)},
  toToday(e){const id=e.dataset.id;put('activities',id,{...clone(S.activities[id]),date:today()})},
  markMissed(e){const id=e.dataset.id;put('activities',id,{...clone(S.activities[id]),status:'missed'})},
  status(e){const a=act();a.status=e.dataset.v;saveAct(a)},
  finish(){const a=act();a.status='done';saveAct(a,false);toast('Gespeichert');A.backTo()},
  actNew(e){sheetActivity({date:e.dataset.d||today(),projectId:ui.view==='projekt'?ui.proj:lastProject()})},
  actEdit(e){const id=e.dataset.id;sheetActivity({id,...S.activities[id]})},
  actDel(e){if(!confirmed(e))return;const id=e.dataset.id;put('activities',id,null,false);closeSheet();toast('Aktivität gelöscht');A.backTo()},
  quickTitle(e){document.getElementById('a-title').value=e.dataset.t},
  copyPrev(e){const p=S.activities[e.dataset.id],a=act();
    a.exercises=clone(p.exercises||[]).map(x=>({name:x.name,sets:(x.sets||[]).map(()=>({kg:null,reps:null}))}));
    a.checklist=clone(p.checklist||[]).map(c=>({...c,done:false}));saveAct(a)},
  clTick(e){const a=act(),c=a.checklist.find(x=>x.id===e.dataset.c);if(c)c.done=!c.done;saveAct(a)},
  clDel(e){const a=act();a.checklist=a.checklist.filter(x=>x.id!==e.dataset.c);saveAct(a)},
  setAdd(e){const i=+e.dataset.i,a=act(),ex=a.exercises[i],l=ex.sets?.[ex.sets.length-1];ex.sets=(ex.sets||[]).concat(l?{...l}:{kg:null,reps:null});saveAct(a);focusOn(`s-${i}-${ex.sets.length-1}-kg`)},
  setDel(e){const a=act();a.exercises[+e.dataset.i].sets.splice(+e.dataset.j,1);saveAct(a)},
  exDel(e){const a=act();a.exercises.splice(+e.dataset.i,1);saveAct(a)},
  exQuick(e){addExercise(e.dataset.n)},
  /* Tag */
  jump(e){ui.sel=e.dataset.d;ui.month=null;go('kalender')},
  sel(e){ui.sel=e.dataset.d;ui.month=ui.sel.slice(0,7);render();if(innerWidth<=880)document.getElementById('pane')?.scrollIntoView({block:'start'})},
  cal(e){const[y,mo]=(ui.month||ui.sel.slice(0,7)).split('-').map(Number);ui.month=iso(new Date(y,mo-1+(+e.dataset.v),1,12)).slice(0,7);render()},
  calNow(){ui.sel=today();ui.month=null;render()},
  dRate(e){const d=e.dataset.d,x=dayLog(d),n=x.rating?x.rating+(+e.dataset.v):3;if(n<1)delete x.rating;else x.rating=Math.min(5,n);put('dailylog',d,x)},
  /* Daily Tasks */
  dGo(e){const n=addDays(ui.dsel||today(),+e.dataset.v);ui.dsel=n>=today()?null:n;render()},
  dTick(e){const{id,d}=e.dataset,x=dayLog(d);if(x.done[id])delete x.done[id];else x.done[id]=true;put('dailylog',d,x)},
  dOpen(e){sheetDaily(e.dataset.id,e.dataset.d)},
  dDel(e){if(!confirmed(e))return;const id=e.dataset.id;put('dailytasks',id,{...clone(S.dailytasks[id]),archived:true},false);closeSheet();render();toast('Daily Task entfernt')},
  /* Projekte */
  projectNew(){sheetProjectNew()},
  projectEdit(e){sheetProject(e.dataset.id)},
  projectDel(e){if(!confirmed(e))return;const id=e.dataset.id;
    for(const t of targetsOf(id))put('targets',t.id,null,false);
    for(const s of setbacksOf(id))put('setbacks',s.id,null,false);
    put('projects',id,null,false);closeSheet();toast('Projekt gelöscht');go('projekte')},
  pOpen(e){openProject(e.dataset.id)},
  mOpen(e){ui.metric=ui.metric===e.dataset.id?null:e.dataset.id;render()},
  range(e){ui.range=+e.dataset.v;render()},
  metrics(e){sheetMetrics(e.dataset.p||ui.proj)},
  groupNew(){sheetGroup()},
  edGroup(e){sheetGroup(e.dataset.id)},
  groupDel(e){if(!confirmed(e))return;const id=e.dataset.id,pid=ui.proj,gone=itemsOf(pid,id).map(x=>x.id);
    setProject(pid,{groups:groupsOf(pid).filter(g=>g.id!==id),metrics:metricsOf(pid).filter(x=>!gone.includes(x.id))});closeSheet();render();toast('Gruppe gelöscht')},
  itemNew(e){sheetMetric('',e.dataset.g)},
  edMetric(e){sheetMetric(e.dataset.id)},
  metricDel(e){if(!confirmed(e))return;const pid=ui.proj;setProject(pid,{metrics:metricsOf(pid).filter(x=>x.id!==e.dataset.id)});closeSheet();render();toast('Eintrag gelöscht')},
  valDel(e){const{m:mid,d}=e.dataset;moveDayValue(mid,d);
    for(const a of actsOn(d).filter(x=>x.projectId===ui.proj&&x.values?.[mid]!=null)){const c=clone(S.activities[a.id]);delete c.values[mid];put('activities',a.id,c,false)}
    render()},
  /* Ziele */
  tgNew(){sheetTarget()},
  tgEdit(e){sheetTarget(e.dataset.id)},
  tgTick(e){const id=e.dataset.id;put('targets',id,{...clone(S.targets[id]),done:!S.targets[id].done})},
  tgDel(e){if(!confirmed(e))return;put('targets',e.dataset.id,null,false);closeSheet();render();toast('Ziel gelöscht')},
  /* Rückschläge */
  sbNew(e){sheetSetback({date:e.dataset.d||today(),projectId:e.dataset.p||(ui.view==='projekt'?ui.proj:'')})},
  sbFromAct(){const a=act();sheetSetback({date:a.date,projectId:a.projectId,what:a.title+(a.reason?': '+a.reason:' ausgelassen')})},
  sbEdit(e){const id=e.dataset.id;sheetSetback({id,...S.setbacks[id]})},
  sbDel(e){if(!confirmed(e))return;put('setbacks',e.dataset.id,null,false);closeSheet();render();toast('Rückschlag gelöscht')},
  exportAll(){exportAll()},
  logout(){PLATFORM.logout()}
};

/* ---------- Ereignisse ---------- */
document.addEventListener('click',e=>{
  if(e.target.id==='sheet'){closeSheet();return}
  const el=e.target.closest('[data-a]');if(!el)return;
  A[el.dataset.a]?.(el);
});
document.addEventListener('keydown',e=>{
  const s=document.getElementById('sheet');if(s.hidden)return;
  if(e.key==='Escape')return closeSheet();
  if(e.key==='Tab'){
    const f=[...s.querySelectorAll('button,input,select,textarea')].filter(x=>!x.closest('[hidden]'));
    if(!f.length)return;
    const a=f[0],b=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();b.focus()}
    else if(!e.shiftKey&&document.activeElement===b){e.preventDefault();a.focus()}
  }
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='imp'&&t.files[0])importBackup(t.files[0]);
  if(t.id==='a-rep')document.getElementById('a-cnt-f').hidden=!t.value;
  if(t.id==='a-proj'){const q=document.getElementById('a-quick');if(q)q.innerHTML=quickChips(t.value)}
  if(t.name==='kind'&&t.closest('#sheet')){
    document.querySelectorAll('#sheet [data-for]').forEach(x=>{x.hidden=!x.dataset.for.split(' ').includes(t.value)});
  }
  if(t.name==='template'){
    const n=document.getElementById('n-name'),tp=TEMPLATES.find(x=>x.id===t.value);
    if(n&&(!n.value||TEMPLATES.some(x=>x.name===n.value)))n.value=t.value==='leer'?'':tp.name;
  }
});
document.addEventListener('input',e=>{
  const t=e.target,ds=t.dataset||{};
  if(ds.set){const[i,j,f]=ds.set.split('|'),a=act();a.exercises[+i].sets[+j][f]=num(t.value);saveAct(a,false)}
  else if(ds.thought){const d=ds.thought,x=dayLog(d);x.thought=t.value;put('dailylog',d,x,false)}
  else if(ds.af){const a=act();a[ds.af]=ds.af==='duration'?num(t.value):t.value;saveAct(a,false)}
  else if(ds.mv){const a=act(),v=num(t.value);a.values=a.values||{};
    if(v===null)delete a.values[ds.mv];else a.values[ds.mv]=v;
    moveDayValue(ds.mv,a.date);saveAct(a,false)}
});
const F={
  activity(fd,f){
    const title=(fd.get('title')||'').trim();if(!title)return;
    const date=fd.get('date'),time=fd.get('time')||'',projectId=fd.get('project')||'',id=f.dataset.id;
    if(id){put('activities',id,{...clone(S.activities[id]),title,date,time,projectId},false);ui.sel=date;closeSheet();render();toast('Gespeichert');return}
    const step=fd.get('repeat')||'';
    try{localStorage.setItem('tagwerk-lastproject',projectId)}catch{}
    createActivities({title,date,time,projectId,count:step?+fd.get('count'):1,step});
    ui.sel=date;ui.month=null;closeSheet();render();toast(step?'Serie im Kalender eingetragen':'Im Kalender eingetragen');
  },
  check(fd){const text=(fd.get('text')||'').trim();if(!text)return;const a=act();a.checklist=(a.checklist||[]).concat({id:uid(),text,done:false});saveAct(a);focusOn('cl-text')},
  ex(fd){const n=(fd.get('name')||'').trim();if(n)addExercise(n)},
  daily(fd){const n=(fd.get('name')||'').trim();if(!n)return;put('dailytasks',uid(),{name:n,order:nextOrder('dailytasks'),archived:false,start:ui.dsel||today()});focusOn('daily-name')},
  dailyEdit(fd,f){
    const{id,d}=f.dataset,x=dayLog(d),note=(fd.get('note')||'').trim(),name=(fd.get('name')||'').trim(),days=fd.getAll('days').map(Number);if(!name)return;
    if(!days.length){toast('Wähle mindestens einen Tag aus.');return}
    x.info=x.info||{};if(note)x.info[id]={note};else delete x.info[id];
    put('dailylog',d,x,false);
    put('dailytasks',id,{...clone(S.dailytasks[id]),name,projectId:fd.get('project')||'',time:fd.get('time')||'',start:fd.get('start')||S.dailytasks[id].start||'',days:days.length===7?[]:days},false);
    closeSheet();render();toast('Gespeichert');
  },
  projectNew(fd){
    const name=(fd.get('name')||'').trim();if(!name)return;
    const id='p'+uid();put('projects',id,projectFromTemplate(fd.get('template'),name),false);
    closeSheet();openProject(id);ui.edit=!metricsOf(id).length;render();toast('Projekt angelegt');
  },
  project(fd,f){
    const name=(fd.get('name')||'').trim(),id=f.dataset.id;if(!name)return;
    const on=fd.getAll('f');
    setProject(id,{name,color:fd.get('color'),fields:{duration:on.includes('duration'),checklist:on.includes('checklist'),sets:on.includes('sets')},quick:(fd.get('quick')||'').split(',').map(s=>s.trim()).filter(Boolean)});
    closeSheet();render();toast('Gespeichert');
  },
  group(fd,f){
    const name=(fd.get('name')||'').trim(),id=f.dataset.id,pid=ui.proj;if(!name)return;
    if(id)setProject(pid,{groups:groupsOf(pid).map(g=>g.id===id?{...g,name}:g)});
    else{const gid='g'+uid();setProject(pid,{groups:[...groupsOf(pid),{id:gid,name}]});ui.open.add('g:'+gid)}
    closeSheet();render();toast('Gespeichert');
  },
  metric(fd,f){
    const name=(fd.get('name')||'').trim(),unit=(fd.get('unit')||'').trim(),mode=fd.get('mode'),{id,g}=f.dataset,pid=ui.proj;if(!name)return;
    if(!unit){toast('Gib eine Einheit an, zum Beispiel kg oder €.');return}
    if(id)setProject(pid,{metrics:metricsOf(pid).map(x=>x.id===id?{...x,name,unit,mode,groupId:fd.get('group'),ex:x.kind==='exercise'?(x.ex||x.name):x.ex}:x)});
    else{setProject(pid,{metrics:[...metricsOf(pid),{id:'c'+uid(),name,unit,mode,kind:fd.get('fromex')?'exercise':'manual',groupId:g}]});ui.open.add('g:'+g)}
    closeSheet();render();toast('Gespeichert');
  },
  metrics(fd,f){
    const pid=f.dataset.p,ids=fd.getAll('m'),catalog=CATALOG.flatMap(([,l])=>l.map(x=>x.id));
    let groups=clone(groupsOf(pid));
    const list=metricsOf(pid).filter(x=>!catalog.includes(x.id)||ids.includes(x.id));
    for(const id of ids)if(!list.some(x=>x.id===id)){
      const name=catalogGroup(id);let g=groups.find(x=>sameName(x.name,name));
      if(!g){g={id:'g'+uid(),name};groups.push(g)}
      list.push({...catalogItem(id),groupId:g.id});
    }
    setProject(pid,{groups,metrics:clone(list)});closeSheet();render();toast('Werte gespeichert');
  },
  target(fd,f){
    const id=f.dataset.id,old=id?S.targets[id]:null,name=(fd.get('name')||'').trim(),kind=fd.get('kind');if(!name)return;
    const pid=old?.projectId||ui.proj,doc={projectId:pid,name,kind,due:fd.get('due')||'',created:old?.created||today(),order:old?.order??nextOrder('targets'),done:!!old?.done,celebrated:!!old?.celebrated};
    if(kind!=='milestone'){
      doc.target=num(fd.get('target'));
      if(doc.target===null){toast('Trag einen Zielwert ein.');return}
    }
    if(kind==='metric'){
      doc.metricId=fd.get('metric');
      const m=metricOf(pid,doc.metricId);
      if(!m){toast('Lege zuerst einen Wert im Projekt an.');return}
      const given=num(fd.get('start'));
      doc.start=given??(m.mode==='sum'?0:(series(m,pid).at(-1)?.v??0));
    }
    put('targets',id||uid(),doc,false);closeSheet();render();toast('Ziel gespeichert');
  },
  setback(fd,f){
    const what=(fd.get('what')||'').trim();if(!what)return;
    const id=f.dataset.id||uid(),old=S.setbacks[id];
    put('setbacks',id,{date:fd.get('date'),projectId:fd.get('project')||'',what,trigger:fd.get('trigger')||'',next:(fd.get('next')||'').trim(),at:old?.at||new Date().toISOString()},false);
    closeSheet();render();toast('Rückschlag gespeichert');
  }
};
document.addEventListener('submit',e=>{
  const f=e.target.closest('form[data-f]');if(!f)return;
  e.preventDefault();F[f.dataset.f]?.(new FormData(f),f);
});
let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{if(ui.view==='projekt'&&ui.metric)softRender()},200)});

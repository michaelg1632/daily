/* ---------- Symbole und Bausteine ---------- */
const ICON={
 tick:'<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10.5l4 4 8-9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 cross:'<svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
 pen:'<svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 17l1-4L13.5 3.5a2 2 0 0 1 3 3L7 16l-4 1zM12 5l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 heute:'<svg viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M3 4h16v15H3zM3 9h16M7 2v4M15 2v4" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 14l2 2 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 kalender:'<svg viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M3 4h16v15H3zM3 9h16M9 9v10M14 9v10M3 14h16" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
 daily:'<svg viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M4 6l2 2 3-3.5M4 15l2 2 3-3.5M12 7h7M12 16h7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 projekte:'<svg viewBox="0 0 22 22" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="8.2" stroke="currentColor" stroke-width="1.8"/><circle cx="11" cy="11" r="4.4" stroke="currentColor" stroke-width="1.8"/><circle cx="11" cy="11" r="1.2" fill="currentColor"/></svg>'
};
const VIEWS=[['heute','Heute'],['kalender','Kalender'],['daily','Daily Tasks'],['projekte','Projekte &amp; Ziele']];
const STATUS={planned:'Geplant',done:'Erledigt',missed:'Ausgelassen'};

const pillFor=a=>`<span class="pill ${statusOf(a)}">${STATUS[statusOf(a)]}</span>`;
const dot=c=>c?`<i class="dot" style="background:${esc(c)}"></i>`:'';
const projectTag=pid=>hasProject(pid)?`<span class="proj">${dot(colorOf(pid))}${esc(P(pid).name)}</span>`:'';
const empty=(title,text)=>`<div class="empty">${title?`<b>${title}</b>`:''}${text||''}</div>`;
const editBtn=(a,attrs,label)=>`<button class="pen s" data-a="${a}" ${attrs} aria-label="${esc(label)}">${ICON.pen}</button>`;
function fold(k,title,meta,body){
  const open=ui.open.has(k);
  return`<section class="fold"><button class="fold-b" data-a="tg" data-k="${esc(k)}" aria-expanded="${open}"><span class="chev" aria-hidden="true">›</span><span class="fold-t">${title}</span><span class="sec-meta">${meta}</span></button>${open?`<div class="fold-c">${body}</div>`:''}</section>`;
}
function actSummary(a){
  const out=[],ex=a.exercises||[],cl=a.checklist||[];
  if(a.duration)out.push(a.duration+' Min.');
  if(cl.length)out.push(`${cl.filter(c=>c.done).length} von ${cl.length} Punkten`);
  if(ex.length)out.push(`${plural(ex.length,'Übung','Übungen')}, ${plural(ex.reduce((n,e)=>n+(e.sets||[]).length,0),'Satz','Sätze')}`);
  return out.map(x=>`<span>${x}</span>`).join('');
}
function actRow(a,when,inProject){
  return`<div class="act"><button class="act-open" data-a="open" data-id="${a.id}">
    <span class="act-title">${esc(a.title)}</span>
    <span class="act-sub">${when?`<span>${esc(dayName(a.date))}</span>`:''}${a.time?`<span>${esc(a.time)}</span>`:''}${inProject?'':projectTag(a.projectId)}${pillFor(a)}${actSummary(a)}</span></button>
    <button class="tick" data-a="toggle" data-id="${a.id}" aria-pressed="${statusOf(a)==='done'}" aria-label="${esc(a.title)} als erledigt markieren">${ICON.tick}</button></div>`;
}
function actsBlock(d){
  const l=actsOn(d);
  return`<section><div class="sec-head"><h2>Aktivitäten</h2><button class="btn" data-a="actNew" data-d="${d}">Aktivität planen</button></div>
  ${l.length?l.map(a=>actRow(a)).join(''):empty('Nichts geplant.','Plane etwas, das dich heute weiterbringt.')}</section>`;
}
function overdueBlock(){
  const l=overdue();if(!l.length)return'';
  return`<section><div class="sec-head"><h2>Noch offen</h2><span class="sec-meta">${l.length}</span></div>
  ${l.slice(0,5).map(a=>`<div class="act"><button class="act-open" data-a="open" data-id="${a.id}"><span class="act-title">${esc(a.title)}</span>
    <span class="act-sub"><span>${esc(dayName(a.date))}</span>${projectTag(a.projectId)}</span></button>
    <div class="act-links"><button class="link" data-a="toToday" data-id="${a.id}">Auf heute</button><button class="link quiet" data-a="markMissed" data-id="${a.id}">Ausgelassen</button></div>
    <button class="tick" data-a="toggle" data-id="${a.id}" aria-pressed="false" aria-label="${esc(a.title)} als erledigt markieren">${ICON.tick}</button></div>`).join('')}
  ${l.length>5?`<p class="note">Und ${l.length-5} weitere im Kalender.</p>`:''}</section>`;
}

/* ---------- Heute ---------- */
function leaf(d){
  const p=parse(d),l=actsOn(d),mon=weekStart(d);
  return`<div class="leaf"><div class="leaf-body">
    <div class="leaf-head"><span>KW ${isoWeek(d)}</span><span>Tag ${dayOfYear(d)} von ${daysInYear(d)}</span></div>
    <div class="leaf-num">${p.getDate()}</div>
    <div><div class="leaf-wd">${WD[dow(d)]}</div><div class="leaf-sub">${MON[p.getMonth()]} ${p.getFullYear()}${l.length?` · ${plural(l.length,'Aktivität','Aktivitäten')}`:''}</div></div>
    <div class="week">${[0,1,2,3,4,5,6].map(i=>{const x=addDays(mon,i);return`<button data-a="jump" data-d="${x}" class="${x===d?'now':''}" aria-label="${longDate(x)} im Kalender öffnen">${WD2[i]}<span class="segs">${actsOn(x).map(y=>`<span class="seg ${statusOf(y)}"></span>`).join('')}</span></button>`}).join('')}</div>
  </div></div>`;
}
function dailyRows(d,list,inProject){
  return list.map(t=>{
    const n=dailyStreak(t),i=S.dailylog[d]?.info?.[t.id];
    const sub=[t.time?`<span class="proj">${esc(t.time)}</span>`:'',inProject?'':projectTag(t.projectId),n>1?`<span>${n} Tage in Folge</span>`:'',i?.note?`<span class="d-note">${esc(i.note)}</span>`:''].join('');
    return`<div class="act"><button class="act-open" data-a="dOpen" data-id="${t.id}" data-d="${d}"><span class="act-title">${esc(t.name)}</span>${sub?`<span class="act-sub">${sub}</span>`:''}</button>
    <button class="tick" data-a="dTick" data-id="${t.id}" data-d="${d}" aria-pressed="${dailyDone(t.id,d)}" aria-label="${esc(t.name)} erledigt">${ICON.tick}</button></div>`;
  }).join('');
}
const dailyBar=(d,l)=>`<div class="segs d-bar">${l.map(t=>`<span class="seg ${dailyDone(t.id,d)?'done':''}"></span>`).join('')}</div>`;
function dailyBlock(d){
  const l=dailyFor(d);if(!l.length)return'';
  return`<section><div class="sec-head"><h2>Daily Tasks</h2><span class="sec-meta">${l.filter(t=>dailyDone(t.id,d)).length} von ${l.length} erledigt</span></div>${dailyBar(d,l)}${dailyRows(d,l)}</section>`;
}
function thoughtBlock(d){
  const r=S.dailylog[d]?.rating;
  return`<section><div class="sec-head"><h2>Gedanken des Tages</h2></div>
  <textarea id="thought" data-thought="${d}" aria-label="Gedanken des Tages" placeholder="Was geht dir heute durch den Kopf?">${esc(S.dailylog[d]?.thought||'')}</textarea>
  <div class="rate"><span>Tageswertung</span><button data-a="dRate" data-d="${d}" data-v="-0.5" aria-label="Wertung senken">−</button><b>${r?fmt(r):'–'}<small> / 5</small></b><button data-a="dRate" data-d="${d}" data-v="0.5" aria-label="Wertung erhöhen">+</button></div></section>`;
}
function welcomeBlock(){
  if(projectIds().length||acts().length||dailyTasks().length)return'';
  return`<section><div class="sec-head"><h2>Willkommen bei Tagwerk</h2></div>
  <p class="lead">Lege für jeden Bereich deines Lebens ein Projekt an, zum Beispiel Gesundheit, Finanzen oder ein eigenes Vorhaben. Danach planst du Aktivitäten und verfolgst deine Ziele.</p>
  <button class="btn" data-a="projectNew">Erstes Projekt anlegen</button></section>`;
}
function viewToday(){
  const d=today();
  return`<div class="day-grid"><div class="side">${leaf(d)}</div><div class="main-col">${welcomeBlock()}${overdueBlock()}${actsBlock(d)}${dailyBlock(d)}${thoughtBlock(d)}
    <div class="foot-link"><button class="link quiet" data-a="sbNew" data-d="${d}">Rückschlag eintragen</button></div></div></div>`;
}

/* ---------- Kalender ---------- */
function viewCalendar(){
  const[y,mo]=(ui.month||ui.sel.slice(0,7)).split('-').map(Number);
  const first=iso(new Date(y,mo-1,1,12)),t=today();
  let d=weekStart(first);
  let cells='<span class="dow k">KW</span>'+WD2.map(w=>`<span class="dow">${w}</span>`).join('');
  for(let w=0;w<6;w++){
    if(w>0&&parse(d).getMonth()!==mo-1)break;
    cells+=`<span class="kw">${isoWeek(d)}</span>`;
    for(let i=0;i<7;i++){
      const inM=parse(d).getMonth()===mo-1,l=actsOn(d);
      cells+=`<button class="cell ${inM?'':'out'} ${d===t?'today':''} ${d===ui.sel?'sel':''}" data-a="sel" data-d="${d}" aria-label="${longDate(d)}${l.length?': '+esc(l.map(a=>a.title).join(', ')):''}" ${d===ui.sel?'aria-current="date"':''}>
        <span class="cell-n">${parse(d).getDate()}</span>${l.slice(0,2).map(a=>`<span class="ev ${statusOf(a)}" style="--c:${esc(colorOf(a.projectId)||'transparent')}">${esc(shortTitle(a.title))}</span>`).join('')}${l.length>2?`<span class="ev more">+${l.length-2}</span>`:''}</button>`;
      d=addDays(d,1);
    }
  }
  const s=ui.sel;
  return`<div class="cal-grid"><section>
    <div class="cal-head"><div class="cal-title">${MON[mo-1]} ${y}</div>
      <div class="cal-nav"><button class="btn ghost" data-a="calNow">Heute</button><button class="stp" data-a="cal" data-v="-1" aria-label="Voriger Monat">‹</button><button class="stp" data-a="cal" data-v="1" aria-label="Nächster Monat">›</button></div></div>
    <div class="month">${cells}</div>
    <div class="key"><span><i class="planned"></i>Geplant</span><span><i class="done"></i>Erledigt</span><span><i class="missed"></i>Ausgelassen</span></div>
  </section>
  <div class="pane" id="pane"><h2 class="h-big">${esc(dayName(s))}</h2>${actsBlock(s)}${s<t&&(S.dailylog[s]?.thought||S.dailylog[s]?.rating)?thoughtBlock(s):''}</div></div>`;
}

/* ---------- Daily Tasks ---------- */
function viewDaily(){
  const d=ui.dsel&&ui.dsel<today()?ui.dsel:today(),l=dailyFor(d),all=dailyTasks();
  return`<div class="narrow"><div class="sec-head"><h2 class="h-big">Daily Tasks</h2>
    <div class="cal-nav"><button class="stp" data-a="dGo" data-v="-1" aria-label="Voriger Tag">‹</button><button class="stp" data-a="dGo" data-v="1" aria-label="Nächster Tag" ${d===today()?'disabled':''}>›</button></div></div>
  <section><div class="sec-head"><h2>${esc(dayName(d))}</h2><span class="sec-meta">${l.filter(t=>dailyDone(t.id,d)).length} von ${l.length} erledigt</span></div>
    ${l.length?dailyBar(d,l)+dailyRows(d,l):empty(all.length?'An diesem Tag nichts dran.':'Noch keine Daily Tasks.','Trag ein, was du regelmäßig erledigen willst. Tippe auf einen Task, um ihn anzupassen.')}
    <form class="addline" data-f="daily"><input type="text" id="daily-name" name="name" placeholder="Neuer Daily Task" aria-label="Neuer Daily Task" autocomplete="off" required><button class="btn">Hinzufügen</button></form>
  </section></div>`;
}

/* ---------- Aktivität ---------- */
function valuesBlock(a,f){
  const pid=a.projectId;
  const shown=x=>!(f.sets&&x.kind==='exercise');
  const legacy=S.measurements[a.date]?.values||{};
  const row=x=>{
    const v=a.values?.[x.id]??legacy[x.id];
    return`<div class="vrow"><label for="v-${x.id}">${esc(x.name)}</label><input type="text" inputmode="decimal" id="v-${x.id}" data-mv="${x.id}" value="${v!=null?fmt(v):''}" autocomplete="off"><span class="u">${esc(x.unit)}</span></div>`;
  };
  const gs=groupsOf(pid).map(g=>[g,itemsOf(pid,g.id).filter(shown)]).filter(([,it])=>it.length);
  if(!gs.length&&f.sets)return'';
  const multi=gs.length>1;
  return`<section><div class="sec-head"><h2>Werte</h2><button class="link quiet" data-a="metrics" data-p="${esc(pid)}">Werte auswählen</button></div>
  ${gs.length?gs.map(([g,it])=>`${multi?`<h3 class="vgroup">${esc(g.name)}</h3>`:''}<div>${it.map(row).join('')}</div>`).join(''):empty('','Noch keine Werte ausgewählt.')}</section>`;
}
function checklistBlock(a){
  const l=a.checklist||[];
  return`<section><div class="sec-head"><h2>Checkliste</h2>${l.length?`<span class="sec-meta">${l.filter(c=>c.done).length} von ${l.length}</span>`:''}</div>
  ${l.map(c=>`<div class="task ${c.done?'done':''}"><button class="box" data-a="clTick" data-c="${c.id}" aria-pressed="${!!c.done}" aria-label="${esc(c.text)} abhaken">${ICON.tick}</button><div class="t-text">${esc(c.text)}</div><button class="x" data-a="clDel" data-c="${c.id}" aria-label="${esc(c.text)} löschen">${ICON.cross}</button></div>`).join('')}
  <form class="addline" data-f="check"><input type="text" id="cl-text" name="text" placeholder="Punkt hinzufügen" aria-label="Punkt hinzufügen" autocomplete="off" required><button class="btn">Hinzufügen</button></form></section>`;
}
function lastExercise(name,a){
  const l=acts().filter(x=>x.id!==a.id&&x.date<=a.date&&(x.exercises||[]).some(e=>sameName(e.name,name)&&(e.sets||[]).some(s=>s.kg!=null||s.reps!=null))).sort(byTime);
  const p=l[l.length-1];return p?p.exercises.find(e=>sameName(e.name,name)):null;
}
const setText=s=>(s.kg!=null?fmt(s.kg)+' kg':'')+(s.kg!=null&&s.reps!=null?' × ':'')+(s.reps!=null?s.reps+' Wdh.':'');
function exerciseCard(a,ex,i){
  const last=lastExercise(ex.name,a),sets=ex.sets||[];
  return`<div class="ex"><div class="ex-head"><div class="ex-name">${esc(ex.name)}</div><button class="link quiet" data-a="exDel" data-i="${i}" aria-label="${esc(ex.name)} entfernen">Entfernen</button></div>
  <div class="ex-last">${last?`Letztes Mal: ${esc((last.sets||[]).map(setText).filter(Boolean).join(', '))}`:'Noch kein früherer Eintrag'}</div>
  ${sets.length?`<div class="sets"><span class="h">Satz</span><span class="h">kg</span><span class="h">Wdh.</span><span></span>
  ${sets.map((s,j)=>{const lj=last?.sets?.[j];return`<span class="n">${j+1}</span>
    <input type="text" inputmode="decimal" id="s-${i}-${j}-kg" data-set="${i}|${j}|kg" value="${s.kg!=null?fmt(s.kg):''}" placeholder="${lj?.kg!=null?fmt(lj.kg):''}" aria-label="${esc(ex.name)}, Satz ${j+1}, Gewicht in kg" autocomplete="off">
    <input type="text" inputmode="numeric" id="s-${i}-${j}-reps" data-set="${i}|${j}|reps" value="${s.reps!=null?s.reps:''}" placeholder="${lj?.reps!=null?lj.reps:''}" aria-label="${esc(ex.name)}, Satz ${j+1}, Wiederholungen" autocomplete="off">
    <button class="x" data-a="setDel" data-i="${i}" data-j="${j}" aria-label="Satz ${j+1} löschen">${ICON.cross}</button>`}).join('')}</div>`:''}
  <div class="ex-acts"><button class="btn ghost" data-a="setAdd" data-i="${i}">Satz hinzufügen</button></div></div>`;
}
function exerciseBlock(a){
  const exs=a.exercises||[],all=exs.flatMap(e=>e.sets||[]),vol=all.reduce((n,s)=>n+(s.kg||0)*(s.reps||0),0);
  const used=[...new Set(actsOf(a.projectId).sort(byTime).reverse().flatMap(x=>(x.exercises||[]).map(e=>e.name)))];
  const sug=[...used,...EXERCISES].filter((n,i,l)=>l.findIndex(o=>sameName(o,n))===i&&!exs.some(e=>sameName(e.name,n))).slice(0,6);
  return`<section><div class="sec-head"><h2>Übungen</h2><span class="sum">${all.length?`${plural(all.length,'Satz','Sätze')}${vol?' · '+fmt(vol)+' kg Volumen':''}`:''}</span></div>
    <div class="ex-list">${exs.map((e,i)=>exerciseCard(a,e,i)).join('')}</div>
    <form class="addline" data-f="ex"><input type="text" id="ex-name" name="name" list="ex-list" placeholder="Übung hinzufügen" aria-label="Übung hinzufügen" autocomplete="off" required><button class="btn">Hinzufügen</button></form>
    <div class="chips sug">${sug.map(n=>`<button class="chip" data-a="exQuick" data-n="${esc(n)}">+ ${esc(n)}</button>`).join('')}</div></section>`;
}
function previousSame(a){
  const l=acts().filter(x=>x.id!==a.id&&x.title===a.title&&((x.exercises||[]).length||(x.checklist||[]).length)&&x.date<=a.date).sort(byTime);
  return l[l.length-1]||null;
}
function viewActivity(){
  const a=S.activities[ui.act]?{id:ui.act,...S.activities[ui.act]}:null;
  if(!a)return`<button class="back" data-a="backTo">‹ Zurück</button>${empty('Diese Aktivität gibt es nicht mehr.','')}`;
  const pid=a.projectId,inProject=hasProject(pid),f=fieldsOf(pid),st=statusOf(a);
  const prev=!(a.exercises||[]).length&&!(a.checklist||[]).length&&previousSame(a);
  return`<div class="narrow stack">
    <div><button class="back" data-a="backTo">‹ Zurück</button>
      <div class="t-title">${esc(a.title)}</div>
      <div class="act-sub big"><span>${esc(longDate(a.date))}${a.time?', '+esc(a.time):''}</span>${projectTag(pid)}<button class="link quiet" data-a="actEdit" data-id="${a.id}">Bearbeiten</button></div></div>
    <div class="seg-ctl" role="group" aria-label="Status">${Object.entries(STATUS).map(([k,l])=>`<button data-a="status" data-v="${k}" aria-pressed="${st===k}">${l}</button>`).join('')}</div>
    ${st==='missed'?`<div class="fld"><label for="a-reason">Warum ausgelassen?</label><input type="text" id="a-reason" data-af="reason" value="${esc(a.reason||'')}" placeholder="Kurz festhalten, was dazwischenkam"><button class="link quiet start" data-a="sbFromAct">Als Rückschlag festhalten</button></div>`:''}
    ${prev?`<button class="btn ghost wide" data-a="copyPrev" data-id="${prev.id}">Inhalt von ${esc(shortDate(prev.date))} übernehmen</button>`:''}
    ${f.duration?`<div class="vrow solo"><label for="a-dur">Dauer</label><input type="text" inputmode="numeric" id="a-dur" data-af="duration" value="${a.duration??''}" autocomplete="off"><span class="u">Min.</span></div>`:''}
    ${inProject?valuesBlock(a,f):''}
    ${f.checklist?checklistBlock(a):''}
    ${f.sets?exerciseBlock(a):''}
    <div class="fld"><label for="a-note">Notiz</label><textarea id="a-note" data-af="note" placeholder="Wie lief es?">${esc(a.note||'')}</textarea></div>
    ${st==='done'?'':'<button class="btn" data-a="finish">Als erledigt speichern</button>'}
  </div>`;
}

/* ---------- Diagramm ---------- */
let chartData=null;
function lineChart(pts,unit){
  const box=document.getElementById('view'),cw=box.clientWidth,W=Math.max(260,cw>880?cw/2-70:cw-52),H=200,l=46,r=14,t=12,b=24;
  const t0=parse(pts[0].d).getTime(),t1=parse(pts[pts.length-1].d).getTime(),span=Math.max(1,t1-t0);
  let lo=Math.min(...pts.map(p=>p.v)),hi=Math.max(...pts.map(p=>p.v));
  const padV=Math.max((hi-lo)*.15,Math.abs(hi)*.02,.5);lo-=padV;hi+=padV;
  const x=d=>pts.length>1?l+(parse(d).getTime()-t0)/span*(W-l-r):(l+W-r)/2,y=v=>t+(hi-v)*(H-t-b)/(hi-lo);
  const uniq=[...new Set([lo+padV,(lo+hi)/2,hi-padV].map(v=>Math.round(v*10)/10))];
  const grid=uniq.map(v=>`<line x1="${l}" x2="${W-r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${l-8}" y="${y(v)+4}" text-anchor="end">${fmt(v)}</text>`).join('');
  const line=pts.map((p,i)=>(i?'L':'M')+x(p.d).toFixed(1)+' '+y(p.v).toFixed(1)).join(' ');
  const path=pts.length>1?`<path d="${line} L${x(pts[pts.length-1].d).toFixed(1)} ${H-b} L${x(pts[0].d).toFixed(1)} ${H-b}Z" fill="var(--pen-soft)"/><path d="${line}" fill="none" stroke="var(--pen)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`:'';
  const dots=pts.map((p,i)=>`<circle cx="${x(p.d)}" cy="${y(p.v)}" r="${i===pts.length-1?5.5:pts.length>40?2:3.5}" fill="var(--pen)" stroke="var(--paper)" stroke-width="1.5"/>`).join('');
  const lab=pts.length>1?`<text x="${l}" y="${H-6}">${shortDate(pts[0].d)}</text><text x="${W-r}" y="${H-6}" text-anchor="end">${shortDate(pts[pts.length-1].d)}</text>`:`<text x="${(l+W-r)/2}" y="${H-6}" text-anchor="middle">${shortDate(pts[0].d)}</text>`;
  chartData={W,unit,pts:pts.map(p=>({...p,X:x(p.d)}))};
  return`<div class="chart" id="vchart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Verlauf mit ${plural(pts.length,'Eintrag','Einträgen')}">${grid}${path}<line id="vx" y1="${t}" y2="${H-b}" stroke="var(--muted)" visibility="hidden"/>${dots}${lab}</svg><div class="tip" id="vtip" hidden></div></div>`;
}
function hookChart(){
  const c=document.getElementById('vchart');if(!c||!chartData)return;
  const{W,unit,pts}=chartData,tip=c.querySelector('#vtip'),vx=c.querySelector('#vx'),svg=c.querySelector('svg');
  const move=e=>{
    const b=svg.getBoundingClientRect(),px=(e.clientX-b.left)*W/b.width;
    const p=pts.reduce((a,q)=>Math.abs(q.X-px)<Math.abs(a.X-px)?q:a,pts[0]);
    vx.setAttribute('x1',p.X);vx.setAttribute('x2',p.X);vx.setAttribute('visibility','visible');
    tip.hidden=false;tip.textContent=shortDate(p.d)+': '+fmt(p.v)+' '+unit;
    tip.style.left=Math.max(70,Math.min(b.width-70,p.X*b.width/W))+'px';
  };
  c.addEventListener('pointermove',move);c.addEventListener('pointerdown',move);
  c.addEventListener('pointerleave',()=>{tip.hidden=true;vx.setAttribute('visibility','hidden')});
}

/* ---------- Projekt ---------- */
function metricDetail(m,pid){
  const s=series(m,pid),from=ui.range?addDays(today(),-ui.range):'',sum=m.mode==='sum';
  const part=s.filter(p=>p.d>=from);
  let run=0;const pts=sum?part.map(p=>({d:p.d,v:run+=p.v})):part;
  const stats=!s.length?'':sum
    ?`<div><b>${fmt(sumOf(part))}</b><span>${esc(m.unit)} im Zeitraum</span></div><div><b>${fmt(sumOf(s,today().slice(0,8)+'01'))}</b><span>${esc(m.unit)} diesen Monat</span></div><div><b>${part.length}</b><span>Einträge</span></div>`
    :`<div><b>${fmt(s[s.length-1].v)}</b><span>${esc(m.unit)} aktuell</span></div><div><b>${s.length>1?(s[s.length-1].v>=s[0].v?'+':'')+fmt(s[s.length-1].v-s[0].v):'–'}</b><span>seit dem Start</span></div><div><b>${fmt(Math.max(...s.map(p=>p.v)))}</b><span>Höchstwert</span></div>`;
  return`<div class="detail">
    <div class="seg-ctl small">${[[30,'30 Tage'],[90,'90 Tage'],[0,'Alles']].map(([n,l])=>`<button data-a="range" data-v="${n}" aria-pressed="${ui.range===n}">${l}</button>`).join('')}</div>
    ${stats?`<div class="ministats">${stats}</div>`:''}
    ${pts.length?lineChart(pts,m.unit):`<p class="note">Noch keine Einträge in diesem Zeitraum. Öffne eine Aktivität aus diesem Projekt und trag den Wert dort ein.</p>`}
    ${m.kind==='exercise'?`<p class="note">Der beste Satz aus deinen Übungen fließt automatisch ein.</p>`:''}
    ${s.length?`<div class="hist">${s.slice(-6).reverse().map(p=>`<span>${esc(shortDate(p.d))}</span><b>${fmt(p.v)} ${esc(m.unit)}</b><button class="link quiet" data-a="valDel" data-m="${esc(m.id)}" data-d="${p.d}" aria-label="Eintrag vom ${esc(shortDate(p.d))} löschen">Löschen</button>`).join('')}</div>`:''}
  </div>`;
}
function metricsTree(pid){
  const gs=groupsOf(pid);let h='';
  for(const g of gs){
    const it=itemsOf(pid,g.id),k='g:'+g.id,open=ui.open.has(k);
    if(!it.length&&!ui.edit)continue;
    h+=`<div class="tr l1"><button class="tr-b" data-a="tg" data-k="${esc(k)}" aria-expanded="${open}"><span class="chev" aria-hidden="true">›</span><span class="tr-n">${esc(g.name)}</span><span class="tr-m">${it.length}</span></button>${ui.edit?editBtn('edGroup',`data-id="${esc(g.id)}"`,g.name+' bearbeiten'):''}</div>`;
    if(!open)continue;
    for(const x of it){
      const sel=ui.metric===x.id;
      h+=`<div class="tr l2"><button class="tr-b" data-a="mOpen" data-id="${esc(x.id)}" aria-expanded="${sel}"><span class="chev" aria-hidden="true">›</span><span class="tr-n">${esc(x.name)}</span><span class="tr-m">${esc(metricLabel(x,pid))}</span></button>${ui.edit?editBtn('edMetric',`data-id="${esc(x.id)}"`,x.name+' bearbeiten'):''}</div>`;
      if(sel)h+=metricDetail(x,pid);
    }
    if(ui.edit)h+=`<div class="tr-add"><button class="link" data-a="itemNew" data-g="${esc(g.id)}">Eintrag hinzufügen</button></div>`;
  }
  const links=ui.edit?`<div class="tr-add first"><button class="link" data-a="groupNew">Gruppe hinzufügen</button><button class="link" data-a="metrics" data-p="${esc(pid)}">Aus Vorlagen wählen</button></div>`:'';
  return(h||(ui.edit?'':empty('Noch keine Werte.',`<button class="link" data-a="metrics" data-p="${esc(pid)}">Werte auswählen</button>`)))+links;
}
function targetRow(t){
  const st=targetState(t),u=targetUnit(t),due=targetDue(t,st);
  const line=t.kind==='milestone'?(st.reached?'Geschafft':'Offen'):st.lost?'Der zugehörige Wert wurde gelöscht':`${fmt(st.cur)} von ${fmt(st.target)} ${esc(u)}`;
  return`<div class="target ${st.reached?'reached':''}"><button class="tg-open" data-a="tgEdit" data-id="${t.id}"><span class="tg-name">${esc(t.name)}</span>
    <span class="tg-bar"><i style="width:${Math.round(st.pct*100)}%"></i></span>
    <span class="tg-sub"><span>${line}</span>${st.reached?'<span class="pill done">Erreicht</span>':due?`<span>${due}</span>`:''}</span></button>
    ${t.kind==='milestone'?`<button class="tick" data-a="tgTick" data-id="${t.id}" aria-pressed="${!!t.done}" aria-label="${esc(t.name)} abhaken">${ICON.tick}</button>`:''}</div>`;
}
const sbRow=s=>`<button class="sb" data-a="sbEdit" data-id="${s.id}"><span class="sb-top"><span>${esc(dayName(s.date))}</span>${s.trigger?`<span class="tag">${esc(s.trigger)}</span>`:''}</span><span class="sb-what">${esc(s.what)}</span>${s.next?`<span class="sb-next"><b>Nächstes Mal:</b> ${esc(s.next)}</span>`:''}</button>`;
function weekBars(l){
  const mon=weekStart(today()),w=[];
  for(let i=7;i>=0;i--){const st=addDays(mon,-7*i),en=addDays(st,6);w.push({st,n:l.filter(a=>statusOf(a)==='done'&&a.date>=st&&a.date<=en).length})}
  const max=Math.max(1,...w.map(x=>x.n));
  return`<div class="bars" role="img" aria-label="Erledigte Aktivitäten pro Kalenderwoche">${w.map(x=>`<div class="bar ${x.n?'':'zero'}" title="KW ${isoWeek(x.st)}: ${x.n}"><span>${x.n||''}</span><i style="height:${x.n?Math.round(x.n/max*88):0}px"></i><span>${isoWeek(x.st)}</span></div>`).join('')}</div><p class="note">Erledigte Aktivitäten pro Kalenderwoche</p>`;
}
function viewProject(){
  const pid=ui.proj;
  if(!hasProject(pid))return`<button class="back" data-a="nav" data-v="projekte">‹ Projekte &amp; Ziele</button>${empty('Dieses Projekt gibt es nicht mehr.','')}`;
  const p=P(pid),t=today(),mon=weekStart(t),from=addDays(t,-29),l=actsOf(pid);
  const week=l.filter(a=>statusOf(a)==='done'&&a.date>=mon&&a.date<=addDays(mon,6)).length;
  const r30=l.filter(a=>a.date>=from&&a.date<=t),done=r30.filter(a=>statusOf(a)==='done');
  const minutes=done.reduce((n,a)=>n+(a.duration||0),0);
  const fourth=minutes?`<b>${fmt(Math.round(minutes/6)/10)}</b><span>Stunden in 30 Tagen</span>`:`<b>${r30.filter(a=>statusOf(a)==='missed').length}</b><span>Ausgelassen in 30 Tagen</span>`;
  const up=l.filter(a=>a.date>=t&&statusOf(a)==='planned').sort(byTime).slice(0,5);
  const past=l.filter(a=>a.date<=t&&statusOf(a)!=='planned').sort(byTime).reverse().slice(0,6);
  const tg=targetsOf(pid),reached=tg.filter(x=>targetState(x).reached).length;
  const sb=setbacksOf(pid),daily=dailyFor(t).filter(x=>x.projectId===pid);
  const left=fold('s:ziele','Ziele',tg.length?`${reached} von ${tg.length} erreicht`:'',`${tg.length?tg.map(targetRow).join(''):empty('Noch keine Ziele.','Lege fest, wohin du mit diesem Projekt willst.')}<div class="fold-add"><button class="link" data-a="tgNew">Ziel hinzufügen</button></div>`)
    +fold('s:werte','Werte',metricsOf(pid).length||'',metricsTree(pid))
    +(daily.length?fold('s:daily','Daily Tasks',`${daily.filter(x=>dailyDone(x.id,t)).length} von ${daily.length}`,dailyRows(t,daily,true)):'');
  const right=fold('s:akt','Aktivitäten',up.length?`${up.length} geplant`:'',`${up.length?`<h3 class="vgroup">Geplant</h3>${up.map(a=>actRow(a,true,true)).join('')}`:''}${past.length?`<h3 class="vgroup">Zuletzt</h3>${past.map(a=>actRow(a,true,true)).join('')}`:''}${up.length||past.length?'':empty('Noch keine Aktivitäten.','Plane den ersten Schritt.')}`)
    +fold('s:sb','Rückschläge',sb.length||'',`${sb.length?sb.slice(0,6).map(sbRow).join(''):empty('','Hier hältst du fest, was nicht geklappt hat und was du daraus machst.')}<div class="fold-add"><button class="link" data-a="sbNew" data-p="${esc(pid)}">Rückschlag eintragen</button></div>`)
    +fold('s:stat','Verlauf','',weekBars(l));
  return`<button class="back" data-a="nav" data-v="projekte">‹ Projekte &amp; Ziele</button>
  <div class="sec-head p-head"><h2 class="h-big">${dot(p.color)}${esc(p.name)}</h2><span class="p-acts"><button class="btn" data-a="actNew" data-d="${t}">Aktivität planen</button><button class="pen" data-a="treeEdit" aria-pressed="${!!ui.edit}" aria-label="Bearbeiten">${ICON.pen}</button></span></div>
  ${ui.edit?`<div class="edit-bar"><span>Bearbeiten ist aktiv</span><button class="link" data-a="projectEdit" data-id="${esc(pid)}">Projekt-Einstellungen</button></div>`:''}
  <div class="tiles">
    <div class="tile"><b>${week}</b><span>Erledigt diese Woche</span></div>
    <div class="tile"><b>${done.length}</b><span>Erledigt in 30 Tagen</span></div>
    <div class="tile"><b>${projectStreak(pid)}</b><span>In Folge erledigt</span></div>
    <div class="tile">${fourth}</div>
  </div>
  <div class="p-grid"><div class="stack">${left}</div><div class="stack">${right}</div></div>`;
}
function footLinks(ids){
  const l=[];
  if(ids.length)l.push('<button class="link quiet" data-a="exportAll">Alle Daten sichern</button>');
  if(PLATFORM.web){
    l.push('<label class="link quiet">Sicherung einspielen<input class="vh" type="file" id="imp" accept=".json,application/json"></label>');
    if(!ui.local)l.push('<button class="link quiet" data-a="logout">Abmelden</button>');
  }
  return l.length?`<div class="foot-link">${l.join('')}</div>`:'';
}
function viewProjects(){
  const t=today(),mon=weekStart(t),ids=projectIds();
  const cards=ids.map(id=>{
    const l=actsOf(id),week=l.filter(a=>statusOf(a)==='done'&&a.date>=mon&&a.date<=addDays(mon,6)).length;
    const next=l.filter(a=>a.date>=t&&statusOf(a)==='planned').sort(byTime)[0];
    const goal=targetsOf(id).map(x=>[x,targetState(x)]).find(([,s])=>!s.reached);
    return`<div class="pwrap"><button class="pcard" data-a="pOpen" data-id="${esc(id)}"><span class="pcard-name">${dot(colorOf(id))}${esc(P(id).name)}</span>
    <span class="pcard-sub">${week} erledigt diese Woche · Serie ${projectStreak(id)}</span>
    <span class="pcard-sub">${next?'Nächstes: '+esc(next.title)+', '+esc(dayName(next.date)):'Nichts geplant'}</span>
    ${goal?`<span class="tg-bar"><i style="width:${Math.round(goal[1].pct*100)}%"></i></span><span class="pcard-sub">Ziel: ${esc(goal[0].name)}</span>`:''}</button>
    ${ui.edit?`<span class="p-pen">${editBtn('projectEdit',`data-id="${esc(id)}"`,P(id).name+' bearbeiten')}</span>`:''}</div>`}).join('');
  return`<div class="sec-head p-head"><h2 class="h-big">Projekte &amp; Ziele</h2><span class="p-acts"><button class="btn" data-a="projectNew">Neues Projekt</button>${ids.length?`<button class="pen" data-a="treeEdit" aria-pressed="${!!ui.edit}" aria-label="Bearbeiten">${ICON.pen}</button>`:''}</span></div>
  <div class="plist">${cards||`<section>${empty('Noch keine Projekte.','Ein Projekt ist ein Bereich deines Lebens, in dem du weiterkommen willst.')}</section>`}</div>
  ${footLinks(ids)}`;
}

/* ---------- Rendern ---------- */
function renderBanner(){
  const b=document.getElementById('banner');let h='';
  if(ui.local)h=`<div class="banner">${PLATFORM.localNote}</div>`;
  else if(ui.stale)h='<div class="banner bad">Deine Daten sind gerade nicht erreichbar. Was du siehst, ist vielleicht nicht aktuell.</div>';
  else if(ui.saveError)h='<div class="banner bad">Eine Änderung wurde nicht gespeichert. Lade die Seite neu und prüfe den letzten Eintrag.</div>';
  b.innerHTML=h;
}
function render(){
  let cur=ui.view==='aktivitaet'?ui.back:ui.view;if(cur==='projekt')cur='projekte';
  document.getElementById('nav').innerHTML=VIEWS.map(([k,l])=>`<button data-a="nav" data-v="${k}" ${cur===k?'aria-current="page"':''}>${l}</button>`).join('');
  document.getElementById('tabs').innerHTML=VIEWS.map(([k,l])=>`<button data-a="nav" data-v="${k}" ${cur===k?'aria-current="page"':''}>${ICON[k]}<span>${l}</span></button>`).join('');
  document.getElementById('ex-list').innerHTML=[...new Set([...EXERCISES,...acts().flatMap(a=>(a.exercises||[]).map(e=>e.name))])].map(n=>`<option value="${esc(n)}"></option>`).join('');
  renderBanner();
  const v=document.getElementById('view');
  if(!ui.ready){v.innerHTML='<p class="note">Dein Kalender wird geladen.</p>';return}
  chartData=null;
  v.innerHTML=({heute:viewToday,kalender:viewCalendar,daily:viewDaily,projekte:viewProjects,projekt:viewProject,aktivitaet:viewActivity}[ui.view]||viewToday)();
  hookChart();
}

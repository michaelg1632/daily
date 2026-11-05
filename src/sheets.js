/* ---------- Fenster ---------- */
let sheetOpener=null;
function openSheet(html,focusSel){
  const s=document.getElementById('sheet');
  sheetOpener=document.activeElement;
  s.innerHTML=`<div class="panel" role="dialog" aria-modal="true" tabindex="-1">${html}</div>`;s.hidden=false;
  (focusSel&&s.querySelector(focusSel)||s.querySelector('.panel')).focus();
}
function closeSheet(){
  const s=document.getElementById('sheet');s.hidden=true;s.innerHTML='';
  if(deferred){deferred=false;render()}
  if(sheetOpener?.isConnected)sheetOpener.focus();sheetOpener=null;
}
const acts2=(extra='')=>`<div class="panel-acts">${extra}<button type="button" class="btn ghost" data-a="close">Abbrechen</button><button class="btn">Speichern</button></div>`;
const delBtn=(a,attrs='')=>`<button type="button" class="btn ghost del" data-a="${a}" ${attrs}>Löschen</button>`;
const confirmed=e=>{if(e.dataset.sure)return true;e.dataset.sure='1';e.textContent='Wirklich löschen';return false};
const projectOptions=sel=>projectIds().map(id=>`<option value="${esc(id)}" ${id===sel?'selected':''}>${esc(P(id).name)}</option>`).join('');
const projectField=(sel,fid='f-proj')=>`<div class="fld"><label for="${fid}">Projekt</label><select id="${fid}" name="project">${projectOptions(sel)}<option value="" ${hasProject(sel)?'':'selected'}>Kein Projekt</option></select></div>`;
const colorField=sel=>`<fieldset class="fld"><legend>Farbe</legend><div class="opts">${PALETTE.map(([n,c],i)=>`<label class="swatch"><input type="radio" name="color" value="${c}" ${(sel?sel===c:i===0)?'checked':''} aria-label="${n}"><span style="background:${c}"></span></label>`).join('')}</div></fieldset>`;
const dayField=days=>`<fieldset class="fld"><legend>An welchen Tagen?</legend><div class="opts">${WD2.map((w,i)=>`<label class="opt"><input type="checkbox" name="days" value="${i}" ${!days?.length||days.includes(i)?'checked':''}><span>${w}</span></label>`).join('')}</div></fieldset>`;

/* ---------- Aktivität ---------- */
function quickChips(pid){
  const own=[...new Set((pid?actsOf(pid):acts()).sort(byTime).reverse().map(a=>a.title))];
  const list=[...new Set([...(P(pid).quick||[]),...own])].slice(0,8);
  return list.map(t=>`<button type="button" class="chip" data-a="quickTitle" data-t="${esc(t)}">${esc(t)}</button>`).join('');
}
function sheetActivity(o){
  const titles=[...new Set(acts().map(a=>a.title))];
  openSheet(`<h2>${o.id?'Aktivität bearbeiten':'Aktivität planen'}</h2>
  <form class="form" data-f="activity" data-id="${o.id||''}">
    <div class="fld"><label for="a-title">Name</label><input type="text" id="a-title" name="title" required value="${esc(o.title||'')}" placeholder="Was hast du vor?" list="title-list" autocomplete="off"><datalist id="title-list">${titles.map(t=>`<option value="${esc(t)}"></option>`).join('')}</datalist>
      <div class="chips" id="a-quick">${quickChips(o.projectId)}</div></div>
    ${projectField(o.projectId,'a-proj')}
    <div class="row2"><div class="fld"><label for="a-date">Datum</label><input type="date" id="a-date" name="date" required value="${o.date||today()}"></div>
      <div class="fld"><label for="a-time">Uhrzeit, optional</label><input type="time" id="a-time" name="time" value="${esc(o.time||'')}"></div></div>
    ${o.id?'':`<div class="row2"><div class="fld"><label for="a-rep">Wiederholen</label><select id="a-rep" name="repeat"><option value="">Nur einmal</option><option value="d">Jeden Tag</option><option value="w">Jede Woche</option><option value="2w">Alle 2 Wochen</option><option value="m">Jeden Monat</option></select></div>
      <div class="fld" id="a-cnt-f" hidden><label for="a-cnt">Wie oft?</label><select id="a-cnt" name="count"><option>4</option><option selected>8</option><option>12</option><option>26</option><option>52</option></select></div></div>`}
    ${acts2(o.id?delBtn('actDel',`data-id="${o.id}"`):'')}
  </form>`,o.id?null:'#a-title');
}

/* ---------- Projekt ---------- */
function sheetProjectNew(){
  openSheet(`<h2>Neues Projekt</h2><form class="form" data-f="projectNew">
    <div class="fld"><label for="n-name">Name</label><input type="text" id="n-name" name="name" required autocomplete="off" placeholder="zum Beispiel Sparen fürs Auto"></div>
    <fieldset class="fld"><legend>Womit möchtest du starten?</legend><div class="tpl">${TEMPLATES.map((t,i)=>`<label class="tpl-o"><input type="radio" name="template" value="${t.id}" ${i?'':'checked'}><span><b>${esc(t.name)}</b><small>${esc(t.desc)}</small></span></label>`).join('')}</div></fieldset>
    ${acts2()}</form>`,'#n-name');
}
function sheetPhoto(aid,pid){
  const l=S.activities[aid]?.photos||[],i=l.findIndex(p=>p.id===pid);if(i<0){closeSheet();return}
  const o=sheetOpener,many=l.length>1,go=d=>`data-aid="${esc(aid)}" data-id="${esc(l[(i+d+l.length)%l.length].id)}"`;
  openSheet(`<div class="pv-box"><img id="pv" data-id="${esc(pid)}" src="${esc(photoFull.get(pid)||l[i].thumb)}" alt="Foto ${i+1} von ${l.length}"></div>
    <p class="note flat" id="pv-note" hidden></p>
    <div class="panel-acts">${delBtn('phDel',`data-aid="${esc(aid)}" data-id="${esc(pid)}"`)}${many?`<button type="button" class="btn ghost" data-a="phOpen" ${go(-1)} aria-label="Vorheriges Foto">‹</button><button type="button" class="btn ghost" data-a="phOpen" ${go(1)} aria-label="Nächstes Foto">›</button>`:''}<button type="button" class="btn" data-a="close">Schließen</button></div>`);
  if(o)sheetOpener=o;
  loadPhoto(pid);
}
function sheetProject(id){
  const p=P(id),f=fieldsOf(id);
  openSheet(`<h2>Projekt-Einstellungen</h2><form class="form" data-f="project" data-id="${esc(id)}">
    <div class="fld"><label for="n-name">Name</label><input type="text" id="n-name" name="name" required value="${esc(p.name)}" autocomplete="off"></div>
    ${colorField(p.color)}
    <fieldset class="fld"><legend>Felder in Aktivitäten</legend><div class="opts">
      <label class="opt"><input type="checkbox" name="f" value="duration" ${f.duration?'checked':''}><span>Dauer</span></label>
      <label class="opt"><input type="checkbox" name="f" value="checklist" ${f.checklist?'checked':''}><span>Checkliste</span></label>
      <label class="opt"><input type="checkbox" name="f" value="sets" ${f.sets?'checked':''}><span>Übungen und Sätze</span></label>${canPhoto()?`
      <label class="opt"><input type="checkbox" name="f" value="photos" ${f.photos?'checked':''}><span>Fotos</span></label>`:''}</div></fieldset>
    <div class="fld"><label for="n-quick">Schnellauswahl für Aktivitäten</label><input type="text" id="n-quick" name="quick" value="${esc((p.quick||[]).join(', '))}" autocomplete="off" placeholder="Mit Komma trennen"></div>
    <p class="note flat">Beim Löschen bleiben Aktivitäten im Kalender, gehören dann aber zu keinem Projekt mehr. Ziele und Rückschläge des Projekts werden mitgelöscht.</p>
    ${acts2(delBtn('projectDel',`data-id="${esc(id)}"`))}</form>`);
}
function sheetGroup(id){
  const g=groupsOf(ui.proj).find(x=>x.id===id);
  openSheet(`<h2>${g?'Gruppe bearbeiten':'Gruppe hinzufügen'}</h2><form class="form" data-f="group" data-id="${esc(id||'')}">
    <div class="fld"><label for="n-name">Name</label><input type="text" id="n-name" name="name" required value="${esc(g?.name||'')}" autocomplete="off"></div>
    ${g?'<p class="note flat">Beim Löschen verschwinden auch die Einträge dieser Gruppe. Gespeicherte Aktivitäten bleiben erhalten.</p>':''}
    ${acts2(g?delBtn('groupDel',`data-id="${esc(id)}"`):'')}</form>`,g?null:'#n-name');
}
const modeField=sel=>`<div class="fld"><label for="n-mode">Anzeige</label><select id="n-mode" name="mode"><option value="last" ${sel==='sum'?'':'selected'}>Aktueller Stand, zum Beispiel Gewicht</option><option value="sum" ${sel==='sum'?'selected':''}>Zusammenzählen, zum Beispiel Ausgaben</option></select></div>`;
function sheetMetric(id,gid){
  const m=id?metricOf(ui.proj,id):null,sets=fieldsOf(ui.proj).sets;
  openSheet(`<h2>${m?'Eintrag bearbeiten':'Eintrag hinzufügen'}</h2><form class="form" data-f="metric" data-id="${esc(id||'')}" data-g="${esc(gid||'')}">
    <div class="fld"><label for="n-name">Name</label><input type="text" id="n-name" name="name" required value="${esc(m?.name||'')}" autocomplete="off"></div>
    <div class="fld"><label for="n-unit">Einheit</label><input type="text" id="n-unit" name="unit" value="${esc(m?.unit||'')}" placeholder="zum Beispiel kg, €, Std." autocomplete="off"></div>
    ${modeField(m?.mode)}
    ${m?`<div class="fld"><label for="n-group">Gruppe</label><select id="n-group" name="group">${groupsOf(ui.proj).map(g=>`<option value="${esc(g.id)}" ${g.id===m.groupId?'selected':''}>${esc(g.name)}</option>`).join('')}</select></div>`:''}
    ${!m&&sets?'<label class="opt"><input type="checkbox" name="fromex" value="1"><span>Aus Übungen übernehmen</span></label>':''}
    ${acts2(m?delBtn('metricDel',`data-id="${esc(id)}"`):'')}</form>`,m?null:'#n-name');
}
function sheetMetrics(pid){
  const cur=metricsOf(pid),on=id=>cur.some(x=>x.id===id),sets=fieldsOf(pid).sets;
  const blocks=CATALOG.filter(([g])=>g!=='Übungen'||sets).map(([g,items])=>`<fieldset class="fld"><legend>${esc(g)}</legend><div class="opts">${items.map(x=>`<label class="opt"><input type="checkbox" name="m" value="${x.id}" ${on(x.id)?'checked':''}><span>${esc(x.name)}</span></label>`).join('')}</div></fieldset>`).join('');
  openSheet(`<h2>Werte auswählen</h2><form class="form" data-f="metrics" data-p="${esc(pid)}">${blocks}
    <p class="note flat">Eigene Werte legst du im Projekt über den Stift an.</p>${acts2()}</form>`);
}

/* ---------- Ziel ---------- */
function targetKindFields(t,pid){
  const ms=metricsOf(pid),kind=t?.kind||(ms.length?'metric':'milestone');
  return`<fieldset class="fld"><legend>Art</legend><div class="opts" id="t-kind">${[['metric','Wert erreichen'],['count','Anzahl erledigen'],['milestone','Meilenstein']].map(([k,l])=>`<label class="opt"><input type="radio" name="kind" value="${k}" ${kind===k?'checked':''}><span>${l}</span></label>`).join('')}</div></fieldset>
  <div class="fld" data-for="metric" ${kind==='metric'?'':'hidden'}><label for="t-metric">Wert</label><select id="t-metric" name="metric">${ms.length?ms.map(m=>`<option value="${esc(m.id)}" ${m.id===t?.metricId?'selected':''}>${esc(m.name)} (${esc(m.unit)})</option>`).join(''):'<option value="">Noch keine Werte angelegt</option>'}</select></div>
  <div class="row2" data-for="metric count" ${kind==='milestone'?'hidden':''}>
    <div class="fld" data-for="metric" ${kind==='metric'?'':'hidden'}><label for="t-start">Startwert</label><input type="text" inputmode="decimal" id="t-start" name="start" value="${t?.start!=null?fmt(t.start):''}" autocomplete="off" placeholder="aktueller Stand"></div>
    <div class="fld"><label for="t-target">Zielwert</label><input type="text" inputmode="decimal" id="t-target" name="target" value="${t?.target!=null?fmt(t.target):''}" autocomplete="off"></div></div>`;
}
function sheetTarget(id){
  const t=id?S.targets[id]:null,pid=t?.projectId||ui.proj;
  openSheet(`<h2>${t?'Ziel bearbeiten':'Ziel hinzufügen'}</h2><form class="form" data-f="target" data-id="${esc(id||'')}">
    <div class="fld"><label for="t-name">Name</label><input type="text" id="t-name" name="name" required value="${esc(t?.name||'')}" autocomplete="off" placeholder="Was willst du erreichen?"></div>
    ${targetKindFields(t,pid)}
    <div class="fld"><label for="t-due">Bis wann? Optional</label><input type="date" id="t-due" name="due" value="${esc(t?.due||'')}"></div>
    ${acts2(t?delBtn('tgDel',`data-id="${esc(id)}"`):'')}</form>`,t?null:'#t-name');
}

/* ---------- Rückschlag ---------- */
function sheetSetback(o){
  openSheet(`<h2>${o.id?'Rückschlag bearbeiten':'Rückschlag eintragen'}</h2><form class="form" data-f="setback" data-id="${o.id||''}">
    <div class="row2"><div class="fld"><label for="sb-date">Datum</label><input type="date" id="sb-date" name="date" required value="${o.date||today()}"></div>
    ${projectField(o.projectId,'sb-proj')}</div>
    <div class="fld"><label for="sb-what">Was ist passiert?</label><textarea id="sb-what" name="what" required>${esc(o.what||'')}</textarea></div>
    <fieldset class="fld"><legend>Was hat es ausgelöst?</legend><div class="opts">${TRIGGERS.map(t=>`<label class="opt"><input type="radio" name="trigger" value="${esc(t)}" ${o.trigger===t?'checked':''}><span>${esc(t)}</span></label>`).join('')}</div></fieldset>
    <div class="fld"><label for="sb-next">Was machst du nächstes Mal anders?</label><textarea id="sb-next" name="next">${esc(o.next||'')}</textarea></div>
    ${acts2(o.id?delBtn('sbDel',`data-id="${o.id}"`):'')}</form>`,o.id?null:'#sb-what');
}

/* ---------- Daily Task ---------- */
function sheetDaily(id,d){
  const t=S.dailytasks[id],i=S.dailylog[d]?.info?.[id]||{};
  openSheet(`<h2>Daily Task</h2><p class="sec-meta">${esc(dayName(d))}</p><form class="form" data-f="dailyEdit" data-id="${id}" data-d="${d}">
    <div class="fld"><label for="dn-name">Name</label><input type="text" id="dn-name" name="name" required value="${esc(t.name)}" autocomplete="off"></div>
    ${projectField(t.projectId,'dn-proj')}
    <div class="row2"><div class="fld"><label for="dn-time">Uhrzeit, jeden Tag</label><input type="time" id="dn-time" name="time" value="${esc(t.time||'')}"></div>
      <div class="fld"><label for="dn-start">Gilt ab</label><input type="date" id="dn-start" name="start" value="${esc(t.start||'')}" max="${today()}"></div></div>
    ${dayField(t.days)}
    <div class="fld"><label for="dn-note">Notiz für ${esc(dayName(d))}</label><textarea id="dn-note" name="note">${esc(i.note||'')}</textarea></div>
    ${acts2(delBtn('dDel',`data-id="${id}"`))}</form>`);
}

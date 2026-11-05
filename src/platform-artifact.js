/* ---------- Plattform: Artifact in Claude ---------- */
const PLATFORM={
  web:false,
  localNote:'Deine Einträge bleiben gerade nur in diesem Browser. Öffne Daily angemeldet in Claude, damit sie auf all deinen Geräten gespeichert werden.',
  async db(){return window.claude?.use?await claude.use('db'):null},
  async save(data,filename){
    const dl=await window.claude?.use?.('downloads').catch(()=>null);
    if(!dl)return false;
    await dl.save({filename,data:new Blob([data],{type:'application/json'})});
    return true;
  }
};

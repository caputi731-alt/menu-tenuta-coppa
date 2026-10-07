'use strict';
// Avvio dell'app.
// I file in js/ sono script normali caricati in ordine da index.html: variabili e funzioni sono condivise fra tutti.
/* ---------- Avvio ---------- */
(async()=>{
  let s;
  try{
    try{s=await idb.get('state')}
    catch(e){idb._p=null;await new Promise(r=>setTimeout(r,500));s=await idb.get('state')} // secondo tentativo
    if(s&&s.v!==2&&s.v!==3){
      // dati di una versione che questa app non conosce: li metto da parte invece di cancellarli
      await idb.set('scartato-'+Date.now(),s);s=null;
      setTimeout(()=>toast('I dati salvati non sono leggibili da questa versione: ne ho tenuta una copia in Altro → Backup'),600);
    }else s=await hydrate(s);
    const ks=await idb.keys();
    ui.scartati=ks.filter(k=>String(k).startsWith('scartato-')).sort();ui.preImport=ks.includes('prima-importazione');
  }catch(e){return fatal()}
  state=normalize(s);canSave=true;applyZoom();
  flush().then(ok=>{if(ok)cleanBlobs()});
  if(ls.get(AUTO_KEY)==='1')setTimeout(autoCopy,4000); // modifiche della volta scorsa non ancora copiate
  render();
  loadFonts().then(mountPreviews);
  try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
  if(!AND&&'serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
})();

'use strict';
// Archivio su IndexedDB, copia automatica, stato dell'interfaccia.
// I file in js/ sono script normali caricati in ordine da index.html: variabili e funzioni sono condivise fra tutti.
/* ---------- Archivio (IndexedDB) ---------- */
const idb={
  _p:null,
  open(){return this._p||(this._p=new Promise((res,rej)=>{const r=indexedDB.open('menu-app',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>{this._p=null;rej(r.error)};r.onblocked=()=>{this._p=null;rej(new Error('archivio bloccato'))}}))},
  async get(k){const db=await this.open();return new Promise((res,rej)=>{const q=db.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})},
  async keys(){const db=await this.open();return new Promise((res,rej)=>{const q=db.transaction('kv').objectStore('kv').getAllKeys();q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})},
  // scrive (o cancella, con valore undefined) più chiavi insieme: o tutte o nessuna.
  // onabort serve per la memoria piena: in quel caso il browser annulla la transazione senza passare da onerror.
  async setMany(pairs){const db=await this.open();return new Promise((res,rej)=>{const tx=db.transaction('kv','readwrite'),st=tx.objectStore('kv');
    pairs.forEach(([k,v])=>v===undefined?st.delete(k):st.put(v,k));
    tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error||new Error('scrittura non riuscita'));tx.onabort=()=>rej(tx.error||new Error('scrittura annullata'))})},
  set(k,v){return this.setMany([[k,v]])}
};
let state,saveT=null,canSave=false;
// Immagini di sfondo e file della didattica pesano centinaia di KB: stanno in chiavi separate ("blob:…")
// e nello stato salvato resta solo un riferimento, così a ogni tasto premuto si riscrive solo il testo.
// In memoria e nel file di backup restano invece dentro lo stato, come prima.
const REF='idb:',blobId=new Map(),blobSaved=new Set();
const isBig=v=>typeof v==='string'&&v.startsWith('data:');
const refOf=v=>{let id=blobId.get(v);if(!id){id=uid();blobId.set(v,id)}return id};
function dehydrate(st){
  const todo=new Map(),ref=v=>{const id=refOf(v);if(!blobSaved.has(id))todo.set(id,v);return REF+id};
  const lite={...st,
    templates:st.templates.map(t=>isBig(t.bgImage)||isBig(t.coverImage)?{...t,...(isBig(t.bgImage)?{bgImage:ref(t.bgImage)}:{}),...(isBig(t.coverImage)?{coverImage:ref(t.coverImage)}:{})}:t),
    didattica:Object.fromEntries(Object.entries(st.didattica||{}).map(([k,o])=>[k,o&&isBig(o.data)?{...o,data:ref(o.data)}:o]))};
  return{lite,todo};
}
async function hydrate(s){
  if(!s||typeof s!=='object')return s;
  const load=async v=>{const id=v.slice(REF.length),d=await idb.get('blob:'+id);if(isBig(d)){blobId.set(d,id);blobSaved.add(id)}return d};
  const isRef=v=>typeof v==='string'&&v.startsWith(REF);
  for(const t of Array.isArray(s.templates)?s.templates:[]){
    if(isRef(t.bgImage))t.bgImage=(await load(t.bgImage))||t.origBg||'';
    if(isRef(t.coverImage))t.coverImage=(await load(t.coverImage))||t.origCover||'';
  }
  for(const[k,o]of Object.entries(s.didattica||{}))if(o&&isRef(o.data)){const d=await load(o.data);if(d)o.data=d;else delete s.didattica[k]}
  return s;
}
function save(){clearTimeout(saveT);saveT=setTimeout(flush,250);autoMark()}
let saveErrT=0;
function flush(){
  clearTimeout(saveT);saveT=null;if(!state||!canSave)return Promise.resolve(false);
  const{lite,todo}=dehydrate(state);
  return idb.setMany([...[...todo].map(([id,v])=>['blob:'+id,v]),['state',lite]])
    .then(()=>{todo.forEach((v,id)=>blobSaved.add(id));return true})
    .catch(()=>{if(Date.now()-saveErrT>8000){saveErrT=Date.now();toast('Salvataggio non riuscito: memoria del telefono piena? Fai subito un backup da Altro.')}return false});
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&saveT)flush()});
// elimina immagini e file non più usati da nessun template
async function cleanBlobs(){
  try{const ks=await idb.keys();if(ks.some(k=>String(k).startsWith('scartato-')))return;
    const del=ks.filter(k=>String(k).startsWith('blob:')&&!blobSaved.has(String(k).slice(5)));
    if(del.length)await idb.setMany(del.map(k=>[k,undefined]))}catch(e){}
}
/* ---------- Copia automatica (solo app Android) ----------
   Una volta al giorno, se qualcosa è cambiato, l'app scrive da sola una copia completa dei dati nella
   cartella Download/MenuTenutaCoppa del telefono. La copia resta anche se l'app viene disinstallata. */
const AUTO_KEY='menu-auto-dirty',AUTO_DAY='menu-auto-day';
const ls={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
let autoT=null,autoDirty=false;
// chiamata a ogni modifica: la copia parte un minuto dopo l'ultima, così non si scrive mentre stai lavorando
function autoMark(){if(!autoDirty){autoDirty=true;ls.set(AUTO_KEY,'1')}clearTimeout(autoT);autoT=setTimeout(autoCopy,60000)}
function autoCopy(){
  const A=window.Android;
  if(!A||!A.autoBackup||!state||!canSave||ls.get(AUTO_KEY)!=='1')return false;
  if(!state.menus.length&&!state.templates.some(t=>!t.builtIn))return false; // niente di tuo da proteggere
  try{
    if(A.autoBackup(JSON.stringify(state),`copia-automatica_${today()}.json`)){autoDirty=false;ls.set(AUTO_KEY,'0');ls.set(AUTO_DAY,today());return true}
  }catch(e){}
  return false;
}
function normalize(s){
  const d=defaultState();
  if(!s||(s.v!==2&&s.v!==3))return d; // dati della versione di prova precedente: si riparte puliti
  // template di serie: fondo bianco per la stampa e aggiunta dei nuovi (es. Pasqua)
  if(Array.isArray(s.templates)){
    const byId=Object.fromEntries(d.templates.map(t=>[t.id,t]));
    s.templates.forEach(t=>{const b=byId[t.id];
      if(t.id==='tpl-pasqua'&&t.name==='Festività – Pasqua'){t.name=b.name;if(t.heading==='Pasqua 2026')t.heading=b.heading}
      if(b&&t.layout==='classico'&&t.tagline===undefined){t.tagline=b.tagline;t.legend=true}
      if(b&&t.builtIn&&(t.priceAdult===''||t.priceAdult===undefined)){t.priceAdult=b.priceAdult;if(t.priceKid===''||t.priceKid===undefined)t.priceKid=b.priceKid}
      if(b&&t.builtIn){t.bgColor=b.bgColor;if(!t.bgImage||t.bgImage===t.origBg)t.bgImage=b.bgImage;t.origBg=b.origBg;
        if(b.coverImage){if(!t.coverImage||t.coverImage===t.origCover)t.coverImage=b.coverImage;t.origCover=b.origCover}}});
    d.templates.forEach(b=>{if(!s.templates.some(t=>t.id===b.id))s.templates.push(b)});
    const ord=d.templates.map(t=>t.id),pos=t=>{const i=ord.indexOf(t.id);return i<0?999:i};
    s.templates=s.templates.map((t,i)=>[t,i]).sort((a,b)=>pos(a[0])-pos(b[0])||a[1]-b[1]).map(x=>x[0]); // nuovi template al loro posto, quelli creati da te in fondo
  }
  return{v:3,didattica:s.didattica||{},lastOstia:s.lastOstia||null,lastSp:s.lastSp||null,settings:{...d.settings,...(s.settings||{})},
    categories:Array.isArray(s.categories)&&s.categories.length?s.categories:d.categories,
    dishes:(Array.isArray(s.dishes)?s.dishes:d.dishes).map(x=>x.en===undefined&&EN_DISHES[enKey(x.name)]?{...x,en:EN_DISHES[enKey(x.name)]}:x),
    templates:Array.isArray(s.templates)&&s.templates.length?s.templates.map(t=>({...SUNDAY,limit:1240,bgColor:'#FFFFFF',ink:'#333333',...t})):d.templates,
    menus:Array.isArray(s.menus)?s.menus:[]};
}

/* ---------- Stato interfaccia ---------- */
const now=new Date();
const ui={view:'cal',cal:{y:now.getFullYear(),m:now.getMonth()},selDate:today(),listTab:'next',q:'',dq:'',editId:null,back:'cal',pv:{mode:'tavolo'},tplId:null,sheet:null,pickQ:'',pickAll:false,ost:null,didPhone:''};
const getMenu=id=>state.menus.find(x=>x.id===id);
const getTpl=id=>state.templates.find(x=>x.id===id);
const tplOf=m=>(TPL_OV&&TPL_OV.id===m.templateId)?TPL_OV:(getTpl(m.templateId)||state.templates[0]);
const layoutOf=m=>LAYOUTS[tplOf(m).layout]||LAYOUTS.verticale;
// Campi che, se non modificati nella proposta, prendono il valore del template
const INHERIT=['drinks','drinksKids','priceAdult','priceKid','kidLabel','headingKids'];
const val=(m,f)=>(m[f]===undefined||m[f]===null)?(tplOf(m)[f]??''):m[f];
const priceInherited=m=>m.priceAdult===undefined||m.priceAdult===null;
const heading=m=>(m.heading||'').trim()||tplOf(m).heading;
const menuName=m=>heading(m)+(m.client?` – ${m.client}`:'');
function newMenu(date){
  // riparte dall'ultimo template usato, così un battesimo dopo l'altro non va ricambiato ogni volta
  const t=getTpl(state.settings.lastTpl)||state.templates[0];
  return{id:uid(),created:Date.now(),templateId:t.id,date:date||today(),time:'',heading:'',client:'',phone:'',guests:'',guestsKids:'',room:'',status:'bozza',notes:'',showSections:true,showDate:true,showTotal:false,kids:true,
    sections:state.categories.map(c=>({name:c,items:[]})),kidsSections:KIDS_SECS.map(c=>({name:c,items:[]}))};
}
const allSecs=m=>[...m.sections,...(m.kidsSections||[])];
const isEmptyMenu=m=>!allSecs(m).some(s=>s.items.length)&&!m.client&&!m.heading&&!m.notes&&!m.phone&&!INHERIT.some(f=>m[f]!==undefined&&m[f]!==null);
const secList=(m,kids)=>kids?(m.kidsSections||(m.kidsSections=KIDS_SECS.map(c=>({name:c,items:[]})))):m.sections;

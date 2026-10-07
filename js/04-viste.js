'use strict';
// Componenti e schermate.
// I file in js/ sono script normali caricati in ordine da index.html: variabili e funzioni sono condivise fra tutti.
/* ---------- Componenti ---------- */
const topbar=inner=>`<header class="top">${inner}</header>`;
function navbar(){
  const it=[['cal','Calendario',I.cal],['list','Menù',I.list],['ostie','Stampe',I.ost],['didattica','Didattica',I.farm],['settings','Altro',I.gear]];
  const cur=ui.view==='dishes'?'settings':ui.view;
  return`<nav class="nav">${it.map(([v,l,ic])=>`<button class="${cur===v?'on':''}" data-a="nav" data-v="${v}">${ic}<span>${l}</span></button>`).join('')}</nav>`;
}
const fab=(a,label)=>`<button class="fab" data-a="${a}" aria-label="${label}">${I.plus}</button>`;
const accentOf=t=>t.ink||'#555';
function menuCard(m,withDate){
  const t=tplOf(m),st=STATUS[m.status]||STATUS.bozza;
  const g=[m.guests?m.guests+' adulti':'',m.guestsKids?m.guestsKids+' bambini':''].filter(Boolean).join(' e ');
  const sub=[withDate?'':m.time,m.client,g,withDate?'':m.room].filter(Boolean).join(', ')||t.name;
  let left;
  if(withDate&&m.date){const d=parseD(m.date);left=`<span class="mc-date" style="--ac:${accentOf(t)}"><b>${d.getDate()}</b><small>${d.toLocaleDateString('it-IT',{month:'short'})} ${String(d.getFullYear()).slice(2)}</small></span>`}
  else left=`<span class="mc-bar" style="background:${t.bgColor};box-shadow:inset 0 0 0 1px ${accentOf(t)}55"></span>`;
  return`<button class="mcard" data-a="open" data-id="${m.id}">${left}<span class="mc-body"><span class="mc-t">${esc(heading(m))}</span><span class="mc-s">${esc(sub)}</span></span><span class="pill" style="--c:${st.c}">${st.l}</span></button>`;
}
// miniatura: la pagina vera del template (copertina per il libretto), rimpicciolita e messa in cache
const THUMBS={};
function thumbHTML(t){
  const key=[t.id,t.layout,t.bgImage&&t.bgImage.length,t.bgImage&&t.bgImage.slice(-40),t.coverImage&&t.coverImage.slice(-40),t.ink,t.accent,t.bgColor,t.heading,state.settings.venue].join('|');
  if(THUMBS[t.id]&&THUMBS[t.id].key===key)return THUMBS[t.id].html;
  const sm=sampleMenu(t);sm.date='';sm.sections=sm.sections.map(s=>({...s,items:s.items.slice(0,2)}));
  const html=pageHTML(sm,t,'tavolo','it',t.layout==='libretto'?'cover':'');THUMBS[t.id]={key,html};return html;
}
const swatch=(t,h=106)=>{const L=LAYOUTS[t.layout]||LAYOUTS.verticale;
  return`<span class="sw sw-mini" style="background-color:${t.bgColor}"><span class="sw-in" style="width:${L.w}px;height:${L.h}px;margin-left:-${L.w/2}px;transform:scale(${h/L.h})">${thumbHTML(t)}</span></span>`};

/* ---------- Viste ---------- */
const backupDue=()=>state.menus.length>=3&&(!state.settings.lastBackup||Date.now()-state.settings.lastBackup>30*864e5);
function vCal(){
  const{y,m}=ui.cal,title=cap(new Date(y,m,1).toLocaleDateString('it-IT',{month:'long',year:'numeric'}));
  const first=(new Date(y,m,1).getDay()+6)%7,nd=new Date(y,m+1,0).getDate(),td=today(),by={};
  state.menus.forEach(x=>{if(x.date)(by[x.date]=by[x.date]||[]).push(x)});
  let cells='';for(let i=0;i<first;i++)cells+='<span></span>';
  for(let d=1;d<=nd;d++){
    const ds=`${y}-${pad(m+1)}-${pad(d)}`,L=by[ds]||[];
    cells+=`<button class="day${ds===td?' today':''}${ds===ui.selDate?' sel':''}" data-a="selDay" data-d="${ds}" aria-label="${d}${L.length?', '+L.length+' proposte':''}"><span class="dn">${d}</span><span class="dots">${L.slice(0,3).map(x=>`<i style="background:${(STATUS[x.status]||STATUS.bozza).c}"></i>`).join('')}${L.length>3?'<em>+</em>':''}</span></button>`;
  }
  const sel=(by[ui.selDate]||[]).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  return topbar(`<h1>Calendario</h1><button class="tb" data-a="calToday">Oggi</button>`)+
  `<main class="main">${backupDue()?`<div class="card" style="margin-bottom:14px;display:flex;gap:10px;align-items:center"><span style="flex:1;font-size:14px">${state.settings.lastBackup?'È passato più di un mese dall\'ultimo backup.':'Non hai ancora fatto un backup.'} I dati sono solo su questo telefono.</span><button class="btn" data-a="export">${I.dl}Backup</button></div>`:''}<div class="calh"><h2>${title}</h2><button class="ib" data-a="calMove" data-d="-1" aria-label="Mese precedente">${I.left}</button><button class="ib" data-a="calMove" data-d="1" aria-label="Mese successivo">${I.right}</button></div>
  <div class="wk">${['L','M','M','G','V','S','D'].map(x=>`<span>${x}</span>`).join('')}</div><div class="grid">${cells}</div>
  <div class="legend">${Object.values(STATUS).map(s=>`<span><i style="background:${s.c}"></i>${s.l}</span>`).join('')}</div>
  <h2 class="dh">${fmtLong(ui.selDate)}</h2>
  ${sel.length?sel.map(x=>menuCard(x,false)).join(''):`<div class="card empty">Nessun menù in questa data.<br><br><button class="btn pri" data-a="new">${I.plus}Crea menù</button></div>`}
  </main>`+fab('new','Nuovo menù')+navbar();
}
function listHTML(){
  const td=today(),q=norm(ui.q);let L=state.menus.slice();
  if(ui.listTab==='next')L=L.filter(x=>(x.date||'9999')>=td).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
  else if(ui.listTab==='past')L=L.filter(x=>x.date&&x.date<td).sort((a,b)=>b.date.localeCompare(a.date));
  else L.sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  if(q)L=L.filter(x=>norm([heading(x),x.client,x.phone,x.room].join(' ')).includes(q));
  if(!L.length)return`<div class="empty">${q?'Nessun menù corrisponde alla ricerca.':ui.listTab==='next'?'Nessun menù in programma. Tocca + per crearne uno.':'Nessun menù.'}</div>`;
  return L.map(x=>menuCard(x,true)).join('');
}
function vList(){
  const tabs=[['next','Prossimi'],['past','Passati'],['all','Tutti']];
  return topbar(`<h1>Menù e proposte</h1>`)+`<main class="main"><div class="seg">${tabs.map(([v,l])=>`<button class="${ui.listTab===v?'on':''}" data-a="listTab" data-v="${v}">${l}</button>`).join('')}</div>
  <input class="inp search" type="search" placeholder="Cerca per cliente o evento" data-in="q" value="${esc(ui.q)}"><div id="mlist">${listHTML()}</div></main>`+fab('new','Nuovo menù')+navbar();
}
const allCats=()=>[...state.categories,KIDS_CAT,...new Set(state.dishes.map(d=>d.cat).filter(c=>c!==KIDS_CAT&&!state.categories.includes(c)))];
function dishListHTML(){
  const q=norm(ui.dq);let out='';
  allCats().forEach(c=>{
    const L=state.dishes.filter(d=>d.cat===c&&(!q||norm(d.name).includes(q))).sort((a,b)=>a.name.localeCompare(b.name,'it'));
    if(!L.length&&q)return;
    out+=`<h3 class="dcat">${esc(c)}</h3>`+(L.length?`<div class="list">${L.map(d=>`<button class="drow" data-a="editDish" data-id="${d.id}"><span>${esc(oneLine(d.name))}${d.en?`<small style="display:block;color:var(--muted);font-size:12px;font-style:italic">${esc(oneLine(d.en))}</small>`:''}${d.alg&&d.alg.length?`<small style="display:block;color:var(--muted);font-size:12px">Allergeni ${d.alg.join(', ')}</small>`:d.algSet?`<small style="display:block;color:var(--muted);font-size:12px">Nessun allergene</small>`:''}</span>${I.pen}</button>`).join('')}</div>`:`<div class="hint">Nessuna portata.</div>`);
  });
  return out||`<div class="empty">Nessuna portata trovata.</div>`;
}
function vDishes(){
  return topbar(`<button class="ib" data-a="back" aria-label="Indietro">${I.back}</button><h1>Archivio portate</h1>`)+`<main class="main"><input class="inp search" type="search" placeholder="Cerca portata" data-in="dq" value="${esc(ui.dq)}"><div id="dlist">${dishListHTML()}</div></main>`+fab('editDish','Nuova portata')+navbar();
}
// Dimensione del testo dell'interfaccia: le pagine dei menù restano a misura fissa, si ingrandisce solo l'app
const ZOOMS=[['auto','Come il telefono'],['1','Normale'],['1.15','Grande'],['1.3','Molto grande']];
function uiZoom(){
  const z=(state&&state.settings.uiZoom)||'auto';let k=1;
  if(z==='auto'){try{k=AND&&AND.fontScale?Number(AND.fontScale())||1:1}catch(e){}}else k=Number(z)||1;
  return Math.max(1,Math.min(1.3,k));
}
function applyZoom(){const k=uiZoom();document.documentElement.style.setProperty('--z',k);['app','sheet','dlg'].forEach(id=>{document.getElementById(id).style.zoom=k===1?'':k})}
const appVersion=()=>{try{return AND&&AND.version?String(AND.version()||''):''}catch(e){return''}};
function vSettings(){
  const s=state.settings;
  return topbar(`<h1>Impostazioni</h1>`)+`<main class="main">
  <section class="grp"><div class="list"><button class="trow" data-a="nav" data-v="dishes"><span class="sw" style="display:grid;place-items:center;color:var(--olive)">${I.dish}</span><span>Archivio portate<small>${state.dishes.length} portate in ${allCats().length} categorie</small></span>${I.right}</button></div></section>
  <section class="grp"><h2>Nome del locale</h2><input class="inp" data-sf="venue" value="${esc(s.venue)}" placeholder="Compare in cima ai menù della domenica"><p class="hint">Lascia vuoto per non stamparlo.</p></section>
  <section class="grp"><h2>Template</h2><div class="list">${state.templates.map(t=>`<button class="trow" data-a="editTpl" data-id="${t.id}">${swatch(t,56)}<span>${esc(t.name)}<small>${esc((LAYOUTS[t.layout]||LAYOUTS.verticale).label)}</small></span>${I.right}</button>`).join('')}</div>
  <p class="hint">Per un nuovo template (battesimo, compleanno…) apri quello più simile e tocca “Duplica template”.</p></section>
  <section class="grp"><h2>Bevande preimpostate</h2><div class="list">${s.drinkPresets.map((d,i)=>`<div class="crow"><span>${esc(d)}</span><button class="ib" data-a="drDel" data-i="${i}" aria-label="Elimina">${I.trash}</button></div>`).join('')}</div>
  <div class="pk-new" style="margin-top:8px"><input class="inp" id="newdrink" placeholder="es. Prosecco di benvenuto"><button class="btn" data-a="drAdd">Aggiungi</button></div></section>
  <section class="grp"><h2>Portate del menù adulti</h2><div class="list">${state.categories.map((c,i)=>`<div class="crow"><span>${esc(c)}<small>${state.dishes.filter(d=>d.cat===c).length} portate · <i>${esc(catEn(c))}</i></small></span><button class="ib" data-a="catEn" data-i="${i}" aria-label="Nome in inglese" style="font-size:12px;font-weight:700;color:var(--olive)">EN</button><button class="ib" data-a="catMove" data-i="${i}" data-d="-1" aria-label="Sposta su">${I.up}</button><button class="ib" data-a="catMove" data-i="${i}" data-d="1" aria-label="Sposta giù">${I.down}</button><button class="ib" data-a="catRen" data-i="${i}" aria-label="Rinomina">${I.pen}</button><button class="ib" data-a="catDel" data-i="${i}" aria-label="Elimina">${I.trash}</button></div>`).join('')}</div>
  <div class="pk-new" style="margin-top:8px"><input class="inp" id="newcat" placeholder="es. Contorni"><button class="btn" data-a="catAdd">Aggiungi</button></div>
  <p class="hint">Queste sono le sezioni che compaiono sul menù (Antipasti, Primi Piatti…). Valgono per i nuovi menù.</p></section>
  <section class="grp"><h2>Dimensione del testo</h2><div class="stat">${ZOOMS.map(([v,l])=>`<button class="${(s.uiZoom||'auto')===v?'on':''}" style="--c:var(--olive)" data-a="setZoom" data-v="${v}">${l}</button>`).join('')}</div><p class="hint" style="margin-top:8px">Ingrandisce l'app, non i menù stampati.</p></section>
  <section class="grp"><h2>Backup</h2><div class="card"><p style="margin:0 0 12px;font-size:15px">Portate, template e menù sono salvati solo su questo telefono. Esporta un backup ogni tanto (su Drive o via email) per non perderli e per spostarli su un altro dispositivo.</p>
  <p class="hint" style="margin:0 2px 12px">Ultimo backup: <b>${s.lastBackup?new Date(s.lastBackup).toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'}):'mai fatto'}</b>${window.Android&&window.Android.autoBackup?`<br>Copia automatica sul telefono: <b>${ls.get(AUTO_DAY)?fmtLong(ls.get(AUTO_DAY)).replace(/^./,c=>c.toLowerCase()):'non ancora fatta'}</b>, nella cartella Download/MenuTenutaCoppa. Serve se l'app viene disinstallata o si guasta; non sostituisce il backup fuori dal telefono.`:''}</p>
  <div class="btns two"><button class="btn" data-a="export">${I.dl}Esporta</button><button class="btn" data-a="import">${I.share}Importa</button></div>
  ${ui.preImport?`<button class="btn wide" style="margin-top:8px" data-a="undoImport">Riprendi i dati di prima dell'ultima importazione</button>`:''}
  ${ui.scartati&&ui.scartati.length?`<button class="btn wide" style="margin-top:8px" data-a="exportOld">Esporta i dati messi da parte</button><p class="hint">Sono dati che questa versione dell'app non ha saputo leggere all'avvio.</p>`:''}</div></section>
  ${appVersion()?`<p class="hint" style="text-align:center">Menù Tenuta Coppa · versione ${esc(appVersion())}</p>`:''}
  </main>`+navbar();
}
function totText(m){
  const pa=num(val(m,'priceAdult'))||0,pk=num(val(m,'priceKid'))||0,ga=Number(m.guests)||0,gk=Number(m.guestsKids)||0;
  if(!(pa&&ga)&&!(pk&&gk))return pa||pk?'Inserisci il numero di ospiti per calcolare il totale.':'';
  const parts=[];if(pa&&ga)parts.push(`${ga} × ${eur(pa)}`);if(pk&&gk)parts.push(`${gk} × ${eur(pk)}`);
  return`Totale indicativo: ${parts.join(' + ')} = ${eur(pa*ga+pk*gk)}`;
}
function secsHTML(m,kids){
  return secList(m,kids).map((s,si)=>`<div class="sec"><div class="sec-h"><h3>${esc(s.name)}</h3>${!kids&&!s.items.length&&m.sections.length>1?`<button class="ib" style="margin-left:auto" data-a="secDel" data-s="${si}" aria-label="Togli la sezione ${esc(s.name)}">${I.trash}</button>`:''}<button class="add" data-a="pick" data-s="${si}" data-k="${kids?1:''}">${I.plus}Aggiungi</button></div>${s.items.map((it,ii)=>`<div class="it"><button class="nm" data-a="itEdit" data-s="${si}" data-i="${ii}" data-k="${kids?1:''}">${esc(oneLine(it.name))}${m.allergens&&algState(it)!=='ok'?` <span class="pill" style="--c:#B07A1E;margin-left:4px">allergeni?</span>`:''}</button><button class="ib" data-a="itMove" data-s="${si}" data-i="${ii}" data-d="-1" data-k="${kids?1:''}" aria-label="Sposta su">${I.up}</button><button class="ib" data-a="itMove" data-s="${si}" data-i="${ii}" data-d="1" data-k="${kids?1:''}" aria-label="Sposta giù">${I.down}</button><button class="ib" data-a="itDel" data-s="${si}" data-i="${ii}" data-k="${kids?1:''}" aria-label="Togli">${I.x}</button></div>`).join('')}</div>`).join('');
}
function drinksField(m,f,label){
  return`<label class="fld"><span>${label}</span><textarea class="inp" data-f="${f}" rows="2" style="min-height:70px">${esc(val(m,f))}</textarea></label>
  <div class="chips">${state.settings.drinkPresets.map((d,i)=>`<button data-a="drPick" data-f="${f}" data-i="${i}">+ ${esc(d)}</button>`).join('')}</div>`;
}
function enSection(m,t){
  const ev=t.layout==='evento'||t.layout==='libretto',mis=missingEn(m).length;
  const rows=(kids)=>secList(m,kids).map((sec,si)=>sec.items.length?`<p class="hint" style="margin:10px 2px 4px"><b>${esc(catEn(sec.name))}</b></p>`+sec.items.map((it,ii)=>`<label class="fld" style="margin-bottom:8px"><span>${esc(oneLine(it.name))}</span><textarea class="inp" data-en="${kids?1:0}:${si}:${ii}" rows="2" style="min-height:64px" placeholder="Traduzione in inglese">${esc(oneLine(itemEn(it)))}</textarea></label>`).join(''):'').join('');
  return`<details class="grp card" ${ui.enOpen?'open':''} data-det="en"><summary style="font-weight:600;cursor:pointer">In inglese${mis?` <span class="pill" style="--c:#B07A1E;margin-left:6px">${mis} da tradurre</span>`:''}</summary>
    <p class="hint" style="margin:8px 2px 12px">Serve per la versione English dell'anteprima. Le traduzioni delle portate vengono salvate nell'archivio e riusate nei prossimi menù.</p>
    <label class="fld"><span>Titolo</span><input class="inp" data-f="headingEn" value="${esc(m.headingEn||'')}" placeholder="${esc(enOf(t,'heading')||'')}"></label>
    ${rows(false)}${ev&&m.kids!==false?`<p class="hint" style="margin:14px 2px 0"><b>${esc(m.headingKidsEn||enOf(t,'headingKids')||'Kids menu')}</b></p>`+rows(true):''}
    <label class="fld" style="margin-top:12px"><span>Bevande</span><textarea class="inp" data-f="drinksEn" rows="2" placeholder="${esc(enOf(t,'drinks')||'')}">${esc(m.drinksEn||'')}</textarea></label>
    ${ev?`<label class="fld"><span>Bevande bambini</span><input class="inp" data-f="drinksKidsEn" value="${esc(m.drinksKidsEn||'')}" placeholder="${esc(enOf(t,'drinksKids')||'')}"></label>`:`<label class="fld"><span>Dicitura bambini</span><input class="inp" data-f="kidLabelEn" value="${esc(m.kidLabelEn||'')}" placeholder="${esc(enOf(t,'kidLabel')||'')}"></label>`}
    <label class="fld"><span>Note per la proposta</span><textarea class="inp" data-f="notesEn" rows="2">${esc(m.notesEn||'')}</textarea></label>
  </details>`;
}
function vEdit(){
  const m=getMenu(ui.editId);if(!m){ui.view='cal';return vCal()}
  const t=tplOf(m),st=m.status||'bozza',ev=t.layout==='evento',cl=t.layout==='classico',lb=t.layout==='libretto';
  const fld=(label,f,type='text',extra='',v)=>`<label class="fld"><span>${label}</span><input class="inp" type="${type}" data-f="${f}" value="${esc(v!==undefined?v:m[f])}" ${extra}></label>`;
  return topbar(`<button class="ib" data-a="back" aria-label="Indietro">${I.back}</button><h1>${esc(heading(m))}</h1><button class="ib" data-a="preview" data-mode="tavolo" aria-label="Anteprima">${I.eye}</button>`)+
  `<main class="main">
  <section class="grp"><h2>Template</h2><div class="tchips">${state.templates.map(x=>`<button class="tchip${x.id===t.id?' on':''}" data-a="setTpl" data-id="${x.id}">${swatch(x)}<span>${esc(x.name)}</span></button>`).join('')}</div></section>
  <section class="grp"><h2>Intestazione</h2>
    ${fld(ev?'Titolo menù adulti':lb?'Titolo in copertina':'Titolo','heading','text',`placeholder="${lb?'es. Il battesimo di Adele':esc(t.heading)}"`)}
    ${ev||cl?'':`<label class="tog"><input type="checkbox" data-fc="showDate" ${m.showDate!==false?'checked':''}>${lb?'Stampa la data in copertina':'Stampa la data sotto il titolo'}</label>`}
    ${lb?`<label class="tog"><input type="checkbox" data-fc="holes" ${m.holes!==false?'checked':''}>Segna dove fare i fori per i laccetti</label>`:''}
  </section>
  <section class="grp"><h2>Evento</h2>
    <div class="row2">${fld('Data','date','date')}${fld('Ora','time','time')}</div>
    ${fld('Cliente','client','text','placeholder="es. Famiglia Rossi" autocomplete="off"')}
    <div class="row2">${fld('Adulti','guests','number','inputmode="numeric" min="0"')}${fld('Bambini','guestsKids','number','inputmode="numeric" min="0"')}</div>
    <div class="row2">${fld('Telefono','phone','tel')}${fld('Sala','room','text')}</div>
    <div class="stat">${Object.entries(STATUS).map(([k,s])=>`<button class="${st===k?'on':''}" style="--c:${s.c}" data-a="setStatus" data-v="${k}"><i></i>${s.l}</button>`).join('')}</div>
  </section>
  <section class="grp"><h2>Portate${ev?' – menù adulti':''}</h2>
    ${secsHTML(m,false)}
    <button class="btn wide" style="margin:2px 0 10px" data-a="addSec">${I.plus}Aggiungi una sezione</button>
    ${ev?'':`<label class="tog"><input type="checkbox" data-fc="showSections" ${m.showSections!==false?'checked':''}>Stampa i titoli (Antipasti, Primi Piatti…)</label>`}
    <label class="tog"><input type="checkbox" data-fc="allergens" ${m.allergens?'checked':''}>Indica gli allergeni accanto alle portate</label>
    <p class="hint">Le sezioni vuote non compaiono. Tocca una portata per modificarla solo in questo menù. Gli allergeni si impostano nell'archivio portate (Altro → Archivio portate).</p>
  </section>
  ${ev||lb?`<section class="grp"><h2>Menù bambini</h2>
    <label class="tog"><input type="checkbox" data-fc="kids" data-re="1" ${m.kids!==false?'checked':''}>Includi il menù bambini</label>
    ${m.kids!==false?fld('Titolo menù bambini','headingKids','text','',val(m,'headingKids'))+secsHTML(m,true):''}</section>`:''}
  <section class="grp"><h2>Bevande</h2>
    ${drinksField(m,'drinks',ev?'Bevande adulti':'Bevande')}
    ${ev&&m.kids!==false?drinksField(m,'drinksKids','Bevande bambini'):''}
  </section>
  <section class="grp"><h2>Prezzi e note (solo proposta)</h2>
    ${priceInherited(m)?`<p class="hint" style="color:#8A5A12;margin:0 2px 6px">Prezzo predefinito del template: confermalo o scrivi quello concordato.</p>`:''}
    <div class="row2">${fld('Adulti (€)','priceAdult','text','inputmode="decimal" placeholder="es. 50"',val(m,'priceAdult'))}${fld('Bambini (€)','priceKid','text','inputmode="decimal" placeholder="es. 25"',val(m,'priceKid'))}</div>
    ${ev?'':fld('Dicitura bambini','kidLabel','text','placeholder="Bambini fino a 10 anni"',val(m,'kidLabel'))}
    <p class="hint" id="tot">${totText(m)}</p>
    <label class="fld"><span>Note per il cliente</span><textarea class="inp" data-f="notes" placeholder="es. Acconto del 30% alla conferma.">${esc(m.notes)}</textarea></label>
  </section>
  ${enSection(m,t)}
  <div class="btns two" style="margin-bottom:10px"><button class="btn pri" data-a="preview" data-mode="tavolo">${I.pdf}${lb?'Libretto':'Menù tavolo'}</button><button class="btn pri" data-a="preview" data-mode="proposta">${I.pdf}Proposta</button></div>
  <p class="hint" style="margin:-2px 2px 14px">Il menù tavolo non riporta prezzi e note; la proposta sì.</p>
  <div class="btns two"><button class="btn" data-a="dup">${I.copy}Duplica</button><button class="btn danger" data-a="del">${I.trash}Elimina</button></div>
  </main>`;
}
function vPreview(){
  const m=getMenu(ui.editId);if(!m){ui.view='cal';return vCal()}
  return topbar(`<button class="ib" data-a="back" aria-label="Indietro">${I.back}</button><h1>Anteprima</h1>`)+
  `<main class="main"><div class="seg" style="margin-bottom:8px"><button class="${ui.pv.lang!=='en'?'on':''}" data-a="pvLang" data-v="it">Italiano</button><button class="${ui.pv.lang==='en'?'on':''}" data-a="pvLang" data-v="en">English</button></div>
  ${ui.pv.lang==='en'&&missingEn(m).length?`<div class="card" style="margin-bottom:12px;font-size:14px">${missingEn(m).length===1?'Una portata non ha':missingEn(m).length+' portate non hanno'} ancora la traduzione e ${missingEn(m).length===1?'resta':'restano'} in italiano. <button class="btn" style="margin-top:8px;width:100%" data-a="back">${I.pen}Completa nella sezione “In inglese” del menù</button></div>`:''}
  <div class="seg"><button class="${ui.pv.mode==='tavolo'?'on':''}" data-a="pvMode" data-v="tavolo">Menù tavolo</button><button class="${ui.pv.mode==='proposta'?'on':''}" data-a="pvMode" data-v="proposta">Proposta</button></div>
  ${ui.pv.mode==='proposta'&&priceInherited(m)?`<p class="hint" style="color:#8A5A12;margin:0 2px 6px">Stai usando il prezzo predefinito del template: controlla che sia quello concordato.</p>`:''}
  ${ui.pv.mode==='proposta'?`<div class="row2" style="margin-bottom:4px">
    <label class="fld"><span>Prezzo adulti (€)</span><input class="inp" data-f="priceAdult" data-pv="1" inputmode="decimal" value="${esc(val(m,'priceAdult'))}" placeholder="obbligatorio"></label>
    <label class="fld"><span>Prezzo bambini (€)</span><input class="inp" data-f="priceKid" data-pv="1" inputmode="decimal" value="${esc(val(m,'priceKid'))}" placeholder="facoltativo"></label></div>`:''}
  ${(L=>L.length?`<div class="card warn"><b>Allergeni da controllare</b> per ${L.length===1?'una portata':L.length+' portate'}: ${L.slice(0,4).map(i=>esc(oneLine(i.name))).join('; ')}${L.length>4?'…':''}.<br>Sul menù ${L.some(i=>algState(i)==='manca')?'risulterebbero senza allergeni anche se non li hai mai indicati':'compaiono quelli della portata originale'}. <button class="btn" style="margin-top:8px;width:100%" data-a="back">${I.pen}Torna al menù e tocca le portate segnate</button></div>`:'')(algTodo(m))}
  <div id="pv-warn"></div>
  ${tplOf(m).layout==='libretto'?`<div class="pv" id="pvc"></div>`:''}
  <div class="pv" id="pv"></div>
  <div class="btns">
    <button class="btn wa wide" data-a="waMenu">${I.wa}Invia su WhatsApp</button>
    <button class="btn wide" data-a="pdf">${I.pdf}Crea PDF (stampa, email…)</button>
  </div>
  <p class="hint" style="text-align:center;margin-top:10px">${ui.pv.mode==='proposta'?'Il messaggio per il cliente è già pronto: puoi modificarlo prima dell\'invio.':tplOf(m).layout==='libretto'?'“Crea PDF” prepara 2 fogli A4 da stampare solo fronte: il primo con 2 copertine, il secondo con 2 menù. Taglia a metà seguendo le tacche, metti ogni menù dietro la sua copertina, fora a sinistra sui segni e lega con i laccetti.':'Per la stampa usa “Crea PDF”.'}</p></main>`;
}
function vTpl(){
  const t=getTpl(ui.tplId);if(!t){ui.view='settings';return vSettings()}
  const ev=t.layout==='evento',cl=t.layout==='classico',lb=t.layout==='libretto';
  const f=(label,k,type='text',extra='')=>`<label class="fld"><span>${label}</span><input class="inp" type="${type}" data-tf="${k}" value="${esc(t[k])}" ${extra}></label>`;
  return topbar(`<button class="ib" data-a="back" aria-label="Indietro">${I.back}</button><h1>${esc(t.name)}</h1>`)+
  `<main class="main">${lb?`<div class="pv" id="tplpvc"></div>`:''}<div class="pv" id="tplpv"></div>
  <section class="grp"><h2>Nome e titoli</h2>${f('Nome del template','name')}${f(ev?'Titolo menù adulti':lb?'Titolo in copertina':'Titolo predefinito','heading')}${ev||lb?f('Titolo menù bambini','headingKids'):''}${lb?f('Titolo delle bevande','drinksTitle'):''}${cl?f('Sottotitolo','subheading'):''}</section>
  <section class="grp"><h2>Valori predefiniti per i nuovi menù</h2>
    <label class="fld"><span>Bevande${ev?' adulti':''}</span><textarea class="inp" data-tf="drinks" rows="2" style="min-height:70px">${esc(t.drinks)}</textarea></label>
    ${ev?`<label class="fld"><span>Bevande bambini</span><textarea class="inp" data-tf="drinksKids" rows="2" style="min-height:70px">${esc(t.drinksKids)}</textarea></label>`:''}
    <div class="row2">${f('Prezzo adulti (€)','priceAdult','text','inputmode="decimal"')}${f('Prezzo bambini (€)','priceKid','text','inputmode="decimal"')}</div>
    ${ev?'':f('Dicitura bambini','kidLabel')}</section>
  <section class="grp"><h2>Aspetto</h2><div class="card">
    <label class="clr"><input type="color" data-tf="ink" value="${t.ink}">Colore del testo</label>
    ${cl?`<label class="clr"><input type="color" data-tf="accent" value="${t.accent||'#354469'}">Colore dei titoli</label>`:''}
    <label class="clr"><input type="color" data-tf="bgColor" value="${t.bgColor}">Colore di sfondo</label>
    <p class="hint">Per la stampa su fogli bianchi lascia lo sfondo bianco.</p>
    ${ev||cl||lb?'':`<div class="rng" style="margin-top:8px"><span>Fine testo</span><input type="range" min="900" max="1420" step="5" value="${t.limit||1240}" data-tl="1"><b id="tl">${Math.round((t.limit||1240)/14.4)}%</b></div><p class="hint">Sposta per non far sovrapporre il testo alle illustrazioni in basso.</p>`}
  </div></section>
  <section class="grp"><h2>Sfondo</h2><div class="card">
    <p style="margin:0 0 12px;font-size:15px">Per cambiare illustrazioni, esporta da Canva la pagina <b>senza testi</b> come PNG, nel formato ${ev?'A4 orizzontale':cl?'A4 verticale':lb?'A5 orizzontale (una per la copertina e una per il menù interno)':'810 × 1440'}.</p>
    ${lb?[['coverImage','origCover','copertina'],['bgImage','origBg','menù interno']].map(([k,o,l])=>`<div class="btns ${t[o]&&t[k]!==t[o]?'two':''}" style="margin-bottom:8px"><button class="btn" data-a="tplBg" data-slot="${k}">${I.img}Carica ${l}</button>${t[o]&&t[k]!==t[o]?`<button class="btn" data-a="tplBgReset" data-slot="${k}">Ripristina</button>`:''}</div>`).join('')
    :`<div class="btns ${t.origBg&&t.bgImage!==t.origBg?'two':''}"><button class="btn" data-a="tplBg">${I.img}Carica immagine</button>${t.origBg&&t.bgImage!==t.origBg?`<button class="btn" data-a="tplBgReset">Ripristina</button>`:''}</div>`}</div></section>
  <div class="btns two"><button class="btn" data-a="dupTpl">${I.copy}Duplica template</button>${state.templates.length>1?`<button class="btn danger" data-a="delTpl">${I.trash}Elimina</button>`:''}</div>
  </main>`;
}

'use strict';
// Fogli dal basso, disegno delle schermate, avvisi e finestre di conferma.
// I file in js/ sono script normali caricati in ordine da index.html: variabili e funzioni sono condivise fra tutti.
/* ---------- Fogli (bottom sheet) ---------- */
function curSec(){const m=getMenu(ui.editId);return secList(m,ui.sheet.kids)[ui.sheet.s]}
function pickListHTML(){
  const s=curSec(),q=norm(ui.pickQ),cat=ui.sheet.kids?KIDS_CAT:s.name;
  if(!ui.sheet.kids&&!allCats().includes(cat))ui.pickAll=true;
  const uso={};state.menus.forEach(mm=>allSecs(mm).forEach(ss=>ss.items.forEach(it=>{if(it.dishId)uso[it.dishId]=(uso[it.dishId]||0)+1})));
  const L=state.dishes.filter(x=>(ui.pickAll||x.cat===cat)&&(!q||norm(x.name).includes(q))).sort((a,b)=>(uso[b.id]||0)-(uso[a.id]||0)||a.name.localeCompare(b.name,'it'));
  if(!L.length)return`<p class="empty">${q?'Nessuna portata trovata. Scrivila qui sotto per aggiungerla.':'Nessuna portata in questa categoria. Aggiungila qui sotto.'}</p>`;
  return L.map(x=>{const on=s.items.some(i=>i.dishId===x.id);return`<button class="pk${on?' on':''}" data-a="pickToggle" data-id="${x.id}"><span>${esc(oneLine(x.name))}${x.cat!==cat?`<small>${esc(x.cat)}</small>`:''}</span><i>${on?I.check:I.plus}</i></button>`}).join('');
}
function renderSheet(){
  const el=$('#sheet'),sh=ui.sheet;
  if(!sh){el.innerHTML='';return}
  let h='';
  const head=title=>`<div class="sh-h"><h3>${esc(title)}</h3><button class="ib" data-a="closeSheet" aria-label="Chiudi">${I.x}</button></div>`;
  if(sh.type==='picker'){
    const s=curSec();
    h=head(sh.kids?`Bambini – ${s.name}`:s.name)+`
    <input class="inp" type="search" placeholder="Cerca portata" data-in="pickQ" value="${esc(ui.pickQ)}">
    <label class="tog"><input type="checkbox" data-pk="all" ${ui.pickAll?'checked':''}>Mostra le portate di tutte le categorie</label>
    <div id="pklist">${pickListHTML()}</div>
    <div class="pk-new"><input class="inp" id="pknew" placeholder="Nuova portata" enterkeyhint="done"><button class="btn" data-a="pickNew">Aggiungi</button></div>
    <button class="btn pri wide" data-a="closeSheet">Fatto</button>`;
  }else if(sh.type==='addSec'){
    const mm=getMenu(ui.editId),have=new Set(mm.sections.map(x=>x.name)),miss=state.categories.filter(c=>!have.has(c));
    h=head('Aggiungi una sezione')+(miss.length?`<div class="list" style="margin-bottom:12px">${miss.map(c=>`<button class="drow" data-a="addSecPick" data-v="${esc(c)}"><span>${esc(c)}</span>${I.plus}</button>`).join('')}</div>`:'')+`
    <div class="pk-new"><input class="inp" id="secnew" placeholder="${miss.length?'Oppure un altro nome':'es. Contorni'}" enterkeyhint="done" autocomplete="off"><button class="btn" data-a="addSecNew">Aggiungi</button></div>
    <p class="hint">Vale solo per questo menù. Le sezioni dei nuovi menù si decidono in Altro.</p>`;
  }else if(sh.type==='dish'){
    const d=sh.id?state.dishes.find(x=>x.id===sh.id):{name:'',cat:state.categories[0]};
    h=head(sh.id?'Modifica portata':'Nuova portata')+`
    <label class="fld"><span>Nome</span><textarea class="inp" id="dname" rows="3" style="min-height:90px">${esc(d.name)}</textarea></label>
    <label class="fld"><span>Nome in inglese</span><textarea class="inp" id="den" rows="2" style="min-height:70px" placeholder="Per i menù in inglese">${esc(d.en||'')}</textarea></label>
    <p class="hint" style="margin:-6px 2px 12px">Vai a capo per spezzare la riga sul menù, come in Canva.</p>
    <label class="fld"><span>Allergeni</span></label>
    ${algChips(sh)}<p class="hint" style="margin:-8px 2px 12px">Se non ne contiene tocca “Nessuno”: così l'app sa che li hai controllati.</p>
    <label class="fld"><span>Categoria</span><select class="inp" id="dcat">${allCats().map(c=>`<option ${c===d.cat?'selected':''}>${esc(c)}</option>`).join('')}</select></label>
    <div class="btns ${sh.id?'two':''}"><button class="btn pri" data-a="saveDish">Salva</button>${sh.id?`<button class="btn danger" data-a="delDish">${I.trash}Elimina</button>`:''}</div>
    ${sh.id?'<p class="hint">Cambiare il nome o eliminare la portata non tocca i menù già composti. Gli allergeni invece valgono per tutti i menù che la usano.</p>':''}`;
  }else if(sh.type==='item'){
    const it=secList(getMenu(ui.editId),sh.kids)[sh.s].items[sh.i],st=algState(it);
    h=head('Portata in questo menù')+`
    <label class="fld"><span>Testo stampato</span><textarea class="inp" id="iname" rows="3" style="min-height:90px">${esc(it.name)}</textarea></label>
    <p class="hint" style="margin:-6px 2px 12px">La modifica del testo vale solo per questo menù, l'archivio resta com'è.</p>
    <label class="fld"><span>Allergeni</span></label>
    ${st==='manca'?`<p class="hint" style="color:#8A5A12;margin:-2px 2px 8px">Non sono mai stati indicati per questa portata.</p>`:st==='verifica'?`<p class="hint" style="color:#8A5A12;margin:-2px 2px 8px">Il testo è diverso da quello dell'archivio: controlla che questi allergeni valgano ancora.</p>`:''}
    ${algChips(sh)}
    ${st!=='ok'?`<label class="tog" style="margin:-6px 0 10px"><input type="checkbox" id="algok">Li ho controllati, vanno bene così</label>`:''}
    <p class="hint" style="margin:0 2px 12px">Se il testo è quello dell'archivio gli allergeni vengono salvati nell'archivio e valgono per tutti i menù; se lo hai cambiato valgono solo qui.</p>
    <button class="btn pri wide" data-a="saveItem">Salva</button>`;
  }else if(sh.type==='wa'&&sh.step===2){
    const nf=sh.files.length,cosa=nf>1?`i ${nf} file`:sh.files[0].mime==='application/pdf'?'il PDF':sh.files[0].mime.startsWith('image/')?"l'immagine":'il file';
    h=head(sh.title)+`<div class="wa-step done"><b>1</b><span>Il messaggio è nella chat: in WhatsApp tocca <b>Invia</b>.</span></div>
    <div class="wa-step"><b>2</b><span>Torna qui e allega ${cosa}${sh.phone?' nella stessa chat':': in WhatsApp scegli la stessa chat'}.</span></div>
    <div class="btns"><button class="btn wa" data-a="waFiles">${I.wa}Allega ${cosa}</button><button class="btn" data-a="waStep1">Riapri il messaggio</button></div>`;
  }else if(sh.type==='wa'){
    h=head(sh.title)+(sh.menuId?`<div class="seg" style="margin-bottom:8px"><button class="${sh.fmt!=='pdf'?'on':''}" data-a="waFmt" data-v="img">Immagine</button><button class="${sh.fmt==='pdf'?'on':''}" data-a="waFmt" data-v="pdf">PDF</button></div>
    <p class="hint" style="margin:0 2px 12px">${sh.fmt==='pdf'?'Il PDF è adatto se il cliente deve stamparlo.':'L\'immagine si vede subito in chat, senza doverla aprire.'}</p>`:'')+`<p class="hint" style="margin-bottom:12px;word-break:break-all">${sh.files.map(f=>esc(f.name)).join('<br>')}</p>
    <label class="fld"><span>Numero WhatsApp (facoltativo)</span><input class="inp" type="tel" id="waphone" value="${esc(sh.phone)}" placeholder="Se lo lasci vuoto scegli tu la chat"></label>
    <label class="fld"><span>Messaggio</span><textarea class="inp" id="watext" rows="7" style="min-height:160px">${esc(sh.text)}</textarea></label>
    <div class="btns"><button class="btn wa" data-a="waSend">${I.wa}Apri WhatsApp</button><button class="btn" data-a="waOther">${I.share}Invia con un'altra app</button></div>
    <p class="hint" style="margin-top:10px">${AND?'Si fa in due passaggi: prima WhatsApp apre la chat con il messaggio già scritto, poi torni qui e alleghi il file. Sei sempre tu a toccare Invia.':'Il messaggio viene copiato anche negli appunti: se non compare sotto al file, tieni premuto nel campo di testo e scegli Incolla.'}</p>`;
  }else if(sh.type==='file'&&sh.backup&&AND&&sh.step==='conf'){
    h=head(sh.title)+`<p style="margin:0 2px 16px;font-size:15px">Hai inviato o salvato il file fino in fondo? Se hai annullato o chiuso l'altra app, il backup non è stato fatto.</p>
    <div class="btns"><button class="btn pri" data-a="bkYes">${I.check}Sì, il backup è al sicuro</button><button class="btn" data-a="bkNo">No, riprovo</button></div>`;
  }else if(sh.type==='file'&&sh.backup&&AND){
    h=head(sh.title)+`<p class="hint" style="margin-bottom:14px;word-break:break-all">${esc(sh.name)}</p>
    <div class="btns">${AND.saveAs?`<button class="btn pri" data-a="saveAs">${I.dl}Salva in una cartella (telefono, Drive…)</button>`:''}<button class="btn ${AND.saveAs?'':'pri'}" data-a="shareFile">${I.share}Invia (email, WhatsApp…)</button></div>
    <p class="hint" style="margin-top:12px">Il file contiene nomi e telefoni dei clienti: mandalo solo a te stesso. Per proteggerti dalla rottura o dalla perdita del telefono deve finire fuori dal telefono (Drive o email).</p>`;
  }else if(sh.type==='file'){
    const cs=canShareFiles();
    h=head(sh.title)+`<p class="hint" style="margin-bottom:14px;word-break:break-all">${esc(sh.name)}</p>
    <div class="btns">${cs?`<button class="btn pri" data-a="shareFile">${I.share}Condividi (WhatsApp, email, stampa…)</button>`:''}${AND&&AND.saveAs?`<div class="btns two"><button class="btn" data-a="saveAs">${I.dl}Salva</button><button class="btn" data-a="downloadFile">${I.eye}Apri</button></div>`:`<button class="btn ${cs?'':'pri'}" data-a="downloadFile">${I.dl}Scarica</button>`}</div>`;
  }
  el.innerHTML=`<div class="shbg" data-a="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true">${h}</div>`;
  if(sh.type==='dish'&&!sh.id)setTimeout(()=>$('#dname')?.focus(),250);
}

/* ---------- Render ---------- */
function render(keep){
  const y=window.scrollY;
  const V={cal:vCal,list:vList,dishes:vDishes,settings:vSettings,edit:vEdit,preview:vPreview,tpl:vTpl,ostie:vOstie,didattica:vDidattica};
  $('#app').innerHTML=(V[ui.view]||vCal)();
  window.scrollTo(0,keep?y:0);
  mountPreviews();
  if(ui.view==='ostie')ui.stampa==='sp'?paintSp():paintOstia();
}
let toastT;
let toastAct=null;
function toast(msg,act){let t=$('.toast');if(!t){t=document.createElement('div');t.className='toast';t.setAttribute('role','status');document.body.appendChild(t)}
  t.textContent=msg;toastAct=null;
  if(act){toastAct=act.fn;const b=document.createElement('button');b.textContent=act.label;b.dataset.toast='1';t.appendChild(b)}
  clearTimeout(toastT);toastT=setTimeout(()=>{t.remove();toastAct=null},act?7000:3400)}
// Finestre di conferma dell'app (al posto di quelle di sistema, che nell'app Android mostrano un indirizzo interno).
// ask() risponde true/false; con "input" risponde il testo scritto, oppure null se si annulla.
let dlgRes=null,dlgInput=false;
function ask(o){
  return new Promise(res=>{
    if(dlgRes)closeDlg(false);
    dlgRes=res;dlgInput=o.input!==undefined;
    $('#dlg').innerHTML=`<div class="shbg" data-dlg="no" style="z-index:70"></div><div class="dlg" role="alertdialog" aria-modal="true" aria-labelledby="dlgt"><h3 id="dlgt">${esc(o.title)}</h3>${o.text?`<p>${nl(o.text)}</p>`:''}
      ${dlgInput?`<input class="inp" id="dlgin" value="${esc(o.input)}" placeholder="${esc(o.placeholder||'')}" enterkeyhint="done" autocomplete="off">`:''}
      <div class="btns ${o.alert?'':'two'}">${o.alert?'':`<button class="btn" data-dlg="no">${esc(o.cancel||'Annulla')}</button>`}<button class="btn ${o.danger?'danger-f':'pri'}" data-dlg="yes">${esc(o.ok||'OK')}</button></div></div>`;
    if(dlgInput)setTimeout(()=>{const i=$('#dlgin');if(i){i.focus();i.select()}},60);
  });
}
function closeDlg(yes){const r=dlgRes;if(!r)return;const i=$('#dlgin');dlgRes=null;$('#dlg').innerHTML='';r(dlgInput?(yes&&i?i.value:null):!!yes)}
function busy(on,msg){let b=$('.busy');if(on){if(!b){b=document.createElement('div');b.className='busy';document.body.appendChild(b)}b.innerHTML=`<div><div class="spin"></div>${esc(msg)}</div>`}else b?.remove()}
// L'archivio non si legge: non apro un archivio vuoto, che al primo salvataggio sovrascriverebbe quello vero
function fatal(){
  canSave=false;
  $('#app').innerHTML=`<main class="main" style="padding-top:20vh;text-align:center"><h1 style="font:italic 500 30px/1.2 'Cormorant Garamond',Georgia,serif;margin:0 0 14px">Archivio non raggiungibile</h1>
  <p style="color:var(--muted);margin:0 0 22px">L'app non riesce a leggere i dati salvati sul telefono. Per non rischiare di sovrascriverli non ho aperto un archivio vuoto.<br><br>Chiudi del tutto l'app e riaprila. Se succede ancora, riavvia il telefono.</p>
  <button class="btn pri" data-a="reload">Riprova</button></main>`;
}
function leaveEdit(){
  if(ui.view!=='edit')return;
  const m=getMenu(ui.editId);
  if(m&&isEmptyMenu(m)){state.menus=state.menus.filter(x=>x!==m);save()}
}
function openEditor(id){ui.back=['cal','list'].includes(ui.view)?ui.view:ui.back;ui.editId=id;ui.view='edit';render()}

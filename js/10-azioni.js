'use strict';
// Azioni: tocchi, campi di testo, importazione.
// I file in js/ sono script normali caricati in ordine da index.html: variabili e funzioni sono condivise fra tutti.
/* ---------- Azioni ---------- */
document.addEventListener('toggle',e=>{if(e.target.dataset&&e.target.dataset.det==='en')ui.enOpen=e.target.open},true);
document.addEventListener('click',e=>{
  const dg=e.target.closest('[data-dlg]');if(dg){closeDlg(dg.dataset.dlg==='yes');return}
  if(e.target.closest('[data-toast]')){const f=toastAct;toastAct=null;clearTimeout(toastT);$('.toast')?.remove();if(f)f();return}
  const b=e.target.closest('[data-a]');if(!b)return;
  const a=b.dataset.a,d=b.dataset,m=ui.editId?getMenu(ui.editId):null,K=!!d.k;
  switch(a){
    case 'reload':location.reload();break;
    case 'setZoom':state.settings.uiZoom=d.v;save();applyZoom();render(true);break;
    case 'nav':leaveEdit();ui.view=d.v;render();break;
    case 'calMove':{let mm=ui.cal.m+Number(d.d),yy=ui.cal.y;if(mm<0){mm=11;yy--}if(mm>11){mm=0;yy++}ui.cal={y:yy,m:mm};render(true);break}
    case 'calToday':{const n=new Date();ui.cal={y:n.getFullYear(),m:n.getMonth()};ui.selDate=today();render();break}
    case 'selDay':ui.selDate=d.d;render(true);break;
    case 'new':{const nm=newMenu(ui.view==='cal'?ui.selDate:today());state.menus.push(nm);save();openEditor(nm.id);break}
    case 'open':openEditor(d.id);break;
    case 'back':
      if(ui.view==='edit'){leaveEdit();ui.view=ui.back||'cal';if(m&&m.date&&ui.view==='cal'){const dt=parseD(m.date);ui.selDate=m.date;ui.cal={y:dt.getFullYear(),m:dt.getMonth()}}}
      else if(ui.view==='preview')ui.view='edit';
      else if(ui.view==='tpl'||ui.view==='dishes')ui.view='settings';
      render();break;
    case 'setTpl':if(m){m.templateId=d.id;state.settings.lastTpl=d.id;save();render(true)}break;
    case 'setStatus':if(m){m.status=d.v;save();render(true)}break;
    case 'pick':ui.sheet={type:'picker',s:+d.s,kids:K};ui.pickQ='';ui.pickAll=false;renderSheet();break;
    case 'addSec':ui.sheet={type:'addSec'};renderSheet();break;
    case 'addSecPick':case 'addSecNew':{
      const name=(a==='addSecPick'?d.v:$('#secnew').value).trim();if(!name)break;
      if(m.sections.some(x=>norm(x.name)===norm(name))){toast('Questa sezione è già nel menù');break}
      // le sezioni note vanno al loro posto nell'ordine di Altro, le altre in fondo
      const ord=state.categories.indexOf(name);let pos=m.sections.length;
      if(ord>=0){const j=m.sections.findIndex(x=>state.categories.indexOf(x.name)>ord);if(j>=0)pos=j}
      m.sections.splice(pos,0,{name,items:[]});save();ui.sheet=null;renderSheet();render(true);break}
    case 'secDel':{const i=+d.s,sec=m.sections[i];if(!sec||sec.items.length)break;m.sections.splice(i,1);save();render(true);
      toast('Sezione tolta dal menù',{label:'Annulla',fn:()=>{m.sections.splice(Math.min(i,m.sections.length),0,sec);save();if(ui.view==='edit')render(true)}});break}
    case 'pickToggle':{
      const s=curSec(),x=state.dishes.find(z=>z.id===d.id);if(!x)break;
      const i=s.items.findIndex(z=>z.dishId===x.id);
      if(i>=0)s.items.splice(i,1);else s.items.push({dishId:x.id,name:x.name});
      save();$('#pklist').innerHTML=pickListHTML();render(true);break}
    case 'pickNew':{
      const inp=$('#pknew'),name=inp.value.trim();if(!name)break;
      const s=curSec(),cat=ui.sheet.kids?KIDS_CAT:(state.categories.includes(s.name)?s.name:state.categories[0]);
      let x=state.dishes.find(z=>norm(z.name)===norm(name)&&z.cat===cat);
      if(!x){x={id:uid(),name,cat};state.dishes.push(x)}
      if(!s.items.some(z=>z.dishId===x.id))s.items.push({dishId:x.id,name:x.name});
      inp.value='';save();$('#pklist').innerHTML=pickListHTML();render(true);toast("Portata aggiunta al menù e all'archivio");break}
    case 'itMove':{const L=secList(m,K)[+d.s].items,i=+d.i,j=i+Number(d.d);if(j<0||j>=L.length)break;[L[i],L[j]]=[L[j],L[i]];save();render(true);break}
    case 'itDel':{const L=secList(m,K)[+d.s].items,i=+d.i,[tolta]=L.splice(i,1);save();render(true);
      toast('Portata tolta dal menù',{label:'Annulla',fn:()=>{L.splice(Math.min(i,L.length),0,tolta);save();if(ui.view==='edit')render(true)}});break}
    case 'itEdit':{const it=secList(m,K)[+d.s].items[+d.i],al=[...algNums(it)];ui.sheet={type:'item',s:+d.s,i:+d.i,kids:K,alg:al,none:algState(it)==='ok'&&!al.length};renderSheet();break}
    case 'saveItem':{const sh=ui.sheet,it=secList(m,sh.kids)[sh.s].items[sh.i],v=$('#iname').value.trim();if(v)it.name=v;
      if(sh.touched||$('#algok')?.checked){
        const alg=[...sh.alg],set=alg.length>0||sh.none||!!$('#algok')?.checked,dd=dishOf(it);
        if(!set)delete it.alg;                                                   // tolto tutto senza scegliere "Nessuno": torna da indicare
        else if(dd&&!itemChanged(it)){dd.alg=alg;dd.algSet=true;delete it.alg}   // stesso testo dell'archivio: vale per tutti i menù
        else it.alg=alg;                                                         // testo cambiato o portata non più in archivio: solo qui
      }
      save();ui.sheet=null;renderSheet();render(true);break}
    case 'drPick':{const p=state.settings.drinkPresets[+d.i],cur=String(val(m,d.f)).trim();m[d.f]=cur?cur+'\n'+p:p;save();render(true);break}
    case 'preview':ui.pv={mode:d.mode||'tavolo',lang:(ui.pv&&ui.pv.lang)||'it'};ui.view='preview';render();break;
    case 'pvMode':ui.pv.mode=d.v;render(true);break;
    case 'pvLang':ui.pv.lang=d.v;render(true);break;
    case 'pdf':prezzoOk().then(ok=>{if(ok)doPDF()});break;
    case 'shareFile':shareFile();break;
    case 'downloadFile':downloadFile();break;
    case 'dup':{const c=clone(m);c.id=uid();c.created=Date.now();c.status='bozza';
      // la copia è la base per un nuovo evento: tengo portate, prezzi e template, azzero i dati del cliente
      Object.assign(c,{date:'',time:'',client:'',phone:'',guests:'',guestsKids:'',room:''});
      state.menus.push(c);save();ui.editId=c.id;render();window.scrollTo(0,0);toast('Copia creata: inserisci data e cliente');break}
    case 'del':ask({title:'Eliminare questo menù?',text:menuName(m),ok:'Elimina',danger:true}).then(ok=>{if(!ok)return;
      const pos=state.menus.indexOf(m);state.menus=state.menus.filter(x=>x!==m);save();ui.view=ui.back||'cal';render();
      toast('Menù eliminato',{label:'Annulla',fn:()=>{state.menus.splice(Math.min(pos,state.menus.length),0,m);save();render(true)}})});break;
    case 'listTab':ui.listTab=d.v;render(true);break;
    case 'editDish':{const x=d.id&&state.dishes.find(z=>z.id===d.id),al=[...(x&&x.alg||[])];ui.sheet={type:'dish',id:d.id||null,alg:al,none:!!x&&x.algSet===true&&!al.length};renderSheet();break}
    case 'algT':{const sh=ui.sheet,n=+d.n,A=sh.alg,i=A.indexOf(n);i<0?A.push(n):A.splice(i,1);A.sort((a,b)=>a-b);b.classList.toggle('on',i<0);
      sh.touched=true;if(A.length){sh.none=false;$('.algs [data-a=algNone]')?.classList.remove('on')}break}
    case 'algNone':{const sh=ui.sheet;sh.none=!sh.none;sh.touched=true;if(sh.none){sh.alg.length=0;document.querySelectorAll('.algs button.on').forEach(x=>x.classList.remove('on'))}b.classList.toggle('on',sh.none);break}
    case 'saveDish':{
      const name=$('#dname').value.trim(),cat=$('#dcat').value;if(!name){toast('Scrivi il nome della portata');break}
      const alg=[...(ui.sheet.alg||[])];
      const en=($('#den')?.value||'').trim();
      const algSet=alg.length>0||!!ui.sheet.none;
      if(ui.sheet.id){const x=state.dishes.find(z=>z.id===ui.sheet.id);x.name=name;x.cat=cat;x.alg=alg;x.algSet=algSet;x.en=en}else state.dishes.push({id:uid(),name,cat,alg,algSet,en});
      save();ui.sheet=null;renderSheet();render(true);toast('Portata salvata');break}
    case 'delDish':{const id=ui.sheet.id;ask({title:'Eliminare la portata?',text:"Viene tolta dall'archivio. I menù già composti restano come sono, allergeni compresi.",ok:'Elimina',danger:true}).then(ok=>{if(!ok)return;
      delDish(id);save();ui.sheet=null;renderSheet();render(true);toast('Portata eliminata')});break}
    case 'closeSheet':ui.sheet=null;renderSheet();break;
    case 'stampaTab':ui.stampa=d.v;render();break;
    case 'spStyle':sp().style=d.v;render(true);break;
    case 'spMode':sp().mode=d.v;render(true);break;
    case 'spPDF':(async()=>{busy(true,'Preparo il foglio');try{const f=await spPDF();ui.sheet={type:'file',blob:f.blob,name:f.name,mime:f.mime,title:'Segnaposto pronti'}}
      catch(err){toast('Foglio non creato')}finally{busy(false);renderSheet()}})();break;
    case 'waMenu':prezzoOk().then(ok=>{if(ok)waMenu()});break;
    case 'waFmt':if(ui.sheet.fmt!==d.v){state.settings.waFmt=d.v;save();waMenu(d.v)}break;
    case 'waStep1':waText(ui.sheet);break;
    case 'waFiles':{const sh=ui.sheet;sendFiles(sh.files,'',sh.phone,true);ui.sheet=null;renderSheet();markSent(sh);if(ui.view==='edit')render(true);break}
    case 'waSend':case 'waOther':{const sh=ui.sheet;sh.text=$('#watext').value;sh.phone=$('#waphone').value;
      // nell'app: WhatsApp scarta spesso il testo che accompagna i file, quindi prima apro la chat col messaggio scritto, poi si allegano i file
      let due=false; // in due passaggi la proposta risulta inviata solo quando alleghi il file
      if(a==='waSend'&&AND&&sh.text.trim()){waText(sh);sh.step=2;due=true;renderSheet()}else sendFiles(sh.files,sh.text,sh.phone,a==='waSend');
      if(sh.menuId){const mm=getMenu(sh.menuId);if(mm&&!mm.phone&&sh.phone){mm.phone=sh.phone;save()}}
      if(!due)markSent(sh);
      break}
    case 'ostType':{const o=ost(),p=OSTIA_TYPES[d.v];o.type=d.v;o.top=p.top;o.main=p.main;render(true);break}
    case 'ostShape':ost().shape=d.v;render(true);break;
    case 'ostWA':(async()=>{busy(true,'Preparo il file');try{const f=await ostiaFile('png'),o=ost();
      ui.sheet={type:'wa',title:"Invia l'ostia",files:[f],phone:'',text:`Buongiorno,\nvi invio il file per l'ostia ${OSTIA_SHAPES[o.shape].l.toLowerCase()}${o.name?` (${o.name})`:''}.\nGrazie mille,\n${state.settings.venue||'Tenuta Coppa'}`}}
      catch(err){toast('File non creato')}finally{busy(false);renderSheet()}})();break;
    case 'ostFile':(async()=>{busy(true,'Preparo il file');try{const f=await ostiaFile(d.v);ui.sheet={type:'file',blob:f.blob,name:f.name,mime:f.mime,title:'Ostia pronta'}}
      catch(err){toast('File non creato')}finally{busy(false);renderSheet()}})();break;
    case 'didWA':(async()=>{busy(true,'Preparo i file');try{const fs=await Promise.all(DID_FILES.map(x=>didBlob(x.k)));
      ui.sheet={type:'wa',title:'Invia i file della fattoria',files:fs,phone:ui.didPhone||'',text:state.settings.didMsg||DID_MSG}}
      catch(err){toast('File non disponibili')}finally{busy(false);renderSheet()}})();break;
    case 'didShare':(async()=>{try{await sendFiles([await didBlob(d.k)],'','',false)}catch(err){toast('File non disponibile')}})();break;
    case 'didReplace':ui.didSlot=d.k;$('#didfile').click();break;
    case 'didReset':delete state.didattica[d.k];save();render(true);toast('Ripristinato il file originale');break;
    case 'editTpl':ui.tplId=d.id;ui.view='tpl';render();break;
    case 'dupTpl':{const t=clone(getTpl(ui.tplId));t.id='tpl-'+uid();t.name=t.name+' (copia)';t.builtIn=false;state.templates.push(t);save();ui.tplId=t.id;render();toast('Template duplicato: cambia nome e titolo');break}
    case 'delTpl':{const t=getTpl(ui.tplId),used=state.menus.filter(x=>x.templateId===t.id).length;
      ask({title:'Eliminare il template?',text:`${t.name}${used?`\n\n${used} menù useranno il primo template della lista.`:''}`,ok:'Elimina',danger:true}).then(ok=>{if(ok){state.templates=state.templates.filter(x=>x!==t);save();ui.view='settings';render()}});break}
    case 'tplBg':ui.bgSlot=d.slot||'bgImage';$('#bgfile').click();break;
    case 'tplBgReset':{const t=getTpl(ui.tplId);if(d.slot==='coverImage')t.coverImage=t.origCover;else t.bgImage=t.origBg;save();render(true);break}
    case 'catMove':{const L=state.categories,i=+d.i,j=i+Number(d.d);if(j<0||j>=L.length)break;[L[i],L[j]]=[L[j],L[i]];save();render(true);break}
    case 'catEn':{const c=state.categories[+d.i];ask({title:'Nome in inglese',text:c,input:catEn(c),ok:'Salva'}).then(v=>{if(v===null)return;state.settings.catEn={...(state.settings.catEn||{}),[c]:v.trim()};save();render(true)});break}
    case 'catRen':{const idx=+d.i,old=state.categories[idx];ask({title:'Rinomina la sezione',input:old,ok:'Salva'}).then(v=>{
      if(!v||!v.trim()||v.trim()===old)return;
      if(allCats().includes(v.trim())){toast('Esiste già una sezione con questo nome');return}
      const nv=v.trim();state.categories[idx]=nv;state.dishes.forEach(x=>{if(x.cat===old)x.cat=nv});
      state.menus.forEach(mm=>mm.sections.forEach(ss=>{if(ss.name===old)ss.name=nv})); // anche nei menù già creati
      if(state.settings.catEn&&state.settings.catEn[old]){state.settings.catEn[nv]=state.settings.catEn[old];delete state.settings.catEn[old]}
      save();render(true)});break}
    case 'catDel':{const c=state.categories[+d.i],n=state.dishes.filter(x=>x.cat===c).length;
      if(n){ask({title:'Sezione non vuota',text:`Nella sezione "${c}" ci sono ${n} portate. Spostale in un'altra sezione o eliminale prima.`,alert:true});break}
      if(state.categories.length<2)break;
      {const idx=+d.i;ask({title:'Eliminare la sezione?',text:`${c}\n\nI menù già composti la mantengono.`,ok:'Elimina',danger:true}).then(ok=>{if(ok&&state.categories[idx]===c){state.categories.splice(idx,1);save();render(true)}})}break}
    case 'catAdd':{const v=$('#newcat').value.trim();if(!v)break;if(allCats().includes(v)){toast('Sezione già presente');break}state.categories.push(v);save();render(true);break}
    case 'drAdd':{const v=$('#newdrink').value.trim();if(!v)break;state.settings.drinkPresets.push(v);save();render(true);break}
    case 'drDel':{const L=state.settings.drinkPresets,i=+d.i,[tolta]=L.splice(i,1);save();render(true);toast('Bevanda tolta',{label:'Annulla',fn:()=>{L.splice(Math.min(i,L.length),0,tolta);save();if(ui.view==='settings')render(true)}});break}
    case 'export':{const blob=new Blob([JSON.stringify(state)],{type:'application/json'});ui.sheet={type:'file',blob,name:`backup-menu_${fmtDash(today())}.json`,mime:'application/json',title:'Backup pronto',backup:true};renderSheet();break}
    case 'import':$('#importfile').click();break;
    case 'undoImport':undoImport();break;
    case 'exportOld':exportOld();break;
    case 'saveAs':saveAsNative();break;
    case 'bkYes':markBackup();ui.sheet=null;renderSheet();render(true);toast('Backup segnato come fatto');break;
    case 'bkNo':ui.sheet.step=null;renderSheet();break;
  }
});
document.addEventListener('input',e=>{
  const el=e.target,d=el.dataset;
  if(d.f){
    const m=getMenu(ui.editId);if(!m)return;let v=el.value;
    if(d.f==='guests'||d.f==='guestsKids')v=v===''?'':Math.max(0,parseInt(v,10)||0);
    if(d.f==='priceAdult'||d.f==='priceKid')v=v.trim()===''?'':num(v);
    m[d.f]=v;save();
    if(/price|guests/.test(d.f)){const t=$('#tot');if(t)t.textContent=totText(m)}
    if(d.f==='heading'){const h=$('.top h1');if(h)h.textContent=heading(m)}
    if(d.pv){clearTimeout(ui.pvT);ui.pvT=setTimeout(mountPreviews,350)} // aggiorno l'anteprima mentre scrivi il prezzo
  }else if(d.sf){state.settings[d.sf]=el.value;save()}
  else if(d.tf){const t=getTpl(ui.tplId);let v=el.value;if(d.tf==='priceAdult'||d.tf==='priceKid')v=v.trim()===''?'':num(v);t[d.tf]=v;save();mountPreviews();if(d.tf==='name'){const h=$('.top h1');if(h)h.textContent=el.value}}
  else if(d.tl){const t=getTpl(ui.tplId);t.limit=Number(el.value);$('#tl').textContent=Math.round(t.limit/14.4)+'%';save();mountPreviews()}
  else if(d.in==='q'){ui.q=el.value;$('#mlist').innerHTML=listHTML()}
  else if(d.in==='didPhone'){ui.didPhone=el.value}
  else if(d.of){ost()[d.of]=el.value;paintOstia()}
  else if(d.sp){sp()[d.sp]=el.value;clearTimeout(ui.spT);ui.spT=setTimeout(paintSp,250)}
  else if(d.en){const[k,si,ii]=d.en.split(':').map(Number),m=getMenu(ui.editId);if(m){const it=secList(m,!!k)[si].items[ii];it.en=el.value.trim();save()}}
  else if(d.in==='dq'){ui.dq=el.value;$('#dlist').innerHTML=dishListHTML()}
  else if(d.in==='pickQ'){ui.pickQ=el.value;$('#pklist').innerHTML=pickListHTML()}
});
document.addEventListener('change',async e=>{
  const el=e.target,d=el.dataset;
  if(d.fc){const m=getMenu(ui.editId);if(m){m[d.fc]=el.checked;save();if(d.re)render(true)}}
  else if(d.pk==='all'){ui.pickAll=el.checked;$('#pklist').innerHTML=pickListHTML()}
  else if(d.oc){ost()[d.oc]=el.checked;paintOstia()}
  else if(d.spc){sp()[d.spc]=el.checked;paintSp()}
  else if(d.en){ // a fine modifica la traduzione va anche nell'archivio, se la portata non ne aveva una
    const[k,si,ii]=d.en.split(':').map(Number),m=getMenu(ui.editId),it=m&&secList(m,!!k)[si].items[ii],dd=it&&dishOf(it);
    if(dd&&!dd.en&&it.en&&oneLine(dd.name)===oneLine(it.name)){dd.en=it.en;save()}
  }
  else if(el.id==='didfile'&&el.files[0]){
    const file=el.files[0],slot=ui.didSlot;
    const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(file)});
    state.didattica=state.didattica||{};state.didattica[slot]={name:file.name,mime:file.type||'application/octet-stream',data};
    save();render(true);toast('File aggiornato');el.value='';
  }
  else if(el.id==='bgfile'&&el.files[0]){await setBg(el.files[0]);el.value=''}
  else if(el.id==='importfile'&&el.files[0]){await applyBackup(await el.files[0].text());el.value=''}
});
async function setBg(src){
  try{
    const r=await readImage(src),t=getTpl(ui.tplId),L=LAYOUTS[t.layout]||LAYOUTS.verticale;
    t[ui.bgSlot==='coverImage'?'coverImage':'bgImage']=r.url;ui.bgSlot=null;save();render(true);
    if(Math.abs(r.w/r.h-L.w/L.h)>0.03)toast("L'immagine ha proporzioni diverse dal template: verrà deformata. Esportala da Canva nello stesso formato.");
  }catch(err){toast(err.message)}
}
async function applyBackup(text){
  let obj;
  try{
    obj=JSON.parse(text);
    if(!obj||!Array.isArray(obj.menus)||!Array.isArray(obj.dishes))throw new Error('Il file non è un backup di questa app.');
    if(obj.v!==2&&obj.v!==3)throw new Error("Questo backup viene da una versione diversa dell'app: aggiorna l'app e riprova.");
  }catch(err){toast(err instanceof SyntaxError?'Il file non è un backup di questa app.':(err.message||'File non valido'));return}
  if(!await ask({title:'Importare il backup?',text:`Contiene ${obj.menus.length} menù e ${obj.dishes.length} portate e sostituisce i dati attuali.\n\nQuelli di adesso vengono messi da parte: puoi riprenderli da Altro → Backup.`,ok:'Importa'}))return;
  await swapState(obj,'Backup importato');
}
// sostituisce i dati tenendo da parte quelli attuali (un solo livello di "annulla")
async function swapState(obj,msg){
  try{await idb.set('prima-importazione',{quando:Date.now(),dati:JSON.stringify(state)})}
  catch(e){toast('Memoria insufficiente per mettere da parte i dati attuali: non ho cambiato nulla.');return}
  ui.preImport=true;state=normalize(obj);ui.sheet=null;ui.editId=null;ui.view='settings';
  const ok=await flush();render();renderSheet();if(ok)toast(msg);
}
async function undoImport(){
  try{
    const p=await idb.get('prima-importazione');if(!p||!p.dati){ui.preImport=false;render(true);return}
    const obj=JSON.parse(p.dati);
    if(!await ask({title:'Riprendere i dati di prima?',text:`Sono quelli del ${new Date(p.quando).toLocaleDateString('it-IT',{day:'numeric',month:'long'})}, prima dell'importazione (${obj.menus.length} menù, ${obj.dishes.length} portate).\n\nQuelli di adesso vengono messi da parte al loro posto.`,ok:'Riprendi'}))return;
    await swapState(obj,'Dati di prima ripristinati');
  }catch(e){toast('Ripristino non riuscito')}
}
async function exportOld(){
  try{const k=ui.scartati[ui.scartati.length-1],v=await idb.get(k);
    ui.sheet={type:'file',blob:new Blob([JSON.stringify(v)],{type:'application/json'}),name:`dati-messi-da-parte_${fmtDash(today())}.json`,mime:'application/json',title:'Dati messi da parte',backup:true,old:true};renderSheet();
  }catch(e){toast('File non creato')}
}

document.addEventListener('keydown',e=>{
  if(e.key!=='Enter')return;
  if(e.target.id==='dlgin'){e.preventDefault();closeDlg(true);return}
  const map={pknew:'pickNew',newcat:'catAdd',newdrink:'drAdd',secnew:'addSecNew'};
  if(map[e.target.id]){e.preventDefault();$(`[data-a="${map[e.target.id]}"]`).click()}
});
function readImage(src){ // accetta un File oppure un data URI (dall'app Android)
  return new Promise((res,rej)=>{
    const done=url=>{const img=new Image();img.onload=()=>{
      const k=Math.min(1,2600/Math.max(img.width,img.height)),w=Math.round(img.width*k),h=Math.round(img.height*k);
      const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(img,0,0,w,h);
      res({url:c.toDataURL('image/jpeg',0.88),w,h})};
      img.onerror=()=>rej(new Error('Immagine non leggibile. Usa un PNG o JPG.'));img.src=url};
    if(typeof src==='string')return done(src);
    const r=new FileReader();r.onload=()=>done(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(src);
  });
}
let rzT;window.addEventListener('resize',()=>{clearTimeout(rzT);rzT=setTimeout(mountPreviews,150)});

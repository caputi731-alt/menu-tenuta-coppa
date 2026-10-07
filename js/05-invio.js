'use strict';
// Invio su WhatsApp e tasto indietro.
// I file in js/ sono script normali caricati in ordine da index.html: variabili e funzioni sono condivise fra tutti.
/* ---------- Invio su WhatsApp ---------- */
const waPhone=p=>{let d=String(p||'').replace(/\D/g,'');if(d.startsWith('00'))d=d.slice(2);if(d.length===10&&d[0]==='3')d='39'+d;return d};
function waText(sh){
  const tel=waPhone(sh.phone);
  location.href=`https://api.whatsapp.com/send?${tel?`phone=${tel}&`:''}text=${encodeURIComponent(sh.text)}`;
}
async function sendFiles(files,text,phone,wa){
  const tel=waPhone(phone);
  if(text&&!AND){try{await navigator.clipboard.writeText(text)}catch(e){}}
  if(AND&&AND.shareFiles){
    const arr=await Promise.all(files.map(async f=>({name:f.name,mime:f.mime,data:await b64(f.blob)})));
    AND.shareFiles(JSON.stringify({files:arr,text,whatsapp:!!wa,phone:tel}));return;
  }
  if(AND&&files.length===1){AND.saveFile(await b64(files[0].blob),files[0].name,files[0].mime,true);return} // APK precedenti
  const F=files.map(f=>new File([f.blob],f.name,{type:f.mime}));
  try{if(navigator.canShare&&navigator.canShare({files:F})){await navigator.share({files:F,text});return}}
  catch(e){if(e.name==='AbortError')return}
  // browser senza condivisione di file: scarico i file e apro la chat con il testo
  files.forEach(f=>{const u=URL.createObjectURL(f.blob),a=document.createElement('a');a.href=u;a.download=f.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000)});
  if(wa)window.open(`https://wa.me/${tel}?text=${encodeURIComponent(text)}`,'_blank');
}
function menuMsg(m,mode){
  const v=state.settings.venue||'Tenuta Coppa',quando=m.date?` per ${fmtLong(m.date).replace(/^./,c=>c.toLowerCase())}`:'';
  const g=[m.guests?m.guests+' adulti':'',m.guestsKids?m.guestsKids+' bambini':''].filter(Boolean).join(' e ');
  const ciao=`Buongiorno${m.client?' '+m.client:''},`;
  if(mode==='tavolo')return`${ciao}\nle invio il menù${quando}.\nUn cordiale saluto,\n${v}`;
  const pa=num(val(m,'priceAdult')),pk=num(val(m,'priceKid'));
  let r=`${ciao}\ncome d'accordo le invio la proposta di menù${quando}${g?` (${g})`:''}.`;
  if(pa!=='')r+=`\nIl costo è di ${eurC(pa)} a persona${pk!==''&&Number(m.guestsKids)>0?` e ${eurC(pk)} per i bambini`:''}.`;
  return r+`\nResto a disposizione per qualsiasi modifica.\nUn cordiale saluto,\n${v}`;
}
// WhatsApp mostra sempre la didascalia sotto le immagini; con i PDF spesso la scarta
async function waFile(m,mode,fmt){
  const base=`${mode==='tavolo'?'Menu':'Proposta-menu'}_${slug(heading(m)+' '+(m.client||''))}_${fmtDash(m.date)||'senza-data'}${ui.pv.lang==='en'?'_EN':''}`;
  return fmt==='pdf'?{blob:await makePDF(m,mode),name:base+'.pdf',mime:'application/pdf'}:{blob:await makeImage(m,mode),name:base+'.jpg',mime:'image/jpeg'};
}
// la proposta deve sempre riportare il prezzo
// chiamata dal tasto indietro di Android: true = gestito dall'app, false = si può chiudere
window.appBack=()=>{
  if($('.busy'))return true;
  if(dlgRes){closeDlg(false);return true}
  if(ui.sheet){ui.sheet=null;renderSheet();return true}
  if(['edit','preview','tpl','dishes'].includes(ui.view)){$('[data-a=back]')?.click();return true}
  if(ui.view==='ostie'&&ui.stampa==='sp'){ui.stampa='ostie';render();return true}
  if(ui.view!=='cal'){ui.view='cal';render();return true}
  return false;
};
function markSent(sh){
  const mm=sh&&sh.menuId&&getMenu(sh.menuId);if(!mm||sh.mode!=='proposta'||mm.status!=='bozza')return;
  mm.status='inviata';save();
  toast('Proposta segnata come inviata',{label:'Annulla',fn:()=>{mm.status='bozza';save();render(true)}});
}
async function prezzoOk(){
  const m=getMenu(ui.editId);
  if(!m||ui.pv.mode!=='proposta')return true;
  if(num(val(m,'priceAdult'))!==''){
    if(!priceInherited(m))return true;
    const pk=num(val(m,'priceKid'));
    if(!await ask({title:'Prezzo da confermare',text:`La proposta userà il prezzo predefinito del template: ${eurC(num(val(m,'priceAdult')))} a persona${pk!==''?` e ${eurC(pk)} per i bambini`:''}.\n\nÈ quello concordato con il cliente?`,ok:'Sì, è giusto',cancel:'Lo cambio'}))return false;
    m.priceAdult=num(val(m,'priceAdult'));if(m.priceKid===undefined||m.priceKid===null)m.priceKid=pk;save();render(true); // confermato: diventa il prezzo del menù
    return true;
  }
  toast('Inserisci il prezzo adulti: la proposta deve sempre riportarlo');
  const f=$('[data-f=priceAdult]');if(f){f.focus();f.scrollIntoView({block:'center'})}
  return false;
}
async function waMenu(fmt){
  const m=getMenu(ui.editId);if(!m)return;const mode=ui.pv.mode;fmt=fmt||state.settings.waFmt||'img';
  const old=ui.sheet&&ui.sheet.type==='wa'?ui.sheet:null; // se si cambia formato, tengo testo e numero già scritti
  busy(true,fmt==='pdf'?'Preparo il PDF':"Preparo l'immagine");
  try{
    const f=await waFile(m,mode,fmt);
    ui.sheet={type:'wa',title:mode==='tavolo'?'Invia il menù':'Invia la proposta',files:[f],fmt,
      text:old?$('#watext').value:(ui.pv.lang==='en'?menuMsgEn(m,mode):menuMsg(m,mode)),phone:old?$('#waphone').value:(m.phone||''),menuId:m.id,mode};
  }catch(e){toast('File non creato: '+(e.message||e))}
  finally{busy(false);renderSheet()}
}

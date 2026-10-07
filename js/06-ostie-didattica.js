'use strict';
// Ostie e fattoria didattica.
// I file in js/ sono script normali caricati in ordine da index.html: variabili e funzioni sono condivise fra tutti.
/* ---------- Ostie ---------- */
function newOstia(type){const p=OSTIA_TYPES[type||'compleanno'];return{type:type||'compleanno',shape:'tonda',top:p.top,main:p.main,name:'',extra:'',cut:true}}
const ost=()=>ui.ost||(ui.ost=state.lastOstia?{...state.lastOstia}:newOstia());
function drawOstia(cv,o,W){
  const S=OSTIA_SHAPES[o.shape]||OSTIA_SHAPES.tonda,H=Math.round(W*S.h/S.w),px=W/S.w;
  cv.width=W;cv.height=H;const x=cv.getContext('2d');
  x.fillStyle='#fff';x.fillRect(0,0,W,H);
  if(o.cut){ // linea di taglio tratteggiata, come nei file per la pasticceria
    x.save();x.strokeStyle='#C7C7C7';x.lineWidth=Math.max(1,.3*px);x.setLineDash([2.2*px,1.6*px]);x.beginPath();
    if(o.shape==='tonda')x.arc(W/2,H/2,100*px,0,Math.PI*2);
    else{const m=5*px,r=4*px,w=W-2*m,h=H-2*m;x.moveTo(m+r,m);x.arcTo(m+w,m,m+w,m+h,r);x.arcTo(m+w,m+h,m,m+h,r);x.arcTo(m,m+h,m,m,r);x.arcTo(m,m,m+w,m,r);x.closePath()}
    x.stroke();x.restore();
  }
  const L=[[o.top,.6],[o.main,1],[o.name,1],[o.extra,.45]].map(([t,k])=>[String(t||'').trim(),k]).filter(l=>l[0]);
  if(!L.length)return;
  const tonda=o.shape==='tonda',bw=(tonda?138:235)*px,bh=(tonda?112:140)*px,cap=(tonda?34:40)*px,LH=1.02;
  x.font='100px "Great Vibes"';const wu=L.map(([t])=>x.measureText(t).width/100);
  const k=Math.min(cap,bh/L.reduce((a,[,s])=>a+s*LH,0),...L.map(([,s],i)=>bw/(s*wu[i])));
  let y=H/2-L.reduce((a,[,s])=>a+k*s*LH,0)/2;
  x.fillStyle=GOLD;x.textAlign='center';x.textBaseline='alphabetic';
  L.forEach(([t,s])=>{const fs=k*s;x.font=`${fs}px "Great Vibes"`;x.fillText(t,W/2,y+fs*LH*.8);y+=fs*LH});
}
async function paintOstia(){
  const cv=$('#ostcv');if(!cv)return;
  await document.fonts.load('40px "Great Vibes"').catch(()=>{});
  drawOstia(cv,ost(),ost().shape==='tonda'?900:1200);
}
const ostName=(o,ext)=>`Ostia-${o.type}${o.name?'-'+slug(o.name):''}.${ext}`;
async function ostiaFile(fmt){
  const o=ost(),S=OSTIA_SHAPES[o.shape];
  await document.fonts.load('40px "Great Vibes"').catch(()=>{});
  const cv=document.createElement('canvas');drawOstia(cv,o,Math.round(S.w/25.4*300)); // 300 dpi, misura reale
  state.lastOstia={...o};save();
  if(fmt==='png'){const blob=await new Promise(r=>cv.toBlob(r,'image/png'));return{blob,name:ostName(o,'png'),mime:'image/png'}}
  const pdf=new window.jspdf.jsPDF({orientation:S.w>S.h?'l':'p',unit:'mm',format:[S.w,S.h]});
  pdf.addImage(cv.toDataURL('image/png'),'PNG',0,0,S.w,S.h);
  return{blob:pdf.output('blob'),name:ostName(o,'pdf'),mime:'application/pdf'};
}
function vOstie(){
  const o=ost(),f=(label,k,ph)=>`<label class="fld"><span>${label}</span><input class="inp" data-of="${k}" value="${esc(o[k])}" placeholder="${esc(ph)}" autocomplete="off"></label>`;
  const tab=`<div class="seg"><button class="${ui.stampa!=='sp'?'on':''}" data-a="stampaTab" data-v="ostie">Ostie</button><button class="${ui.stampa==='sp'?'on':''}" data-a="stampaTab" data-v="sp">Segnaposto</button></div>`;
  if(ui.stampa==='sp')return topbar(`<h1>Stampe</h1>`)+`<main class="main">${tab}${vSegnaposto()}</main>`+navbar();
  return topbar(`<h1>Stampe</h1>`)+`<main class="main">${tab}
  <section class="grp"><h2>Occasione</h2><div class="stat">${Object.entries(OSTIA_TYPES).map(([k,t])=>`<button class="${o.type===k?'on':''}" style="--c:${GOLD}" data-a="ostType" data-v="${k}"><i></i>${t.l}</button>`).join('')}</div></section>
  <section class="grp"><h2>Forma</h2><div class="seg">${Object.entries(OSTIA_SHAPES).map(([k,t])=>`<button class="${o.shape===k?'on':''}" data-a="ostShape" data-v="${k}">${t.l}</button>`).join('')}</div>
  <canvas id="ostcv" class="ost-cv" aria-label="Anteprima dell'ostia"></canvas></section>
  <section class="grp"><h2>Testo</h2>
    <div class="row2">${f('Riga piccola in alto','top','es. Buon')}${f('Riga principale','main','es. Compleanno')}</div>
    ${f(o.type==='anniversario'?'Nomi':'Nome','name',o.type==='anniversario'?'es. Maria e Giuseppe':'es. Rosalba')}
    ${f('Riga piccola in basso (facoltativa)','extra',o.type==='compleanno'?'es. 50 anni':o.type==='anniversario'?'es. 25 anni insieme':'es. 10 maggio 2026')}
    <label class="tog"><input type="checkbox" data-oc="cut" ${o.cut?'checked':''}>Mostra la linea di taglio tratteggiata</label>
  </section>
  <div class="btns"><button class="btn wa wide" data-a="ostWA">${I.wa}Invia su WhatsApp</button>
  <div class="btns two"><button class="btn" data-a="ostFile" data-v="png">${I.img}Immagine PNG</button><button class="btn" data-a="ostFile" data-v="pdf">${I.pdf}PDF</button></div></div>
  <p class="hint" style="margin-top:10px">Il file è a 300 dpi nella misura reale, su fondo bianco: è il formato che chiedono le pasticcerie per la stampa alimentare.</p>
  </main>`+navbar();
}

/* ---------- Fattoria didattica ---------- */
const didInfo=k=>{const d=DID_FILES.find(f=>f.k===k),o=(state.didattica||{})[k];return o?{...d,name:o.name,mime:o.mime,custom:o.data}:d};
async function didBlob(k){
  const f=didInfo(k);
  const r=await fetch(f.custom||f.file);if(!r.ok)throw new Error('file non trovato');
  return{blob:await r.blob(),name:f.name,mime:f.mime};
}
function vDidattica(){
  return topbar(`<h1>Fattoria didattica</h1>`)+`<main class="main">
  <section class="grp"><h2>Invio rapido alle scuole</h2><div class="card">
    <label class="fld"><span>Numero WhatsApp (facoltativo)</span><input class="inp" type="tel" data-in="didPhone" value="${esc(ui.didPhone)}" placeholder="Se lo lasci vuoto scegli tu la chat"></label>
    <label class="fld"><span>Messaggio</span><textarea class="inp" data-sf="didMsg" rows="7" style="min-height:170px">${esc(state.settings.didMsg||DID_MSG)}</textarea></label>
    <button class="btn wa wide" data-a="didWA">${I.wa}Invia presentazione e scheda su WhatsApp</button>
    <p class="hint">Partono entrambi i file con il messaggio. Il testo modificato resta salvato per le prossime volte.</p>
  </div></section>
  <section class="grp"><h2>I file</h2>
  ${DID_FILES.map(d=>{const f=didInfo(d.k);return`<div class="fcard">
    ${f.custom?'':`<div class="thumbs">${d.thumbs.map(t=>`<img src="${t}" alt="Anteprima ${esc(d.l)}">`).join('')}</div>`}
    <h3>${esc(d.l)}</h3><small>${esc(f.custom?f.name:d.sub)}</small>
    <div class="btns two" style="margin-top:10px"><button class="btn" data-a="didShare" data-k="${d.k}">${I.share}Condividi</button><button class="btn" data-a="didReplace" data-k="${d.k}">${I.copy}Sostituisci</button></div>
    ${f.custom?`<button class="btn wide" style="margin-top:8px" data-a="didReset" data-k="${d.k}">Torna al file originale</button>`:''}
  </div>`}).join('')}
  <p class="hint">Per il prossimo anno scolastico usa “Sostituisci” e carica i file aggiornati.</p></section>
  </main>`+navbar();
}

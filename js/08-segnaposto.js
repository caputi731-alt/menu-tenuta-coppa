'use strict';
// Segnaposto da piegare.
// I file in js/ sono script normali caricati in ordine da index.html: variabili e funzioni sono condivise fra tutti.
/* ---------- Segnaposto da piegare ---------- */
// foglio A4 con 6 cartoncini 105 × 99 mm: si ritagliano e si piegano a metà (a tenda)
const SP_STYLES={
  oro:{l:'Oro',c:'#A8956A'},azzurro:{l:'Azzurro',c:'#6F95B8'},salvia:{l:'Salvia',c:'#7F9270'},
  ulivo:{l:"Ulivo",c:'#6E7B58',img:'assets/segnaposto/ulivo.png'},spighe:{l:'Spighe',c:'#A88A5C',img:'assets/segnaposto/spighe.png'},
  orsetto:{l:'Orsetto',c:'#C29A94',img:'assets/segnaposto/orsetto.png'},ghirlanda:{l:'Ghirlanda',c:'#AE9D8E',img:'assets/segnaposto/ghirlanda.png'},
  cornice:{l:'Cornice oro',c:'#A8956A',frame:true}
};
// 8 segnaposto per A4: 2 colonne × 4 righe, cartoncino 105 × 74,25 mm, piegato 105 × 37,1 mm
const SP={w:105,h:297/4,f:297/8};
// posizioni (mm dal bordo superiore della facciata) di illustrazione e riga per ogni stile
const SP_IMG={ulivo:{y:5,h:7},spighe:{y:3,h:11},orsetto:{y:2.5,h:13},ghirlanda:{y:4.5,h:8}};
const sp=()=>ui.sp||(ui.sp=state.lastSp?{...state.lastSp}:{style:'oro',mode:'nome',text:'',both:true});
const spImgs={};
const spImg=src=>spImgs[src]||(spImgs[src]=new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src}));
async function drawSp(cv,o,W){
  const H=Math.round(W*297/210),px=W/210;cv.width=W;cv.height=H;
  const x=cv.getContext('2d'),S=SP_STYLES[o.style]||SP_STYLES.oro,img=S.img?await spImg(S.img):null;
  await document.fonts.load('40px "Great Vibes"').catch(()=>{});await document.fonts.load('italic 500 20px "Cormorant Garamond"').catch(()=>{});
  x.fillStyle='#fff';x.fillRect(0,0,W,H);
  // linee di taglio tra i cartoncini (tratteggio grigio chiaro)
  x.save();x.strokeStyle='#CFCFCF';x.lineWidth=Math.max(1,.2*px);x.setLineDash([1.6*px,1.6*px]);x.beginPath();
  x.moveTo(105*px,0);x.lineTo(105*px,H);[1,2,3].forEach(k=>{x.moveTo(0,k*SP.h*px);x.lineTo(W,k*SP.h*px)});x.stroke();x.restore();
  for(let r=0;r<4;r++)for(let c=0;c<2;c++){
    const ox=c*SP.w*px,oy=r*SP.h*px,fy=oy+SP.f*px;
    // linea di piega: solo due tacche ai lati, così non si vede sul cartoncino piegato
    x.save();x.strokeStyle='#BDBDBD';x.lineWidth=Math.max(1,.2*px);x.beginPath();
    x.moveTo(ox+2*px,fy);x.lineTo(ox+6*px,fy);x.moveTo(ox+99*px,fy);x.lineTo(ox+103*px,fy);x.stroke();x.restore();
    panel(x,ox,fy,px,o,S,img);                 // fronte: metà inferiore, dritta
    if(o.both){x.save();x.translate(ox+SP.w*px,fy);x.rotate(Math.PI);panel(x,0,0,px,o,S,img);x.restore()} // retro, capovolto
  }
}
function panel(x,ox,oy,px,o,S,img){
  const cx=ox+52.5*px;
  if(S.frame){ // doppia cornice con rombi agli angoli, a 4 mm dal taglio
    x.save();x.strokeStyle=S.c;x.fillStyle=S.c;
    const a=4,b=3.2,W2=SP.w-2*a,H2=SP.f-a-b;x.lineWidth=.45*px;x.strokeRect(ox+a*px,oy+b*px,W2*px,H2*px);
    x.lineWidth=.2*px;x.strokeRect(ox+(a+1.3)*px,oy+(b+1.3)*px,(W2-2.6)*px,(H2-2.6)*px);
    [[a,b],[a+W2,b],[a,b+H2],[a+W2,b+H2]].forEach(([u,v])=>{const X=ox+u*px,Y=oy+v*px,r=1.3*px;x.beginPath();x.moveTo(X,Y-r);x.lineTo(X+r,Y);x.lineTo(X,Y+r);x.lineTo(X-r,Y);x.closePath();x.fill()});
    x.restore();
  }else if(img){const g=SP_IMG[o.style]||{y:5,h:8},h=g.h*px,w=h*img.width/img.height;x.drawImage(img,cx-w/2,oy+g.y*px,w,h)}
  else{ // filetto sottile con rombo
    x.save();x.strokeStyle=S.c;x.fillStyle=S.c;x.lineWidth=.3*px;const y=oy+9*px;
    x.beginPath();x.moveTo(cx-20*px,y);x.lineTo(cx-3.2*px,y);x.moveTo(cx+3.2*px,y);x.lineTo(cx+20*px,y);x.stroke();
    x.beginPath();x.moveTo(cx,y-1.8*px);x.lineTo(cx+1.8*px,y);x.lineTo(cx,y+1.8*px);x.lineTo(cx-1.8*px,y);x.closePath();x.fill();x.restore();
  }
  x.save();x.strokeStyle=S.c;x.globalAlpha=.75;x.lineWidth=.25*px;x.textAlign='center';x.fillStyle=S.c;
  const ly=oy+(S.frame?22:o.style==='orsetto'?26:25)*px;
  if(o.mode==='tavolo'){
    x.globalAlpha=1;x.font=`${8.5*px}px "Great Vibes"`;x.textAlign='right';x.fillText('Tavolo',cx+2*px,ly-.5*px);
    x.globalAlpha=.75;x.beginPath();x.moveTo(cx+5*px,ly);x.lineTo(cx+26*px,ly);x.stroke();
  }else{x.beginPath();x.moveTo(cx-32*px,ly);x.lineTo(cx+32*px,ly);x.stroke()}
  const t=String(o.text||'').trim();
  if(t){x.globalAlpha=1;x.textAlign='center';x.font=`italic 500 ${3*px}px "Cormorant Garamond"`;x.fillStyle='#6B6B64';x.fillText(t,cx,oy+(S.frame?28.6:31.5)*px,S.frame?84*px:90*px)}
  x.restore();
}
async function paintSp(){const cv=$('#spcv');if(cv)await drawSp(cv,sp(),900)}
async function spPDF(){
  const o=sp(),cv=document.createElement('canvas');await drawSp(cv,o,2480); // 300 dpi
  state.lastSp={...o};save();
  const pdf=new window.jspdf.jsPDF({orientation:'p',unit:'mm',format:'a4'});
  pdf.addImage(cv.toDataURL('image/png'),'PNG',0,0,210,297);
  return{blob:pdf.output('blob'),name:`Segnaposto-${o.mode}-${o.style}.pdf`,mime:'application/pdf'};
}
function vSegnaposto(){
  const o=sp();
  return`<section class="grp"><h2>Stile</h2><div class="stat">${Object.entries(SP_STYLES).map(([k,s])=>`<button class="${o.style===k?'on':''}" style="--c:${s.c}" data-a="spStyle" data-v="${k}"><i></i>${s.l}</button>`).join('')}</div></section>
  <section class="grp"><h2>Da scrivere a mano</h2><div class="seg"><button class="${o.mode==='nome'?'on':''}" data-a="spMode" data-v="nome">Nome dell'ospite</button><button class="${o.mode==='tavolo'?'on':''}" data-a="spMode" data-v="tavolo">Numero del tavolo</button></div>
  <canvas id="spcv" class="ost-cv" aria-label="Anteprima del foglio dei segnaposto"></canvas></section>
  <section class="grp"><h2>Rifiniture</h2>
    <label class="fld"><span>Riga sotto (facoltativa)</span><input class="inp" data-sp="text" value="${esc(o.text)}" placeholder="es. Comunione di Giulia · 10 maggio 2026" autocomplete="off"></label>
    <label class="tog"><input type="checkbox" data-spc="both" ${o.both?'checked':''}>Stampa su entrambi i lati del cartoncino</label>
  </section>
  <button class="btn pri wide" data-a="spPDF">${I.pdf}Crea il foglio da stampare</button>
  <p class="hint" style="margin-top:10px">Un foglio A4 = 8 segnaposto. Stampa su cartoncino bianco (almeno 160 g) al 100%, ritaglia lungo il tratteggio e piega a metà seguendo le tacche ai lati.</p>`;
}

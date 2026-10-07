'use strict';
// Costanti, modelli predefiniti e funzioni di utilità.
// I file in js/ sono script normali caricati in ordine da index.html: variabili e funzioni sono condivise fra tutti.
/* ---------- Costanti ---------- */
const PT_MM=25.4/72;
const LAYOUTS={
  verticale:{w:810,h:1440,scale:2,print:3,label:'Verticale (come i menù della domenica)'},
  evento:{w:842,h:595,scale:3,print:4,label:'A4 orizzontale con menù bambini'},
  classico:{w:595,h:842,scale:3,print:4,label:'A4 verticale (come il menù di Pasqua)'},
  libretto:{w:595,h:421,scale:3,label:'Libretto A5: copertina + menù, 2 per foglio A4'}
};
const STATUS={bozza:{l:'Bozza',c:'#7E8277'},inviata:{l:'Inviata',c:'#B07A1E'},confermata:{l:'Confermata',c:'#3F7A34'},rifiutata:{l:'Rifiutata',c:'#9B3A48'}};
const DEF_CATS=['Antipasti','Primi Piatti','Secondo Piatto','Dessert'];
const KIDS_CAT='Menù bambini';
const KIDS_SECS=['Antipasto','Primo','Secondo','Dolce'];
const SEED={
  'Antipasti':[
    'Selezione di focacce artigianali con oli extravergine aromatizzati e\npolveri di erbe spontanee dell’Alta Murgia',
    'Veli di Capocollo di Martina Franca con salsa agli agrumi',
    "Carpaccio di manzo con pomodori sott'olio, julienne di sedano e olive taggiasche",
    'Arista di maiale con rucola dell’orto, petali di grana e pomodorini ciliegino',
    'Formaggi della Masseria con miele millefiori bio delle Murge e noci caramellate',
    'Tempura di melanzana ripiena di patate mantecate all’olio evo, speck e cuore\nfilante di mozzarella affumicata, servita su coulis di pomodoro',
    'Tempura di melanzana ripiena di patate mantecate,\nspeck e cuore filante di mozzarella affumicata',
    'Focacce della tradizione',
    'Capocollo di Martina Franca con tarallo sbriciolato',
    'Carpaccio di manzo con rucola e petali di grana',
    'Ricotta, nodini e pecorino con miele di trifoglio della Murgia',
    'Involtini di melanzana pastellata con crema di patate, speck e mozzarella'],
  'Primi Piatti':[
    'Fagottino di crespella su vellutata di fondo bruno',
    'Fagottino di crespella vegetariano su vellutata di bietole',
    'Orecchiette fresche ai funghi cardoncelli trifolati, pomodorini ciliegino e\ncrema di cece nero di Altamura',
    'Orecchiette fresche con salsicce a punta di coltello,\nolive nere al forno, crema di burrata e limone',
    'Paccheri di Gragnano alle tre carni',
    'Orecchiette con bacon, zucchine e fonduta di formaggio'],
  'Secondo Piatto':[
    'Coppa di maiale cotta a bassa temperatura\ncon mele Granny Smith, prugne e anacardi\naccompagnata da patate al forno aromatizzate',
    'Stinco di maiale con salsa alle mele e\ncontorno di patate al forno aromatizzate',
    'Grigliata di carni miste con\ncontorno di patate al forno aromatizzate',
    'Reale di scottona con salsa al vino rosso\ne contorno di patate al forno aromatizzate'],
  'Dessert':[
    'Mousse di ricotta, vaniglia e melecotogne con composta di frutta fresca',
    'Sporcamuss con crema diplomatica e\ncomposta di frutta fresca',
    'Crostata di ricotta e pere con composta di frutta fresca',
    'Dessert di frutta fresca'],
  [KIDS_CAT]:['Focaccia al pomodoro','Prosciutto cotto e mozzarella','Orecchiette con sugo di pomodoro','Cotoletta con patate al forno','Torta di cioccolato e mandorle\ncon composta di frutta fresca']
};
const DRINK_PRESETS=['Vini in bottiglia Cantina Crifo, acqua minerale','Liquori e caffè','Vino Nero di Troia Cantina Crifo, acqua minerale, liquori e caffè.','Acqua minerale'];
const SUNDAY={layout:'verticale',heading:'Menù di domenica',headingKids:'Menù bambini',drinks:'Vini in bottiglia Cantina Crifo, acqua minerale\nLiquori e caffè',drinksKids:'Acqua minerale',priceAdult:50,priceKid:25,kidLabel:'Bambini fino a 10 anni'};
const DID_MSG="Buongiorno,\nle invio la presentazione della fattoria didattica di Tenuta Coppa per l'anno scolastico 2026/2027 e la scheda di partecipazione.\nPer prenotare basta compilare la scheda e rispedirla qui su WhatsApp oppure a info@tenutacoppa.it.\nResto a disposizione per qualsiasi informazione.\nUn cordiale saluto,\nTenuta Coppa – 347 154 9100";
const DID_FILES=[
  {k:'brochure',l:'Presentazione fattoria didattica',sub:'PDF · laboratori, giornata e costi',file:'assets/didattica/brochure.pdf',name:'Masseria-Didattica-Tenuta-Coppa-2026-2027.pdf',mime:'application/pdf',thumbs:['assets/didattica/br-1.jpg','assets/didattica/br-2.jpg']},
  {k:'scheda',l:'Scheda di partecipazione',sub:'Word · da compilare e rispedire',file:'assets/didattica/scheda.docx',name:'Scheda-partecipazione-Tenuta-Coppa-2026-2027.docx',mime:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',thumbs:['assets/didattica/sc-1.jpg']}
];
const OSTIA_TYPES={
  compleanno:{l:'Compleanno',top:'Buon',main:'Compleanno'},
  battesimo:{l:'Battesimo',top:'Il mio',main:'Battesimo'},
  comunione:{l:'Comunione',top:'La mia',main:'Prima Comunione'},
  cresima:{l:'Cresima',top:'La mia',main:'Cresima'},
  anniversario:{l:'Anniversario',top:'Buon',main:'Anniversario'}
};
const OSTIA_SHAPES={tonda:{l:'Tonda Ø 20 cm',w:210,h:210},rett:{l:'Rettangolare A4',w:297,h:210}};
const GOLD='#A8956A';
const CLASSICO={layout:'classico',heading:'Pranzo di festa',subheading:'Menù',tagline:'Masseria storica del 1735',legend:true,bgColor:'#FFFFFF',ink:'#5C654C',accent:'#354469',drinks:'Vini Cantina Crifo e acqua minerale,\nLiquore e caffè',priceAdult:50,priceKid:25,limit:698};
const EVENTO={layout:'evento',heading:'Menù',bgColor:'#FFFFFF',ink:'#2B2B2B',drinks:'Vino Nero di Troia Cantina Crifo, acqua minerale, liquori e caffè.',priceAdult:50,priceKid:25,kidLabel:'Menù bambini'};
const LIBRETTO={layout:'libretto',heading:'Il mio battesimo',headingKids:'Menù bambini',drinksTitle:'Vini',bgColor:'#FFFFFF',ink:'#3A2B22',drinks:'Cantina Crifo, spumante, acqua minerale,\nbibite, rosolio e caffè',priceAdult:50,priceKid:25,kidLabel:'Bambini'};
const ALLERGENI=['Cereali con glutine','Crostacei','Uova','Pesce','Arachidi','Soia','Latte/Lattosio','Frutta a guscio','Sedano','Senape','Sesamo','Solfiti (>10mg/kg)','Lupini','Molluschi'];
function defaultTemplates(){
  const t=(id,name,o)=>({...SUNDAY,id,name,builtIn:true,...o,origBg:o.bgImage,origCover:o.coverImage});
  return[
    t('tpl-pecore','Domenica – Pecore e ulivo',{bgImage:'assets/domenica-pecore.jpg',bgColor:'#FFFFFF',ink:'#5A3E2B',limit:1240}),
    t('tpl-girasole','Domenica – Girasole',{bgImage:'assets/domenica-girasole.jpg',bgColor:'#FFFFFF',ink:'#4A3626',limit:1290}),
    t('tpl-muretto','Domenica – Muretto a secco',{bgImage:'assets/domenica-muretto.jpg',bgColor:'#FFFFFF',ink:'#2E1E12',limit:1225}),
    t('tpl-spighe','Domenica – Spighe di grano',{bgImage:'assets/domenica-spighe.jpg',bgColor:'#FFFFFF',ink:'#5A4630',limit:1165}),
    t('tpl-ulivo',"Domenica – Ramo d'ulivo",{bgImage:'assets/domenica-ulivo.jpg',bgColor:'#FFFFFF',ink:'#454C33',limit:1185}),
    t('tpl-pasqua','Classico – Rametto verde',{...CLASSICO,bgImage:'assets/classico-rametto.jpg'}),
    t('tpl-cl-spighe','Classico – Spighe di grano',{...CLASSICO,bgImage:'assets/classico-spighe.jpg',ink:'#5A4630',accent:'#8A6A35'}),
    t('tpl-cl-ulivo',"Classico – Ramo d'ulivo",{...CLASSICO,bgImage:'assets/classico-ulivo.jpg',ink:'#4B5340',accent:'#5C6B45'}),
    t('tpl-comunione','Comunione',{...EVENTO,bgImage:'assets/comunione.jpg'}),
    t('tpl-battesimo','Battesimo – Azzurro',{...EVENTO,bgImage:'assets/evento-battesimo.jpg',ink:'#2F3A45'}),
    t('tpl-cresima','Cresima – Salvia',{...EVENTO,bgImage:'assets/evento-cresima.jpg',ink:'#343A2C'}),
    t('tpl-anniversario','Anniversario e compleanno – Oro',{...EVENTO,bgImage:'assets/evento-anniversario.jpg',ink:'#3A3226'}),
    t('tpl-lib-orsetto','Libretto battesimo – Orsetto rosa',{...LIBRETTO,bgImage:'assets/libretto-orsetto-menu.jpg',coverImage:'assets/libretto-orsetto-copertina.jpg'})
  ];
}
function defaultState(){
  const dishes=[];Object.entries(SEED).forEach(([c,l])=>l.forEach(n=>dishes.push({id:uid(),name:n,cat:c,en:EN_DISHES[enKey(n)]||''})));
  return{v:3,settings:{venue:'Tenuta Coppa',drinkPresets:[...DRINK_PRESETS],didMsg:DID_MSG},categories:[...DEF_CATS],dishes,templates:defaultTemplates(),menus:[],didattica:{}};
}

/* ---------- Utilità ---------- */
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
const pad=n=>String(n).padStart(2,'0');
const isoD=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today=()=>isoD(new Date());
const parseD=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const fmtLong=s=>s?cap(parseD(s).toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'})):'';
const fmtDash=s=>s?s.split('-').reverse().join('-'):'';
const eurC=n=>LANG==='en'?'€'+Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,','):'€'+Number(n).toFixed(2).replace('.',',').replace(/\B(?=(\d{3})+(?!\d))/g,'.');
const eur=n=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(n);
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const slug=s=>norm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'menu';
const clone=o=>JSON.parse(JSON.stringify(o));
const oneLine=s=>String(s||'').replace(/\s*\n\s*/g,' ');
const num=v=>v===''||v===null||v===undefined?'':(parseFloat(String(v).replace(',','.'))||0);

const I={
  ost:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9" stroke-dasharray="2.2 2.2"/><path d="M8.5 13.5c1.5-3 2.6-4.5 3.5-4.5 1.3 0-.8 5 .6 5 1 0 1.8-1.5 2.9-3"/></svg>',
  farm:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V10"/><path d="M12 14c-3.5 0-6-2.5-6-6 3.5 0 6 2.5 6 6zM12 12c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6z"/><path d="M5 21h14"/></svg>',
  wa:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1.3-3.8A8 8 0 1 1 8 19z"/><path d="M9.2 8.6c.3 2.6 2.4 4.9 5.2 5.6l1-1.2 1.8.8-.4 1.7c-4.2.1-8-3.7-7.9-7.9l1.7-.4.8 1.8z" stroke-width="1.3"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/></svg>',
  list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h7"/></svg>',
  dish:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 2v8a2 2 0 0 0 2 2v10M11 2v8a2 2 0 0 1-2 2M7 6h4"/><path d="M17 22V2c-2 1.5-3 4-3 7s1 4 3 4"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  left:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  right:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>',
  down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  pen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>',
  dl:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
  copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  img:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>',
  pdf:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M12 11v6M9 14l3 3 3-3"/></svg>'
};

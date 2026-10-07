'use strict';
// Versione in inglese dei menù.
// I file in js/ sono script normali caricati in ordine da index.html: variabili e funzioni sono condivise fra tutti.
/* ---------- Versione in inglese ---------- */
const EN_CATS={'Antipasti':'Starters','Primi Piatti':'First courses','Secondo Piatto':'Main course','Dessert':'Dessert','Contorni':'Side dishes','Intermezzo':'Intermezzo','Antipasto':'Starter','Primo':'First course','Secondo':'Main course','Dolce':'Dessert','Menù bambini':'Kids menu'};
const ALLERGENS_EN=['Cereals containing gluten','Crustaceans','Eggs','Fish','Peanuts','Soybeans','Milk/Lactose','Tree nuts','Celery','Mustard','Sesame','Sulphites (>10mg/kg)','Lupin','Molluscs'];
// testi inglesi predefiniti per tipo di impaginazione (valgono anche per i template già installati)
const LAYOUT_EN={
  verticale:{heading:'Sunday Menu',headingKids:'Kids menu',drinks:'Cantina Crifo bottled wines, mineral water\nLiqueurs and coffee',drinksKids:'Mineral water',kidLabel:'Children up to 10 years'},
  classico:{heading:'Festive Lunch',subheading:'Menu',tagline:'Historic farmhouse since 1735',drinks:'Cantina Crifo wines and mineral water,\nLiqueur and coffee',kidLabel:'Children up to 10 years'},
  evento:{heading:'Menu',headingKids:'Kids menu',drinks:'Cantina Crifo Nero di Troia wine, mineral water, liqueurs and coffee.',drinksKids:'Mineral water',kidLabel:'Kids menu'},
  libretto:{heading:'My Baptism',headingKids:'Kids menu',drinksTitle:'Wines',drinks:'Cantina Crifo wines, sparkling wine, mineral water,\nsoft drinks, rosolio and coffee',kidLabel:'Children'}
};
// traduzioni delle portate di serie: si applicano da sole all'archivio
const EN_DISHES={
 "Selezione di focacce artigianali con oli extravergine aromatizzati e polveri di erbe spontanee dell’Alta Murgia":"Selection of artisan focaccia with flavoured extra virgin olive oils and wild herb powders from the Alta Murgia",
 "Veli di Capocollo di Martina Franca con salsa agli agrumi":"Thin slices of Martina Franca capocollo with citrus sauce",
 "Carpaccio di manzo con pomodori sott'olio, julienne di sedano e olive taggiasche":"Beef carpaccio with sun-dried tomatoes in oil, julienned celery and Taggiasca olives",
 "Arista di maiale con rucola dell’orto, petali di grana e pomodorini ciliegino":"Roast pork loin with garden rocket, Grana shavings and cherry tomatoes",
 "Formaggi della Masseria con miele millefiori bio delle Murge e noci caramellate":"Masseria cheeses with organic Murge wildflower honey and caramelised walnuts",
 "Tempura di melanzana ripiena di patate mantecate all’olio evo, speck e cuore filante di mozzarella affumicata, servita su coulis di pomodoro":"Aubergine tempura filled with creamed potatoes in extra virgin olive oil, speck and a melting heart of smoked mozzarella, served on tomato coulis",
 "Tempura di melanzana ripiena di patate mantecate, speck e cuore filante di mozzarella affumicata":"Aubergine tempura filled with creamed potatoes, speck and a melting heart of smoked mozzarella",
 "Focacce della tradizione":"Traditional focaccia",
 "Capocollo di Martina Franca con tarallo sbriciolato":"Martina Franca capocollo with crumbled tarallo",
 "Carpaccio di manzo con rucola e petali di grana":"Beef carpaccio with rocket and Grana shavings",
 "Ricotta, nodini e pecorino con miele di trifoglio della Murgia":"Ricotta, nodini and pecorino with Murgia clover honey",
 "Involtini di melanzana pastellata con crema di patate, speck e mozzarella":"Battered aubergine rolls with potato cream, speck and mozzarella",
 "Fagottino di crespella su vellutata di fondo bruno":"Crêpe parcel on a rich brown stock velouté",
 "Fagottino di crespella vegetariano su vellutata di bietole":"Vegetarian crêpe parcel on chard velouté",
 "Orecchiette fresche ai funghi cardoncelli trifolati, pomodorini ciliegino e crema di cece nero di Altamura":"Fresh orecchiette with sautéed cardoncello mushrooms, cherry tomatoes and Altamura black chickpea cream",
 "Orecchiette fresche con salsicce a punta di coltello, olive nere al forno, crema di burrata e limone":"Fresh orecchiette with hand-cut sausage, baked black olives, burrata cream and lemon",
 "Paccheri di Gragnano alle tre carni":"Gragnano paccheri with three-meat ragù",
 "Orecchiette con bacon, zucchine e fonduta di formaggio":"Orecchiette with bacon, courgettes and cheese fondue",
 "Coppa di maiale cotta a bassa temperatura con mele Granny Smith, prugne e anacardi accompagnata da patate al forno aromatizzate":"Slow-cooked pork neck with Granny Smith apples, prunes and cashews served with herb roast potatoes",
 "Stinco di maiale con salsa alle mele e contorno di patate al forno aromatizzate":"Pork shank with apple sauce and herb roast potatoes",
 "Grigliata di carni miste con contorno di patate al forno aromatizzate":"Mixed grilled meats with herb roast potatoes",
 "Reale di scottona con salsa al vino rosso e contorno di patate al forno aromatizzate":"Heifer chuck with red wine sauce and herb roast potatoes",
 "Mousse di ricotta, vaniglia e melecotogne con composta di frutta fresca":"Ricotta, vanilla and quince mousse with fresh fruit compote",
 "Sporcamuss con crema diplomatica e composta di frutta fresca":"Sporcamuss puff pastry with diplomat cream and fresh fruit compote",
 "Crostata di ricotta e pere con composta di frutta fresca":"Ricotta and pear tart with fresh fruit compote",
 "Dessert di frutta fresca":"Fresh fruit dessert",
 "Focaccia al pomodoro":"Tomato focaccia",
 "Prosciutto cotto e mozzarella":"Cooked ham and mozzarella",
 "Orecchiette con sugo di pomodoro":"Orecchiette with tomato sauce",
 "Cotoletta con patate al forno":"Breaded cutlet with roast potatoes",
 "Torta di cioccolato e mandorle con composta di frutta fresca":"Chocolate and almond cake with fresh fruit compote"
};
const enKey=s=>oneLine(s).replace(/\s+/g,' ').trim();
const catEn=n=>(state.settings.catEn||{})[n]||EN_CATS[n]||n;
const dishOf=i=>i.dishId&&state.dishes.find(x=>x.id===i.dishId);
const itemEn=i=>{if(i.en)return i.en;const d=dishOf(i);return d&&d.en&&oneLine(d.name)===oneLine(i.name)?d.en:''};
let LANG='it',TPL_OV=null;
const enOf=(t,f)=>{const v=t[f+'En'];return v!==undefined&&v!==''?v:(LAYOUT_EN[t.layout]||LAYOUT_EN.verticale)[f]};
function localize(m,t){
  const t2={...t};
  for(const f of ['heading','subheading','tagline','headingKids','drinks','drinksKids','kidLabel','drinksTitle']){const v=enOf(t,f);if(v!==undefined)t2[f]=v}
  const tr=S=>S&&S.map(s=>({...s,name:catEn(s.name),items:s.items.map(i=>({...i,name:itemEn(i)||i.name}))}));
  const m2={...m,sections:tr(m.sections),kidsSections:tr(m.kidsSections),heading:m.headingEn||'',notes:m.notesEn||m.notes};
  // campi scritti a mano nel menù: versione inglese se c'è, altrimenti quella inglese del template
  for(const f of ['drinks','drinksKids','headingKids','kidLabel']){
    if(m[f+'En'])m2[f]=m[f+'En'];else if(m[f]===undefined||m[f]===null)delete m2[f];
  }
  return[m2,t2];
}
// portate ancora senza traduzione, per avvisare prima di stampare
const missingEn=m=>allSecs(m).flatMap(s=>s.items).filter(i=>!itemEn(i));
function menuMsgEn(m,mode){
  const v=state.settings.venue||'Tenuta Coppa';
  const quando=m.date?` for ${parseD(m.date).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`:'';
  const g=[m.guests?m.guests+' adults':'',m.guestsKids?m.guestsKids+' children':''].filter(Boolean).join(' and ');
  const ciao=`Dear ${m.client||'Sir or Madam'},`;
  if(mode==='tavolo')return`${ciao}\nplease find attached our menu${quando}.\nKind regards,\n${v}`;
  const pa=num(val(m,'priceAdult')),pk=num(val(m,'priceKid')),eurC=n=>'€'+Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',');
  let r=`${ciao}\nas agreed, please find attached our menu proposal${quando}${g?` (${g})`:''}.`;
  if(pa!=='')r+=`\nThe price is ${eurC(pa)} per person${pk!==''&&Number(m.guestsKids)>0?` and ${eurC(pk)} per child`:''}.`;
  return r+`\nWe remain at your disposal for any changes.\nKind regards,\n${v}`;
}

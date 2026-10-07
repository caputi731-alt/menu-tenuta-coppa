#!/usr/bin/env python3
"""Controlli automatici dell'app web (archivio, backup, allergeni, finestre, PDF).

Si lanciano da soli su GitHub prima di compilare l'APK. A mano:
    pip install playwright && playwright install chromium
    python3 tests/test_app.py
"""
import functools, http.server, json, os, sys, threading
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=ROOT))
threading.Thread(target=srv.serve_forever, daemon=True).start()
U = f'http://127.0.0.1:{srv.server_address[1]}/index.html'

# finta app Android: registra le chiamate che l'app web fa al telefono
FAKE = """window.__c=[];window.Android={saveFile(b,n,m,sh){__c.push(['saveFile',n,sh])},shareFiles(j){__c.push(['shareFiles'])},
 saveAs(t,b,n,m){__c.push(['saveAs',t,n,m,b.length])},autoBackup(t,n){__c.push(['auto',n,t.length]);return true},
 version(){return '1.99'},fontScale(){return window.__fs||1}};"""
IDBGET = """k=>new Promise(r=>{const q=indexedDB.open('menu-app',1);q.onsuccess=()=>{const g=q.result.transaction('kv').objectStore('kv').get(k);g.onsuccess=()=>r(g.result)}})"""
IDBKEYS = """()=>new Promise(r=>{const q=indexedDB.open('menu-app',1);q.onsuccess=()=>{const g=q.result.transaction('kv').objectStore('kv').getAllKeys();g.onsuccess=()=>r(g.result)}})"""
IDBPUT = """([k,v])=>new Promise(r=>{const q=indexedDB.open('menu-app',1);q.onsuccess=()=>{const tx=q.result.transaction('kv','readwrite');tx.objectStore('kv').put(v,k);tx.oncomplete=()=>r(1)}})"""
BIG = 'data:image/png;base64,AAAA' + 'B' * 5000
fails = []


def ok(cond, msg):
    print(('OK   ' if cond else 'FAIL ') + msg, flush=True)
    if not cond:
        fails.append(msg)


# ---------- file dell'app: tutti presenti, salvati per l'uso offline e copiati nell'APK ----------
import re
html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
sw = open(os.path.join(ROOT, 'sw.js'), encoding='utf-8').read()
wf = open(os.path.join(ROOT, '.github', 'workflows', 'build-apk.yml'), encoding='utf-8').read()
refs = re.findall(r'<script src="([^"]+)"', html) + re.findall(r'<link rel="stylesheet" href="([^"]+)"', html)
ok(len(refs) >= 14 and all(os.path.isfile(os.path.join(ROOT, r)) for r in refs), 'tutti i file richiamati da index.html esistono')
ok(all("'./" + r + "'" in sw for r in refs), 'tutti i file sono nella lista offline di sw.js')
ok(all(re.search(r'cp -r [^\n]*\b' + d + r'\b', wf) for d in {r.split('/')[0] for r in refs}), "tutte le cartelle vengono copiate nell'APK")

with sync_playwright() as p:
    b = p.chromium.launch()

    def ctx(android=True, extra=None, w=400):
        c = b.new_context(viewport={'width': w, 'height': 800})
        if android:
            c.add_init_script(FAKE)
        if extra:
            c.add_init_script(extra)
        # nell'app Android i link a WhatsApp escono dall'app; qui vanno fermati perché la pagina resti aperta
        c.route('**/api.whatsapp.com/**', lambda r: r.fulfill(status=204))
        pg = c.new_page()
        pg.errs = []
        pg.dialogs = []
        pg.on('pageerror', lambda e: pg.errs.append(str(e)))
        pg.on('dialog', lambda d: (pg.dialogs.append(d.message), d.accept()))
        return pg

    def start(pg):
        pg.goto(U)
        pg.wait_for_selector('.nav')
        pg.wait_for_timeout(700)

    def restart(pg):
        pg.reload()
        pg.wait_for_selector('.nav')
        pg.wait_for_timeout(900)

    wait = lambda pg, ms=600: pg.wait_for_timeout(ms)
    yes = lambda pg: pg.click('#dlg [data-dlg=yes]')
    no = lambda pg: pg.click('#dlg .btn[data-dlg=no]')

    # ---------- archivio ----------
    pg = ctx()
    start(pg)
    st = pg.evaluate(IDBGET, 'state')
    ok(st and st['v'] == 3, 'primo avvio: archivio creato')
    old = pg.evaluate("""()=>{const s=JSON.parse(JSON.stringify(state));const t={...s.templates[0],id:'tpl-mio',name:'Mio',builtIn:false,bgImage:'%s'};s.templates.push(t);
      s.didattica={br:{name:'x.pdf',mime:'application/pdf',data:'data:application/pdf;base64,'+'C'.repeat(4000)}};
      s.menus=[{id:'m1',templateId:'tpl-pasqua',date:'2026-10-10',client:'Rossi',status:'bozza',showSections:true,sections:[{name:'Antipasti',items:[{name:'Prova'}]}],kidsSections:[]}];return s}""" % BIG)
    pg.evaluate(IDBPUT, ['state', old])
    restart(pg)
    st = pg.evaluate(IDBGET, 'state')
    keys = pg.evaluate(IDBKEYS)
    mio = [t for t in st['templates'] if t['id'] == 'tpl-mio'][0]
    ok(mio['bgImage'].startswith('idb:') and st['didattica']['br']['data'].startswith('idb:'), 'archivio vecchio: nello stato restano solo riferimenti alle immagini')
    ok(len([k for k in keys if k.startswith('blob:')]) == 2, 'immagini e file in chiavi separate')
    ok(pg.evaluate("state.templates.find(t=>t.id==='tpl-mio').bgImage") == BIG, "in memoria l'immagine è intatta")
    restart(pg)
    ok(pg.evaluate("state.templates.find(t=>t.id==='tpl-mio').bgImage") == BIG and pg.evaluate("state.didattica.br.data.length") == 4028 and pg.evaluate("state.menus.length") == 1, 'dopo il riavvio i dati tornano uguali')
    pg.evaluate("()=>{state.templates.find(t=>t.id==='tpl-mio').bgImage='data:image/png;base64,ZZZZ'+'Q'.repeat(3000);save()}")
    wait(pg)
    restart(pg)
    wait(pg)
    keys = pg.evaluate(IDBKEYS)
    ok(len([k for k in keys if k.startswith('blob:')]) == 2 and pg.evaluate("state.templates.find(t=>t.id==='tpl-mio').bgImage.includes('ZZZZ')"), 'immagine sostituita: la vecchia non resta in archivio')

    # ---------- backup ----------
    pg.click('[data-a=nav][data-v=settings]')
    ok('versione 1.99' in pg.inner_text('#app'), 'in Altro compare la versione installata')
    pg.click('[data-a=export]')
    pg.click('[data-a=saveAs]')
    wait(pg)
    c = [x for x in pg.evaluate('__c') if x[0] == 'saveAs'][-1]
    ok(c[2].startswith('backup-menu_') and c[3] == 'application/json', 'Salva in una cartella: chiamato il salvataggio di Android')
    ok(not pg.evaluate('state.settings.lastBackup'), 'backup NON segnato prima della conferma di Android')
    pg.evaluate("t=>window.onNativeSaved(t,false)", c[1])
    ok(not pg.evaluate('state.settings.lastBackup'), 'salvataggio annullato: backup non segnato')
    pg.click('[data-a=saveAs]')
    wait(pg)
    c = [x for x in pg.evaluate('__c') if x[0] == 'saveAs'][-1]
    pg.evaluate("t=>window.onNativeSaved(t,true)", c[1])
    ok(bool(pg.evaluate('state.settings.lastBackup')) and pg.locator('.sheet').count() == 0, 'file scritto: backup segnato')
    pg.evaluate("()=>{state.settings.lastBackup=0}")
    pg.click('[data-a=export]')
    pg.click('[data-a=shareFile]')
    wait(pg, 1200)
    ok(pg.locator('[data-a=bkYes]').count() == 1 and not pg.evaluate('state.settings.lastBackup'), 'invio del backup: chiede conferma, non segna da solo')
    pg.click('[data-a=bkNo]')
    pg.click('[data-a=closeSheet]')
    pg.evaluate("()=>{save()}")
    r = pg.evaluate("autoCopy()")
    c = [x for x in pg.evaluate('__c') if x[0] == 'auto']
    ok(r and c and c[-1][1].startswith('copia-automatica_2'), 'copia automatica scritta dopo una modifica')
    ok(pg.evaluate("autoCopy()") is False, 'nessuna copia se non è cambiato nulla')

    # ---------- importazione ----------
    n0 = pg.evaluate('state.menus.length')
    pg.evaluate("void applyBackup(JSON.stringify({v:99,menus:[],dishes:[]}))")
    wait(pg)
    ok(pg.evaluate('state.menus.length') == n0 and pg.locator('#dlg .dlg').count() == 0, 'backup di versione sconosciuta: rifiutato')
    pg.evaluate("void applyBackup(JSON.stringify({v:3,menus:[],dishes:[{id:'d',name:'Solo',cat:'Antipasti'}],templates:[],categories:['Antipasti']}))")
    pg.wait_for_selector('#dlg .dlg')
    no(pg)
    wait(pg)
    ok(pg.evaluate('state.menus.length') == n0, 'importazione annullata: dati intatti')
    pg.evaluate("void applyBackup(JSON.stringify({v:3,menus:[],dishes:[{id:'d',name:'Solo',cat:'Antipasti'}],templates:[],categories:['Antipasti']}))")
    pg.wait_for_selector('#dlg .dlg')
    yes(pg)
    wait(pg)
    ok(pg.evaluate('state.menus.length') == 0 and pg.evaluate('state.dishes.length') == 1, 'importazione riuscita')
    pg.click('[data-a=undoImport]')
    pg.wait_for_selector('#dlg .dlg')
    yes(pg)
    wait(pg)
    ok(pg.evaluate('state.menus.length') == n0 and pg.evaluate("state.templates.some(t=>t.id==='tpl-mio'&&t.bgImage.includes('ZZZZ'))"), 'annulla importazione: tornano menù e immagini')
    restart(pg)
    ok(pg.evaluate('state.menus.length') == n0, '...e restano dopo il riavvio')

    # ---------- editor: sezioni, eliminazioni con Annulla ----------
    pg.evaluate("()=>{state.categories.push('Contorni');save()}")
    pg.click('[data-a=nav][data-v=list]')
    pg.click('[data-a=open][data-id=m1]')
    pg.click('[data-a=addSec]')
    ok(pg.locator('[data-a=addSecPick]').count() == 4, 'Aggiungi una sezione: propone quelle mancanti')
    pg.click('[data-a=addSecPick][data-v="Primi Piatti"]')
    ok(pg.evaluate("getMenu('m1').sections.map(s=>s.name).join('|')") == 'Antipasti|Primi Piatti', 'sezione aggiunta al posto giusto')
    pg.click('[data-a=addSec]')
    pg.fill('#secnew', 'Frutta')
    pg.press('#secnew', 'Enter')
    ok(pg.evaluate("getMenu('m1').sections.map(s=>s.name).join('|')") == 'Antipasti|Primi Piatti|Frutta', 'sezione con nome libero in fondo')
    pg.click('[data-a=secDel][data-s="2"]')
    ok(pg.evaluate("getMenu('m1').sections.length") == 2, 'sezione vuota tolta')
    pg.click('[data-toast]')
    ok(pg.evaluate("getMenu('m1').sections.length") == 3, '...e ripresa con Annulla')
    pg.click('[data-a=itDel]')
    ok(pg.evaluate("getMenu('m1').sections[0].items.length") == 0, 'portata tolta dal menù')
    pg.click('[data-toast]')
    ok(pg.evaluate("getMenu('m1').sections[0].items[0].name") == 'Prova', '...e ripresa con Annulla')

    # ---------- allergeni ----------
    pg.evaluate("""()=>{const m=getMenu('m1');state.dishes.push({id:'dA',name:'Orecchiette',cat:'Primi Piatti',alg:[1,3]},{id:'dB',name:'Insalata',cat:'Antipasti'},{id:'dC',name:'Macedonia',cat:'Dessert',alg:[],algSet:true});
      m.allergens=true;m.sections[0].items=[{dishId:'dB',name:'Insalata'},{dishId:'dC',name:'Macedonia'}];m.sections[1].items=[{dishId:'dA',name:'Orecchiette'},{dishId:'dA',name:'Orecchiette senza uova'}];save();render(true)}""")
    ok(pg.evaluate("algTodo(getMenu('m1')).map(i=>i.name+':'+algState(i)).join('|')") == 'Insalata:manca|Orecchiette senza uova:verifica', 'allergeni: riconosce "mai indicati" e "testo cambiato"')
    ok(pg.locator('.it .pill').count() == 2, "le portate da controllare sono segnate nell'editor")
    pg.click('[data-a=preview]')
    ok('Allergeni da controllare' in pg.inner_text('#app'), "avviso in anteprima")
    pg.click('.top [data-a=back]')
    pg.click('.it .nm:has-text("Insalata")')
    pg.click('[data-a=algNone]')
    pg.click('[data-a=saveItem]')
    ok(pg.evaluate("state.dishes.find(d=>d.id==='dB').algSet") is True and pg.evaluate("algState(getMenu('m1').sections[0].items[0])") == 'ok', '"Nessuno" su una portata con il testo dell\'archivio: salvato in archivio')
    pg.click('.it .nm:has-text("senza uova")')
    pg.click('[data-a=algT][data-n="3"]')
    pg.click('[data-a=saveItem]')
    ok(pg.evaluate("JSON.stringify(getMenu('m1').sections[1].items[1].alg)") == '[1]' and pg.evaluate("JSON.stringify(state.dishes.find(d=>d.id==='dA').alg)") == '[1,3]', "portata riscritta: allergeni solo in questo menù, archivio intatto")
    ok(pg.evaluate("algTodo(getMenu('m1')).length") == 0, 'nessun avviso quando tutto è stato controllato')
    pg.evaluate("()=>{delDish('dA');save()}")
    ok(pg.evaluate("JSON.stringify(getMenu('m1').sections[1].items[0].alg)") == '[1,3]', "portata eliminata dall'archivio: il menù tiene i suoi allergeni")
    pg.click('[data-a=preview]')
    wait(pg, 900)
    ok(pg.locator('#pv .alg').count() == 2 and 'Allergeni da controllare' not in pg.inner_text('#app'), 'in anteprima compaiono i numeri degli allergeni')

    # ---------- PDF da stampare, prezzo, stato "inviata" ----------
    pg.wait_for_function("window.html2canvas&&window.jspdf")
    dims = pg.evaluate("makePDF(getMenu('m1'),'tavolo',true,true).then(c=>[c.width,c.height])")
    dimw = pg.evaluate("makePDF(getMenu('m1'),'tavolo',true).then(c=>[c.width,c.height])")
    ok(dims == [2380, 3368] and dimw == [1785, 2526], f'PDF da stampare a risoluzione più alta ({dims[0]}×{dims[1]} contro {dimw[0]}×{dimw[1]})')
    pg.click('[data-a=pdf]')
    pg.wait_for_selector('.sheet [data-a=saveAs]', timeout=60000)
    ok(pg.evaluate("ui.sheet.blob.size") > 50000, 'PDF del menù tavolo creato')
    pg.click('[data-a=closeSheet]')
    pg.click('[data-a=pvMode][data-v=proposta]')
    pg.click('[data-a=waMenu]')
    pg.wait_for_selector('#dlg .dlg')
    ok('prezzo predefinito' in pg.inner_text('#dlg'), 'proposta: chiede conferma del prezzo predefinito con la finestra dell\'app')
    yes(pg)
    pg.wait_for_selector('#watext', timeout=60000)
    pg.click('[data-a=waSend]')
    wait(pg)
    ok(pg.evaluate("getMenu('m1').status") == 'bozza' and pg.locator('[data-a=waFiles]').count() == 1, 'WhatsApp in due passaggi: dopo il primo la proposta è ancora bozza')
    pg.click('[data-a=waFiles]')
    ok(pg.evaluate("getMenu('m1').status") == 'inviata', '...diventa "inviata" quando si allega il file')
    pg.click('[data-toast]')
    ok(pg.evaluate("getMenu('m1').status") == 'bozza', '...e si può annullare')

    # ---------- finestre di conferma ----------
    pg.click('.top [data-a=back]')
    pg.click('[data-a=del]')
    pg.wait_for_selector('#dlg .dlg')
    ok(pg.evaluate("window.appBack()") is True and pg.locator('#dlg .dlg').count() == 0 and pg.evaluate("state.menus.length") == 1, 'tasto indietro: chiude la finestra senza eliminare')
    pg.click('[data-a=del]')
    yes(pg)
    ok(pg.evaluate("state.menus.length") == 0, 'menù eliminato dopo la conferma')
    pg.click('[data-toast]')
    ok(pg.evaluate("state.menus.length") == 1, '...e ripreso con Annulla')
    pg.click('[data-a=nav][data-v=settings]')
    pg.click('[data-a=catRen][data-i="0"]')
    pg.fill('#dlgin', 'Antipasti della casa')
    pg.press('#dlgin', 'Enter')
    ok(pg.evaluate("state.categories[0]") == 'Antipasti della casa' and pg.evaluate("getMenu('m1').sections[0].name") == 'Antipasti della casa', 'rinomina sezione con la finestra dell\'app')
    ok(not pg.dialogs, 'nessuna finestra di sistema usata ' + str(pg.dialogs[:2]))
    ok(not pg.errs, 'nessun errore JavaScript ' + str(pg.errs[:2]))

    # ---------- dimensione del testo ----------
    pg.click('[data-a=setZoom][data-v="1.3"]')
    ok(pg.evaluate("document.getElementById('app').style.zoom") == '1.3', 'testo "Molto grande" applicato')
    pg.set_viewport_size({'width': 360, 'height': 740})
    for v in ('cal', 'list', 'ostie', 'didattica', 'settings'):
        pg.click(f'[data-a=nav][data-v={v}]')
        wait(pg, 300)
        over = pg.evaluate("document.documentElement.scrollWidth-window.innerWidth")
        ok(over <= 1, f'testo molto grande su schermo stretto: "{v}" non esce di lato ({over}px)')
    pg.click('[data-a=nav][data-v=list]')
    pg.click('[data-a=open][data-id=m1]')
    wait(pg, 300)
    over = pg.evaluate("document.documentElement.scrollWidth-window.innerWidth")
    ok(over <= 1, f'testo molto grande: l\'editor non esce di lato ({over}px)')
    pg.click('[data-a=pick]')
    wait(pg, 500)
    sh = pg.evaluate("(()=>{const r=document.querySelector('.sheet').getBoundingClientRect();return [r.top,r.bottom,window.innerHeight]})()")
    ok(sh[0] >= 0 and sh[1] <= sh[2] + 1, 'testo molto grande: il foglio resta dentro lo schermo')
    pg.click('.sheet [data-a=closeSheet] >> nth=0')
    pg.evaluate("()=>{state.settings.uiZoom='auto';window.__fs=1.5;applyZoom()}")
    ok(pg.evaluate("uiZoom()") == 1.3, '"Come il telefono": segue il telefono, al massimo 1,3')
    pg.evaluate("()=>{window.__fs=1;applyZoom();save()}")

    # ---------- bersagli di tocco ----------
    render_ = pg.evaluate("render(true)")
    small = pg.evaluate("""[...document.querySelectorAll('#app button')].filter(b=>b.offsetParent).map(b=>[b.className+'/'+(b.dataset.a||''),b.getBoundingClientRect()]).filter(x=>x[1].height<40||x[1].width<40).map(x=>x[0]+' '+Math.round(x[1].width)+'x'+Math.round(x[1].height))""")
    ok(not small, f"editor: nessun pulsante sotto i 40 px {small}")

    # ---------- casi limite all'avvio ----------
    pg.evaluate(IDBPUT, ['state', {'v': 99, 'menus': [{'id': 'x'}], 'segreto': 'tienimi'}])
    restart(pg)
    keys = pg.evaluate(IDBKEYS)
    sc = [k for k in keys if k.startswith('scartato-')]
    ok(len(sc) == 1 and pg.evaluate(IDBGET, sc[0])['segreto'] == 'tienimi', 'archivio di versione sconosciuta: messo da parte, non cancellato')

    pg2 = ctx(extra="IDBFactory.prototype.open=function(){const r={};setTimeout(()=>{r.error=new Error('x');r.onerror&&r.onerror()},10);return r};")
    pg2.goto(U)
    pg2.wait_for_timeout(2000)
    ok('Archivio non raggiungibile' in pg2.inner_text('#app') and pg2.locator('.nav').count() == 0, 'archivio illeggibile: schermata di blocco, niente archivio vuoto')
    ok(pg2.evaluate('canSave') is False and pg2.evaluate("flush().then(x=>x)") is False, '...e nessun salvataggio possibile')

    pg3 = ctx()
    start(pg3)
    pg3.evaluate("()=>{const p=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(v,k){const r=p.call(this,v,k);this.transaction.abort();return r}}")
    r = pg3.evaluate("flush().then(x=>x)")
    ok(r is False and 'Salvataggio non riuscito' in pg3.inner_text('.toast'), "memoria piena: l'avviso compare")

    pg4 = ctx(android=False)
    start(pg4)
    pg4.click('[data-a=nav][data-v=settings]')
    pg4.click('[data-a=export]')
    ok(pg4.locator('[data-a=downloadFile]').count() == 1 and pg4.locator('[data-a=saveAs]').count() == 0 and not pg4.errs, "nel browser l'esportazione resta com'era")
    b.close()

print(f'\n{"TUTTO OK" if not fails else str(len(fails)) + " CONTROLLI FALLITI"}')
sys.exit(1 if fails else 0)

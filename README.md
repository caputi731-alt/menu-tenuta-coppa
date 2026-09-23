# Menù Tenuta Coppa

App per smartphone per creare menù da tavolo e proposte per i clienti, partendo dai template Canva di Tenuta Coppa (menù della domenica in tre versioni e comunione con menù bambini) e da un archivio di portate.

## Pubblicare l'app con GitHub Pages

1. Su github.com crea un nuovo repository (es. `menu-tenuta-coppa`). Può essere pubblico o, con piano a pagamento, privato.
2. Tocca **Add file → Upload files** e trascina tutti i file di questa cartella, comprese le cartelle `icons` e `assets`. Conferma con **Commit changes**.
3. Vai in **Settings → Pages**. In *Build and deployment* scegli **Deploy from a branch**, branch `main`, cartella `/ (root)`, e salva.
4. Dopo un paio di minuti l'app è online all'indirizzo `https://<tuo-utente>.github.io/menu-tenuta-coppa/`.

## Installarla sul telefono

- **iPhone (Safari):** apri il link, tocca Condividi e poi **Aggiungi alla schermata Home**.
- **Android (Chrome):** apri il link, menu ⋮ e poi **Installa app**.

Aprila la prima volta con internet attivo: da quel momento funziona anche offline.

## Usare lo sfondo di Canva

Per creare un nuovo template (battesimo, compleanno…) con la stessa impaginazione:

1. In Canva duplica il design e cancella tutti i testi (resta solo la grafica).
2. Scarica come **PNG**: 810 × 1440 per i menù verticali, A4 orizzontale per quelli a due colonne.
3. Nell'app: Impostazioni → Template → apri il template più simile → **Duplica template** → **Carica immagine**.
4. Per i verticali, regola "Fine testo" finché il testo non tocca le illustrazioni in basso.

## Dati e backup

Tutto resta salvato sul telefono, nel browser. Da Impostazioni → **Esporta** ottieni un file di backup da salvare su Drive o mandarti via email; con **Importa** lo ripristini sullo stesso o su un altro telefono.

Attenzione: cancellare i dati di navigazione di Safari/Chrome cancella anche i dati dell'app.

## Aggiornare l'app

Carica i nuovi file sul repository e, in `sw.js`, aumenta il numero in `menu-app-v2` (es. `menu-app-v3`). Alla successiva apertura il telefono scarica la nuova versione. I dati salvati non vengono toccati.

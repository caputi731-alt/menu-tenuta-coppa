# Come ottenere l'APK

L'app viene compilata da GitHub: tu non devi installare niente sul computer.
Ogni volta che il codice cambia, GitHub crea un nuovo APK e lo pubblica nella
sezione **Releases** del repository, da dove lo scarichi col telefono.

---

## 1. Configura la chiave di firma (una volta sola)

Serve perché l'APK sia sempre firmato con la stessa chiave: così gli
aggiornamenti si installano sopra il precedente **senza perdere i dati**.
Senza questo passaggio ogni build ha una firma diversa e per aggiornare
dovresti disinstallare l'app, perdendo menù e portate.

Nel repository vai su **Settings → Secrets and variables → Actions → New
repository secret** e crea questi quattro segreti (uno per volta):

| Name | Secret |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | il contenuto del file `chiave-base64.txt` che ti ho mandato |
| `ANDROID_STORE_PASSWORD` | la password che ti ho mandato |
| `ANDROID_KEY_ALIAS` | `menu` |
| `ANDROID_KEY_PASSWORD` | la stessa password |

Conserva la password e il file della chiave in un posto sicuro (non nel
repository, che è pubblico). Se li perdi, potrai comunque fare nuovi APK, ma
per installarli dovrai prima disinstallare l'app.

---

## 2. Avvia la compilazione

Succede da sola a ogni modifica del codice. Per lanciarla a mano:
**Actions → Compila APK → Run workflow**.

La prima volta ci vogliono circa 5–10 minuti.

---

## 3. Scarica e installa l'APK sul telefono

1. Dal telefono apri il repository e tocca **Releases** (colonna a destra, o in fondo alla pagina).
2. Apri l'ultima build e tocca il file `menu-tenuta-coppa-build-N.apk`.
3. A download finito toccalo per installarlo.
4. Android avvisa che l'installazione da questa fonte non è consentita: tocca
   **Impostazioni**, attiva **Consenti da questa fonte**, torna indietro e conferma.
5. L'app **Menù Tenuta Coppa** compare tra le applicazioni.

Per gli aggiornamenti successivi basta scaricare il nuovo APK e installarlo
sopra: i dati restano.

---

## Dove stanno i dati

Dentro l'app, sul telefono. Non vengono caricati da nessuna parte e non sono
nel repository.

- **Copia automatica** (Android 10 o successivo): nei giorni in cui modifichi
  qualcosa l'app salva da sola una copia in `Download/MenuTenutaCoppa` e tiene
  le ultime 7. Resta sul telefono anche se disinstalli l'app; per riprenderla
  usa **Impostazioni → Importa** e scegli il file.
- **Backup fuori dal telefono**: ogni tanto fai **Impostazioni → Esporta →
  Salva in una cartella** e scegli Google Drive. È l'unico modo per recuperare
  i dati se il telefono si rompe o va perso.

---

## Se la compilazione fallisce

Nel tab **Actions** la build compare con una X rossa. Aprila, guarda il passo
in rosso e mandami lo screenshot del messaggio: di solito è una riga da correggere.

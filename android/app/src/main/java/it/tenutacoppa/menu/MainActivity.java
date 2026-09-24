package it.tenutacoppa.menu;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;

import java.io.File;
import java.io.FileOutputStream;

public class MainActivity extends AppCompatActivity {

    /** Dominio fittizio: non esiste in rete, serve solo a dare un'origine sicura all'app. */
    private static final String DOMINIO = "appassets.androidplatform.net";

    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private ActivityResultLauncher<String> filePicker;

    @Override
    protected void onCreate(Bundle stato) {
        super.onCreate(stato);

        // selettore file, usato dall'app per importare un backup
        filePicker = registerForActivityResult(new ActivityResultContracts.GetContent(), uri -> {
            if (fileCallback == null) return;
            fileCallback.onReceiveValue(uri == null ? null : new Uri[]{uri});
            fileCallback = null;
        });

        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);          // serve a IndexedDB, dove l'app salva i dati
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMediaPlaybackRequiresUserGesture(false);

        // I file dell'app vengono serviti su un indirizzo https interno invece che come
        // file://: solo così il browser di Android concede IndexedDB, dove l'app salva i dati.
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .setDomain(DOMINIO)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web.setWebViewClient(new WebViewClient() {
            @Override
            public android.webkit.WebResourceResponse shouldInterceptRequest(
                    WebView v, android.webkit.WebResourceRequest r) {
                return loader.shouldInterceptRequest(r.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, android.webkit.WebResourceRequest r) {
                Uri u = r.getUrl();
                // i link esterni si aprono nel browser, l'app resta dov'è
                if (DOMINIO.equals(u.getHost())) return false;
                startActivity(new Intent(Intent.ACTION_VIEW, u));
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = cb;
                try {
                    filePicker.launch("*/*");
                } catch (Exception e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }
        });

        web.addJavascriptInterface(new Ponte(), "Android");
        web.loadUrl("https://" + DOMINIO + "/assets/index.html");
    }

    /**
     * Tasto indietro: lo gestisce l'app (chiude i fogli aperti, torna alla schermata precedente).
     * Solo dal calendario, la schermata iniziale, l'app si chiude.
     */
    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(window.appBack&&window.appBack())?'si':'no'", risposta -> {
            if (!"\"si\"".equals(risposta)) finish();
        });
    }

    /** Funzioni che l'app web può chiamare: salvataggio e condivisione dei PDF. */
    private class Ponte {
        @JavascriptInterface
        public void saveFile(String base64, String nome, String tipo, boolean condividi) {
            try {
                File cartella = new File(getCacheDir(), "condivisi");
                if (!cartella.exists() && !cartella.mkdirs()) throw new Exception("cartella non creata");
                File f = new File(cartella, nome.replaceAll("[^A-Za-z0-9._-]", "_"));
                try (FileOutputStream out = new FileOutputStream(f)) {
                    out.write(Base64.decode(base64, Base64.DEFAULT));
                }
                Uri uri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".files", f);

                Intent i = new Intent(condividi ? Intent.ACTION_SEND : Intent.ACTION_VIEW);
                if (condividi) {
                    i.setType(tipo);
                    i.putExtra(Intent.EXTRA_STREAM, uri);
                } else {
                    i.setDataAndType(uri, tipo);
                }
                i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                Intent scelta = Intent.createChooser(i, condividi ? "Invia il menù" : "Apri il menù");
                scelta.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(scelta);
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this,
                        "Non è stato possibile preparare il file", Toast.LENGTH_LONG).show());
            }
        }

        /**
         * Invia uno o più file insieme a un messaggio.
         * json = {files:[{name,mime,data(base64)}], text, whatsapp:bool, phone:"39..."}
         * Con whatsapp=true apre direttamente WhatsApp (o WhatsApp Business);
         * se non è installato, mostra il normale menu di condivisione.
         */
        private void avvisaAppunti() {
            runOnUiThread(() -> Toast.makeText(MainActivity.this,
                    "Messaggio copiato: se non compare, tieni premuto e scegli Incolla",
                    Toast.LENGTH_LONG).show());
        }

        @JavascriptInterface
        public void shareFiles(String json) {
            try {
                org.json.JSONObject o = new org.json.JSONObject(json);
                org.json.JSONArray arr = o.optJSONArray("files");
                String testo = o.optString("text", "");
                boolean wa = o.optBoolean("whatsapp", false);
                String tel = o.optString("phone", "").replaceAll("[^0-9]", "");

                File cartella = new File(getCacheDir(), "condivisi");
                if (!cartella.exists() && !cartella.mkdirs()) throw new Exception("cartella non creata");
                java.util.ArrayList<Uri> uris = new java.util.ArrayList<>();
                String tipo = null;
                for (int k = 0; arr != null && k < arr.length(); k++) {
                    org.json.JSONObject f = arr.getJSONObject(k);
                    File out = new File(cartella, f.getString("name").replaceAll("[^A-Za-z0-9._-]", "_"));
                    try (FileOutputStream os = new FileOutputStream(out)) {
                        os.write(Base64.decode(f.getString("data"), Base64.DEFAULT));
                    }
                    uris.add(FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".files", out));
                    String m = f.optString("mime", "*/*");
                    tipo = (tipo == null || tipo.equals(m)) ? m : "*/*";
                }

                // Il testo va anche negli appunti: WhatsApp a volte scarta la didascalia
                // dei documenti, così basta tenere premuto e scegliere Incolla.
                if (!testo.isEmpty()) {
                    final String t = testo;
                    runOnUiThread(() -> {
                        android.content.ClipboardManager cm =
                                (android.content.ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
                        if (cm != null) cm.setPrimaryClip(android.content.ClipData.newPlainText("Messaggio", t));
                    });
                }

                // Con SEND_MULTIPLE WhatsApp mantiene il testo come didascalia anche per i PDF;
                // con SEND di un solo documento spesso lo ignora.
                Intent i;
                boolean unaImmagine = uris.size() == 1 && tipo != null && tipo.startsWith("image/");
                if (unaImmagine) {
                    // una sola immagine: invio semplice, WhatsApp usa sempre il testo come didascalia
                    i = new Intent(Intent.ACTION_SEND);
                    i.putExtra(Intent.EXTRA_STREAM, uris.get(0));
                    if (!testo.isEmpty()) i.putExtra(Intent.EXTRA_TEXT, testo);
                } else if (!uris.isEmpty()) {
                    i = new Intent(Intent.ACTION_SEND_MULTIPLE);
                    i.putParcelableArrayListExtra(Intent.EXTRA_STREAM, uris);
                    if (!testo.isEmpty()) {
                        java.util.ArrayList<CharSequence> testi = new java.util.ArrayList<>();
                        testi.add(testo);
                        i.putCharSequenceArrayListExtra(Intent.EXTRA_TEXT, testi);
                    }
                } else {
                    i = new Intent(Intent.ACTION_SEND);
                }
                i.setType(tipo != null ? tipo : "text/plain");
                if (!testo.isEmpty() && uris.isEmpty()) i.putExtra(Intent.EXTRA_TEXT, testo);
                i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                if (wa) {
                    // con il numero del cliente WhatsApp apre direttamente la sua chat
                    if (tel.length() >= 8) i.putExtra("jid", tel + "@s.whatsapp.net");
                    for (String pkg : new String[]{"com.whatsapp", "com.whatsapp.w4b"}) {
                        try {
                            Intent w = new Intent(i).setPackage(pkg);
                            w.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            startActivity(w);
                            if (!testo.isEmpty()) avvisaAppunti();
                            return;
                        } catch (android.content.ActivityNotFoundException ignored) { }
                    }
                }
                Intent scelta = Intent.createChooser(i, "Invia");
                scelta.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(scelta);
                if (!testo.isEmpty()) avvisaAppunti();
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this,
                        "Non è stato possibile inviare i file", Toast.LENGTH_LONG).show());
            }
        }
    }
}

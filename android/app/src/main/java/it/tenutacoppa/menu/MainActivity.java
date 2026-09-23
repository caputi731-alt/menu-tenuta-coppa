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

import java.io.File;
import java.io.FileOutputStream;

public class MainActivity extends AppCompatActivity {

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
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMediaPlaybackRequiresUserGesture(false);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, android.webkit.WebResourceRequest r) {
                Uri u = r.getUrl();
                // i link esterni si aprono nel browser, l'app resta dov'è
                if ("file".equals(u.getScheme())) return false;
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
        web.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
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
    }
}

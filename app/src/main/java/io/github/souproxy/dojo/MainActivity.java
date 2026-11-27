package io.github.souproxy.dojo;

import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.util.Log;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;

import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.documentfile.provider.DocumentFile;
import androidx.webkit.JavaScriptReplyProxy;
import androidx.webkit.WebMessageCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Casca nativa do Dojo: um WebView que só carrega os arquivos locais do APK.
 *
 * Decisões de segurança:
 * - Conteúdo servido por WebViewAssetLoader em https://appassets.androidplatform.net
 *   (origem segura, sem acesso a file://).
 * - Qualquer navegação ou requisição fora dessa origem é bloqueada.
 * - Ponte JS↔nativo via addWebMessageListener restrita à origem do app
 *   (em vez de addJavascriptInterface, que expõe a ponte a qualquer frame).
 * - Mensagens recebidas são validadas (tipo, tamanho, limites).
 * - Sem permissão de INTERNET.
 */
public class MainActivity extends ComponentActivity {

    private static final String TAG = "Dojo";
    private static final String HOST = "appassets.androidplatform.net";
    private static final String ORIGIN = "https://" + HOST;
    private static final String START_URL = ORIGIN + "/assets/www/index.html";
    private static final int MAX_FILE_BYTES = 5 * 1024 * 1024;
    private static final int MAX_MESSAGE_CHARS = 8 * 1024 * 1024;

    private WebView webView;
    private WebViewAssetLoader assetLoader;
    @Nullable private JavaScriptReplyProxy replyProxy;
    @Nullable private String pendingExport;
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());
    private boolean debuggable;

    private final ActivityResultLauncher<String> createDocument =
            registerForActivityResult(new ActivityResultContracts.CreateDocument("application/json"), this::onExportTarget);
    private final ActivityResultLauncher<String[]> openDocument =
            registerForActivityResult(new ActivityResultContracts.OpenDocument(), this::onImportSource);
    private final ActivityResultLauncher<Uri> openTree =
            registerForActivityResult(new ActivityResultContracts.OpenDocumentTree(), this::onBackupFolder);

    // Backup automático: pasta escolhida pelo usuário (fora do app), sobrevive a desinstalações.
    private static final String PREFS = "dojo";
    private static final String KEY_DIR = "backupDir";
    private static final String BACKUP = "dojo-backup.json";
    private static final String BACKUP_PREV = "dojo-backup-anterior.json";
    private boolean restoreAfterPick;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        debuggable = (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#15161B"));
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.ime()
                    | WindowInsetsCompat.Type.displayCutout());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return WindowInsetsCompat.CONSUMED;
        });

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#15161B"));
        root.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(root);

        configureWebView();
        setupBackHandling();

        if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null) {
            webView.loadUrl(START_URL);
        }
    }

    private void configureWebView() {
        WebView.setWebContentsDebuggingEnabled(debuggable);

        assetLoader = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setGeolocationEnabled(false);
        s.setSupportMultipleWindows(false);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setMediaPlaybackRequiresUserGesture(false); // bipes do timer
        s.setTextZoom(100);

        webView.setWebViewClient(new WebViewClientCompat() {
            @Nullable
            @Override
            public WebResourceResponse shouldInterceptRequest(@NonNull WebView view, @NonNull WebResourceRequest request) {
                Uri url = request.getUrl();
                if (isAppUrl(url)) {
                    return assetLoader.shouldInterceptRequest(url);
                }
                // Defesa em profundidade (a CSP já bloqueia): nada sai do app.
                return new WebResourceResponse("text/plain", "utf-8", 403, "Forbidden",
                        Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
            }

            @Override
            public boolean shouldOverrideUrlLoading(@NonNull WebView view, @NonNull WebResourceRequest request) {
                return !isAppUrl(request.getUrl());
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage cm) {
                if (debuggable) {
                    Log.i(TAG, "console[" + cm.messageLevel() + "] " + cm.message());
                }
                return true;
            }
        });

        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(webView, "DojoNative", Collections.singleton(ORIGIN),
                    (view, message, sourceOrigin, isMainFrame, proxy) -> {
                        if (!isMainFrame || !isAppUrl(sourceOrigin)) return;
                        replyProxy = proxy;
                        onWebMessage(message);
                    });
        } else {
            Log.w(TAG, "WebView sem WEB_MESSAGE_LISTENER: backup e vibração nativa indisponíveis");
        }
    }

    private static boolean isAppUrl(@Nullable Uri url) {
        return url != null && "https".equals(url.getScheme()) && HOST.equals(url.getHost())
                && (url.getPort() == -1 || url.getPort() == 443);
    }

    private void setupBackHandling() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                webView.evaluateJavascript("(window.dojoBack && window.dojoBack()) === true", value -> {
                    if (!"true".equals(value)) {
                        setEnabled(false);
                        getOnBackPressedDispatcher().onBackPressed();
                        setEnabled(true);
                    }
                });
            }
        });
    }

    // ------------------------------------------------------------------ mensagens da UI

    private void onWebMessage(WebMessageCompat message) {
        String data = message.getData();
        if (data == null || data.length() > MAX_MESSAGE_CHARS) return;
        try {
            JSONObject msg = new JSONObject(data);
            switch (msg.optString("type")) {
                case "keepAwake":
                    if (msg.optBoolean("on")) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    break;
                case "vibrate":
                    vibrate(msg.optJSONArray("pattern"));
                    break;
                case "export":
                    String content = msg.optString("content", "");
                    if (content.isEmpty() || content.length() > MAX_FILE_BYTES) {
                        reply("export", false, "Backup inválido.");
                        return;
                    }
                    pendingExport = content;
                    createDocument.launch(safeFileName(msg.optString("filename")));
                    break;
                case "import":
                    openDocument.launch(new String[]{"application/json", "text/plain", "application/octet-stream"});
                    break;
                case "pickBackupFolder":
                    restoreAfterPick = msg.optBoolean("restore");
                    openTree.launch(null);
                    break;
                case "backupStatus":
                    sendBackupStatus();
                    break;
                case "autoBackup":
                    String data2 = msg.optString("content", "");
                    if (data2.isEmpty() || data2.length() > MAX_FILE_BYTES) return;
                    writeAutoBackup(data2);
                    break;
                case "restoreFromFolder":
                    restoreFromFolder();
                    break;
                default:
                    Log.w(TAG, "Mensagem desconhecida ignorada");
            }
        } catch (JSONException e) {
            Log.w(TAG, "Mensagem inválida ignorada");
        }
    }

    static String safeFileName(String name) {
        String clean = name == null ? "" : name.replaceAll("[^A-Za-z0-9._-]", "");
        if (clean.isEmpty() || clean.length() > 64) clean = "dojo-backup.json";
        if (!clean.endsWith(".json")) clean += ".json";
        return clean;
    }

    private void vibrate(@Nullable JSONArray pattern) {
        if (pattern == null || pattern.length() == 0 || pattern.length() > 12) return;
        long[] timings = new long[pattern.length()];
        for (int i = 0; i < timings.length; i++) {
            timings[i] = Math.max(0, Math.min(2000, pattern.optLong(i, 0)));
        }
        Vibrator vib;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            VibratorManager vm = getSystemService(VibratorManager.class);
            vib = vm != null ? vm.getDefaultVibrator() : null;
        } else {
            vib = getSystemService(Vibrator.class);
        }
        if (vib != null && vib.hasVibrator()) {
            vib.vibrate(VibrationEffect.createWaveform(timings, -1));
        }
    }

    private void onExportTarget(@Nullable Uri uri) {
        final String content = pendingExport;
        pendingExport = null;
        if (uri == null || content == null) {
            reply("export", false, "Exportação cancelada.");
            return;
        }
        io.execute(() -> {
            try (OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
                if (out == null) throw new IOException("sem stream");
                out.write(content.getBytes(StandardCharsets.UTF_8));
                main.post(() -> reply("export", true, null));
            } catch (IOException | SecurityException e) {
                Log.w(TAG, "Falha ao exportar", e);
                main.post(() -> reply("export", false, "Não foi possível salvar o arquivo."));
            }
        });
    }

    private void onImportSource(@Nullable Uri uri) {
        if (uri == null) return;
        io.execute(() -> {
            try (InputStream in = getContentResolver().openInputStream(uri)) {
                if (in == null) throw new IOException("sem stream");
                ByteArrayOutputStream buf = new ByteArrayOutputStream();
                byte[] chunk = new byte[16 * 1024];
                int n;
                while ((n = in.read(chunk)) != -1) {
                    if (buf.size() + n > MAX_FILE_BYTES) {
                        main.post(() -> replyImportError("Arquivo grande demais (máx. 5 MB)."));
                        return;
                    }
                    buf.write(chunk, 0, n);
                }
                String text = buf.toString(StandardCharsets.UTF_8.name());
                main.post(() -> {
                    try {
                        JSONObject r = new JSONObject().put("type", "import").put("content", text);
                        post(r);
                    } catch (JSONException ignored) {
                        replyImportError("Falha ao ler o arquivo.");
                    }
                });
            } catch (IOException | SecurityException e) {
                Log.w(TAG, "Falha ao importar", e);
                main.post(() -> replyImportError("Não foi possível ler o arquivo."));
            }
        });
    }

    // ------------------------------------------------------------------ backup automático em pasta

    @Nullable
    private DocumentFile backupDir() {
        String u = getSharedPreferences(PREFS, MODE_PRIVATE).getString(KEY_DIR, null);
        if (u == null) return null;
        Uri tree = Uri.parse(u);
        boolean granted = false;
        for (android.content.UriPermission p : getContentResolver().getPersistedUriPermissions()) {
            if (p.getUri().equals(tree) && p.isWritePermission()) granted = true;
        }
        if (!granted) return null;
        DocumentFile dir = DocumentFile.fromTreeUri(this, tree);
        return dir != null && dir.canWrite() ? dir : null;
    }

    private void onBackupFolder(@Nullable Uri tree) {
        if (tree == null) {
            restoreAfterPick = false;
            sendBackupStatus();
            return;
        }
        try {
            getContentResolver().takePersistableUriPermission(tree,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            getSharedPreferences(PREFS, MODE_PRIVATE).edit().putString(KEY_DIR, tree.toString()).apply();
        } catch (SecurityException e) {
            Log.w(TAG, "Sem permissão persistente na pasta", e);
        }
        boolean restore = restoreAfterPick;
        restoreAfterPick = false;
        sendBackupStatus();
        if (restore) restoreFromFolder();
    }

    private void sendBackupStatus() {
        io.execute(() -> {
            JSONObject r = new JSONObject();
            try {
                DocumentFile dir = backupDir();
                r.put("type", "backupStatus").put("configured", dir != null);
                if (dir != null) {
                    r.put("name", dir.getName() == null ? "pasta escolhida" : dir.getName());
                    DocumentFile f = dir.findFile(BACKUP);
                    if (f != null) r.put("lastModified", f.lastModified());
                }
            } catch (JSONException | SecurityException ignored) {
                // status vazio
            }
            main.post(() -> post(r));
        });
    }

    private void writeAutoBackup(String content) {
        io.execute(() -> {
            String error = null;
            try {
                DocumentFile dir = backupDir();
                if (dir == null) throw new IOException("pasta indisponível");
                DocumentFile cur = dir.findFile(BACKUP);
                if (cur != null && cur.length() > 0 && cur.length() <= MAX_FILE_BYTES) {
                    // Mantém a versão anterior: se algo der errado, ainda há uma cópia boa.
                    String old = readAll(cur.getUri());
                    DocumentFile prev = dir.findFile(BACKUP_PREV);
                    if (prev == null) prev = dir.createFile("application/json", BACKUP_PREV);
                    if (prev != null) writeAll(prev.getUri(), old);
                }
                if (cur == null) cur = dir.createFile("application/json", BACKUP);
                if (cur == null) throw new IOException("não foi possível criar o arquivo");
                writeAll(cur.getUri(), content);
            } catch (IOException | SecurityException e) {
                Log.w(TAG, "Falha no backup automático", e);
                error = "Backup automático falhou: escolha a pasta de novo em Ajustes.";
            }
            final String err = error;
            main.post(() -> {
                try {
                    JSONObject r = new JSONObject().put("type", "autoBackup").put("ok", err == null).put("at", System.currentTimeMillis());
                    if (err != null) r.put("error", err);
                    post(r);
                } catch (JSONException ignored) {
                    // inalcançável
                }
            });
        });
    }

    private void restoreFromFolder() {
        io.execute(() -> {
            try {
                DocumentFile dir = backupDir();
                DocumentFile f = dir == null ? null : newestBackup(dir);
                if (f == null) {
                    main.post(() -> replyImportError("Nenhum backup do Dojo (dojo-backup*.json) nessa pasta."));
                    return;
                }
                if (f.length() > MAX_FILE_BYTES) {
                    main.post(() -> replyImportError("Arquivo grande demais (máx. 5 MB)."));
                    return;
                }
                String text = readAll(f.getUri());
                main.post(() -> {
                    try {
                        post(new JSONObject().put("type", "import").put("content", text).put("source", "folder"));
                    } catch (JSONException ignored) {
                        replyImportError("Falha ao ler o backup.");
                    }
                });
            } catch (IOException | SecurityException e) {
                Log.w(TAG, "Falha ao restaurar da pasta", e);
                main.post(() -> replyImportError("Não foi possível ler o backup da pasta."));
            }
        });
    }

    /** dojo-backup.json; se não houver, o dojo-backup*.json mais recente (ex.: exportado manualmente). */
    @Nullable
    private static DocumentFile newestBackup(DocumentFile dir) {
        DocumentFile exact = dir.findFile(BACKUP);
        if (exact != null && exact.isFile()) return exact;
        DocumentFile best = null;
        for (DocumentFile f : dir.listFiles()) {
            String n = f.getName();
            if (n == null || !f.isFile() || !n.startsWith("dojo-backup") || !n.endsWith(".json") || n.equals(BACKUP_PREV)) continue;
            if (best == null || f.lastModified() > best.lastModified()) best = f;
        }
        return best;
    }

    private String readAll(Uri uri) throws IOException {
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            if (in == null) throw new IOException("sem stream");
            ByteArrayOutputStream buf = new ByteArrayOutputStream();
            byte[] chunk = new byte[16 * 1024];
            int n;
            while ((n = in.read(chunk)) != -1) {
                if (buf.size() + n > MAX_FILE_BYTES) throw new IOException("arquivo grande demais");
                buf.write(chunk, 0, n);
            }
            return buf.toString(StandardCharsets.UTF_8.name());
        }
    }

    private void writeAll(Uri uri, String content) throws IOException {
        try (OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
            if (out == null) throw new IOException("sem stream");
            out.write(content.getBytes(StandardCharsets.UTF_8));
        }
    }

    private void replyImportError(String error) {
        try {
            post(new JSONObject().put("type", "import").put("error", error));
        } catch (JSONException ignored) {
            // inalcançável
        }
    }

    private void reply(String type, boolean ok, @Nullable String error) {
        try {
            JSONObject r = new JSONObject().put("type", type).put("ok", ok);
            if (error != null) r.put("error", error);
            post(r);
        } catch (JSONException ignored) {
            // inalcançável
        }
    }

    private void post(JSONObject msg) {
        if (replyProxy != null) replyProxy.postMessage(msg.toString());
    }

    // ------------------------------------------------------------------ ciclo de vida

    @Override
    protected void onSaveInstanceState(@NonNull Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
        webView.resumeTimers();
    }

    @Override
    protected void onPause() {
        // Em segundo plano: congela JS/timers e solta a tela (economia de bateria).
        // Os timers do app usam horário absoluto, então voltam certos ao reabrir.
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        webView.onPause();
        webView.pauseTimers();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        io.shutdown();
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}

package app.chroniques;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.util.Base64;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.OutputStream;
import java.net.URLEncoder;
import org.json.JSONObject;

/** Chroniques pour Android : la même application que le site, dans une fenêtre dédiée, avec en plus
 *  l'envoi de fichiers, l'enregistrement des exports, l'impression, les notifications et le choix du serveur. */
public class MainActivity extends Activity {
    static final String START = "file:///android_asset/start/index.html";
    private static final int REQ_FILE = 1, REQ_SAVE = 2;
    static volatile boolean gameActive = false;

    private WebView web;
    private Store store;
    private Bundle bundle;
    private ValueCallback<Uri[]> fileCallback;
    private byte[] pendingBytes;
    private boolean useBundle = false;

    private static final String SHIM =
        "(function(){if(window.__chroniquesShim)return;window.__chroniquesShim=1;var A=window.ChroniquesAndroid;if(!A)return;" +
        "var blobs={},cu=URL.createObjectURL;URL.createObjectURL=function(o){var u=cu.call(URL,o);try{if(o instanceof Blob)blobs[u]=o;}catch(e){}return u;};" +
        "function send(n,t,d){A.saveFile(n||'fichier',t||'application/octet-stream',d.slice(d.indexOf(',')+1));}" +
        "function save(h,n){if(/^data:/.test(h)){send(n,(h.match(/^data:([^;,]+)/)||[])[1],h);return;}var b=blobs[h];if(!b)return;var f=new FileReader();f.onload=function(){send(n,b.type,String(f.result));};f.readAsDataURL(b);}" +
        "var oc=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){var h=this.href||'';if(this.hasAttribute('download')&&/^(blob|data):/.test(h)){save(h,this.getAttribute('download'));return;}return oc.call(this);};" +
        "document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[download]');if(a&&/^(blob|data):/.test(a.href)){e.preventDefault();save(a.href,a.getAttribute('download'));}},true);" +
        "window.print=function(){A.print(document.title||'Chroniques');};})();";

    @Override protected void onCreate(android.os.Bundle saved) {
        super.onCreate(saved);
        store = new Store(this); if (store.lang() != null) Compat.lang = store.lang();
        bundle = new Bundle(this);
        Compat.channels(this);
        WebView.setWebContentsDebuggingEnabled((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0);
        web = new WebView(this);
        web.setBackgroundColor(0xFF16120F);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportMultipleWindows(false);
        s.setTextZoom(100);
        s.setUserAgentString(s.getUserAgentString() + " ChroniquesAndroid/" + appVersion());
        CookieManager.getInstance().setAcceptCookie(true);
        web.addJavascriptInterface(new Bridge(), "ChroniquesAndroid");
        web.setWebViewClient(new Client());
        web.setWebChromeClient(new Chrome());
        web.setDownloadListener(new DownloadListener() {
            public void onDownloadStart(final String url, String ua, final String disposition, final String mime, long len) { downloadFromServer(url, disposition, mime); }
        });
        try { NotifyJob.schedule(this); } catch (Exception ignored) { }
        if (store.server() == null) web.loadUrl(START); else openServer(false);
    }

    String appVersion() {
        try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionName; } catch (Exception e) { return "?"; }
    }

    /** Vérifie la version du serveur, puis ouvre l'application (fichiers intégrés si les versions sont identiques). */
    void openServer(final boolean fresh) {
        final String server = store.server();
        if (server == null) { web.loadUrl(START); return; }
        new Thread(new Runnable() { public void run() {
            String v = null;
            try { v = new JSONObject(Poller.get(server + "/api/status", null, 5000)).optString("version", null); } catch (Exception ignored) { }
            if (v != null) store.setServerVersion(v);
            final String known = v != null ? v : store.serverVersion();
            final boolean online = v != null;
            runOnUiThread(new Runnable() { public void run() {
                useBundle = !bundle.version.isEmpty() && bundle.version.equals(known);
                if (!online && !useBundle) { offlinePage(server); return; }
                web.loadUrl(server + "/");
                if (online && !bundle.version.isEmpty() && !bundle.version.equals(known)) versionNotice(known);
            } });
        } }).start();
        askNotificationPermission();
    }

    void offlinePage(String server) {
        try { web.loadUrl("file:///android_asset/start/hors-ligne.html?serveur=" + URLEncoder.encode(server, "UTF-8")); } catch (Exception e) { web.loadUrl(START); }
    }

    /** Le serveur a une autre version que l'application : l'interface du serveur est utilisée ; on propose la mise à jour. */
    void versionNotice(final String serverVersion) {
        if (serverVersion.equals(store.dismissedVersion()) || compare(serverVersion, bundle.version) <= 0) return;
        new AlertDialog.Builder(this).setTitle(Compat.t("Nouvelle version disponible", "New version available"))
            .setMessage(Compat.t("Le serveur de votre MJ utilise Chroniques " + serverVersion + " (application : " + bundle.version + "). Tout fonctionne déjà avec l'interface du serveur. Mettez l'application à jour pour retrouver le démarrage rapide et le mode hors connexion : Android vous demandera de confirmer l'installation.", "Your GM’s server runs Chroniques " + serverVersion + " (app: " + bundle.version + "). Everything already works with the server’s interface. Update the app to get the quick start and offline mode back: Android will ask you to confirm the installation."))
            .setPositiveButton(Compat.t("Mettre à jour", "Update"), new android.content.DialogInterface.OnClickListener() { public void onClick(android.content.DialogInterface d, int w) { updateApp(); } })
            .setNegativeButton(Compat.t("Plus tard", "Later"), new android.content.DialogInterface.OnClickListener() { public void onClick(android.content.DialogInterface d, int w) { store.setDismissedVersion(serverVersion); } })
            .show();
    }

    /** Télécharge la version de l'application fournie par le serveur du MJ et ouvre l'installateur d'Android.
     *  Android vérifie que la nouvelle version est signée avec la même clé avant de l'installer. */
    void updateApp() {
        final String server = store.server();
        if (server == null) return;
        if (Build.VERSION.SDK_INT >= 26) {
            boolean allowed = true;
            try { allowed = (Boolean) getPackageManager().getClass().getMethod("canRequestPackageInstalls").invoke(getPackageManager()); } catch (Exception ignored) { }
            if (!allowed) {
                toast(Compat.t("Autorisez Chroniques à installer des applications, puis revenez et touchez à nouveau « Mettre à jour ».", "Allow Chroniques to install apps, then come back and tap “Update” again."));
                try { startActivity(new Intent("android.settings.MANAGE_UNKNOWN_APP_SOURCES", Uri.parse("package:" + getPackageName()))); } catch (Exception ignored) { }
                return;
            }
        }
        toast(Compat.t("Téléchargement de la nouvelle version…", "Downloading the new version…"));
        new Thread(new Runnable() { public void run() {
            try {
                java.net.HttpURLConnection con = (java.net.HttpURLConnection) new java.net.URL(server + "/android/chroniques.apk").openConnection();
                con.setConnectTimeout(10000); con.setReadTimeout(60000);
                if (con.getResponseCode() != 200) throw new Exception("HTTP " + con.getResponseCode());
                java.io.File f = ApkProvider.file(MainActivity.this);
                java.io.InputStream in = con.getInputStream(); java.io.FileOutputStream out = new java.io.FileOutputStream(f);
                byte[] b = new byte[65536]; int n; long total = 0;
                while ((n = in.read(b)) > 0) { out.write(b, 0, n); total += n; if (total > 80_000_000L) throw new Exception("trop gros"); }
                in.close(); out.close();
                runOnUiThread(new Runnable() { public void run() {
                    Intent i = new Intent(Intent.ACTION_VIEW).setDataAndType(ApkProvider.uri(), "application/vnd.android.package-archive")
                        .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                    try { startActivity(i); } catch (Exception e) { external(server + "/android/chroniques.apk"); }
                } });
            } catch (Exception e) { toast(Compat.t("Téléchargement impossible : réessayez, ou ouvrez " + server + "/android dans le navigateur.", "Download failed: try again, or open " + server + "/android in the browser.")); }
        } }).start();
    }

    static int compare(String a, String b) {
        String[] x = a.split("\\."), y = b.split("\\.");
        for (int i = 0; i < Math.max(x.length, y.length); i++) {
            int p = i < x.length ? parse(x[i]) : 0, q = i < y.length ? parse(y[i]) : 0;
            if (p != q) return p < q ? -1 : 1;
        }
        return 0;
    }
    static int parse(String s) { try { return Integer.parseInt(s.replaceAll("\\D", "")); } catch (Exception e) { return 0; } }

    void askNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED)
            requestPermissions(new String[]{ "android.permission.POST_NOTIFICATIONS" }, 9);
    }

    void external(String url) {
        try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (ActivityNotFoundException ignored) { }
    }

    boolean sameServer(Uri u) {
        String server = store.server();
        if (server == null || u == null) return false;
        Uri s = Uri.parse(server);
        return u.getScheme() != null && u.getScheme().equalsIgnoreCase(s.getScheme())
            && u.getHost() != null && u.getHost().equalsIgnoreCase(s.getHost()) && u.getPort() == s.getPort();
    }

    final class Client extends WebViewClient {
        @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
            // Chargement de la page principale : on revérifie la version du serveur (mise à jour du MJ pendant la partie).
            if (r.isForMainFrame() && "GET".equals(r.getMethod()) && sameServer(r.getUrl())) {
                try {
                    String sv = new JSONObject(Poller.get(store.server() + "/api/status", null, 3000)).optString("version", "");
                    if (!sv.isEmpty()) { store.setServerVersion(sv); useBundle = !bundle.version.isEmpty() && bundle.version.equals(sv); }
                } catch (Exception ignored) { /* hors connexion : on garde la dernière décision */ }
            }
            if (useBundle && "GET".equals(r.getMethod()) && sameServer(r.getUrl())) {
                String p = r.getUrl().getPath();
                if (p != null && !p.startsWith("/api/")) { WebResourceResponse res = bundle.serve(r.getUrl()); if (res != null) return res; }
            }
            return null;
        }
        @SuppressWarnings("deprecation")
        @Override public boolean shouldOverrideUrlLoading(WebView v, String url) {
            Uri u = Uri.parse(url);
            if (sameServer(u) || "file".equals(u.getScheme())) return false;
            external(u.toString());
            return true;
        }
        @Override public void onPageFinished(WebView v, String url) {
            if (url != null && !url.startsWith("file:")) v.evaluateJavascript(SHIM, null);
        }
        @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
            if (r.isForMainFrame() && store.server() != null && sameServer(r.getUrl())) offlinePage(store.server());
        }
    }

    final class Chrome extends WebChromeClient {
        @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams params) {
            if (fileCallback != null) fileCallback.onReceiveValue(null);
            fileCallback = cb;
            try { startActivityForResult(params.createIntent(), REQ_FILE); }
            catch (Exception e) { fileCallback = null; return false; }
            return true;
        }
    }

    /** Fichier proposé par le serveur (sauvegarde, export) : téléchargé avec la session puis enregistré où l'on veut. */
    void downloadFromServer(final String url, final String disposition, final String mime) {
        new Thread(new Runnable() { public void run() {
            try {
                java.net.HttpURLConnection con = (java.net.HttpURLConnection) new java.net.URL(url).openConnection();
                String cookie = CookieManager.getInstance().getCookie(url);
                if (cookie != null) con.setRequestProperty("Cookie", cookie);
                java.io.InputStream in = con.getInputStream();
                java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
                byte[] b = new byte[16384]; int n;
                while ((n = in.read(b)) > 0) { out.write(b, 0, n); if (out.size() > 60_000_000) break; }
                in.close();
                String name = android.webkit.URLUtil.guessFileName(url, disposition, mime);
                final byte[] bytes = out.toByteArray(); final String fname = name; final String type = mime == null ? "application/octet-stream" : mime;
                runOnUiThread(new Runnable() { public void run() { saveAs(fname, type, bytes); } });
            } catch (Exception e) { toast(Compat.t("Téléchargement impossible.", "Download failed.")); }
        } }).start();
    }

    void saveAs(String name, String mime, byte[] bytes) {
        pendingBytes = bytes;
        String type = mime == null || mime.isEmpty() ? "application/octet-stream" : mime.split(";")[0].trim();
        Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(type).putExtra(Intent.EXTRA_TITLE, name);
        try { startActivityForResult(i, REQ_SAVE); } catch (Exception e) { pendingBytes = null; toast(Compat.t("Aucune application pour enregistrer le fichier.", "No app available to save the file.")); }
    }

    void toast(final String msg) {
        runOnUiThread(new Runnable() { public void run() { android.widget.Toast.makeText(MainActivity.this, msg, android.widget.Toast.LENGTH_LONG).show(); } });
    }

    @Override protected void onActivityResult(int req, int result, Intent data) {
        if (req == REQ_FILE) {
            if (fileCallback != null) fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, data));
            fileCallback = null;
        } else if (req == REQ_SAVE) {
            if (result == RESULT_OK && data != null && data.getData() != null && pendingBytes != null) {
                try { OutputStream o = getContentResolver().openOutputStream(data.getData()); o.write(pendingBytes); o.close(); toast(Compat.t("Fichier enregistré.", "File saved.")); }
                catch (Exception e) { toast(Compat.t("Enregistrement impossible.", "Could not save.")); }
            }
            pendingBytes = null;
        } else super.onActivityResult(req, result, data);
    }

    void print(final String title) {
        PrintManager pm = (PrintManager) getSystemService(Context.PRINT_SERVICE);
        final PrintDocumentAdapter inner = web.createPrintDocumentAdapter(title);
        pm.print(title, new PrintDocumentAdapter() {
            @Override public void onStart() { inner.onStart(); }
            @Override public void onLayout(PrintAttributes o, PrintAttributes n, CancellationSignal c, LayoutResultCallback cb, android.os.Bundle e) { inner.onLayout(o, n, c, cb, e); }
            @Override public void onWrite(PageRange[] p, ParcelFileDescriptor d, CancellationSignal c, WriteResultCallback cb) { inner.onWrite(p, d, c, cb); }
            @Override public void onFinish() { inner.onFinish(); web.evaluateJavascript("window.dispatchEvent(new Event('afterprint'))", null); }
        }, null);
    }

    /** Fonctions offertes à la page (objet window.ChroniquesAndroid). */
    final class Bridge {
        @JavascriptInterface public String info() {
            try { return new JSONObject().put("version", appVersion()).put("bundle", bundle.version).put("server", store.server()).put("notify", store.notifyOn()).put("live", store.live()).put("known", store.known()).put("lang", Compat.t("fr", "en")).toString(); }
            catch (Exception e) { return "{}"; }
        }
        @JavascriptInterface public String connect(String raw) {
            String url = normalize(raw);
            if (url == null) return Compat.t("Adresse invalide. Exemple : https://chroniques.exemple.fr", "Invalid address. Example: https://chroniques.example.com");
            try {
                JSONObject st = new JSONObject(Poller.get(url + "/api/status", null, 6000));
                if (!st.has("version")) return Compat.t("Ce serveur ne semble pas être un serveur Chroniques.", "This server does not seem to be a Chroniques server.");
                store.setServer(url); store.setServerVersion(st.optString("version"));
                runOnUiThread(new Runnable() { public void run() { openServer(true); } });
                return "";
            } catch (Exception e) {
                return Compat.t("Serveur injoignable à cette adresse. Vérifiez l'adresse (celle du site, en https), votre connexion Internet, et que le PC du MJ est allumé avec Chroniques lancé.", "Server unreachable at this address. Check the address (the website’s, in https), your Internet connection, and that the GM’s PC is on with Chroniques running.");
            }
        }
        @JavascriptInterface public void open(String url) { store.setServer(url); runOnUiThread(new Runnable() { public void run() { openServer(true); } }); }
        @JavascriptInterface public void forget(String url) { store.removeKnown(url); }
        @JavascriptInterface public void changeServer() { runOnUiThread(new Runnable() { public void run() { TableService.stop(MainActivity.this); web.loadUrl(START); } }); }
        @JavascriptInterface public void retry() { runOnUiThread(new Runnable() { public void run() { openServer(false); } }); }
        @JavascriptInterface public void setNotify(boolean b) { store.setNotify(b); }
        @JavascriptInterface public void setLang(String l) { if ("fr".equals(l) || "en".equals(l)) { Compat.lang = l; store.setLang(l); } }
        @JavascriptInterface public void setLive(boolean b) { store.setLive(b); }
        @JavascriptInterface public void gameState(boolean combat) { gameActive = combat; }
        @JavascriptInterface public void openExternal(String url) { if (url != null && url.matches("^https?://.*")) external(url); }
        @JavascriptInterface public void print(final String title) { runOnUiThread(new Runnable() { public void run() { MainActivity.this.print(title); } }); }
        @JavascriptInterface public void saveFile(final String name, final String mime, String base64) {
            final byte[] bytes;
            try { bytes = Base64.decode(base64, Base64.DEFAULT); } catch (Exception e) { toast(Compat.t("Fichier illisible.", "Unreadable file.")); return; }
            runOnUiThread(new Runnable() { public void run() { saveAs(name, mime, bytes); } });
        }
        @JavascriptInterface public void updateApp() { runOnUiThread(new Runnable() { public void run() { MainActivity.this.updateApp(); } }); }
        @JavascriptInterface public void testNotification() { Poller.show(MainActivity.this, "Chroniques", Compat.t("Les notifications fonctionnent sur ce téléphone.", "Notifications work on this phone."), "essai"); }
    }

    static String normalize(String raw) {
        if (raw == null) return null;
        String u = raw.trim().replaceAll("/+$", "");
        if (u.isEmpty() || u.contains(" ")) return null;
        if (!u.matches("^https?://.*")) u = "http://" + u;
        Uri p = Uri.parse(u);
        if (p.getHost() == null || p.getHost().isEmpty()) return null;
        return p.getScheme() + "://" + p.getHost() + (p.getPort() > 0 ? ":" + p.getPort() : "");
    }

    @Override public void onBackPressed() {
        web.evaluateJavascript("(function(){var m=document.querySelector('.modal-backdrop [data-task=close-modal]');if(m){m.click();return 'modal';}return '';})()", new ValueCallback<String>() {
            public void onReceiveValue(String v) {
                if (v != null && v.contains("modal")) return;
                if (web.canGoBack()) web.goBack(); else moveTaskToBack(true);
            }
        });
    }

    @Override protected void onResume() { super.onResume(); web.onResume(); TableService.stop(this); }
    @Override protected void onPause() {
        if (!isFinishing() && gameActive && store.live() && store.server() != null) TableService.start(this);
        web.onPause(); super.onPause();
    }
    @Override protected void onDestroy() { if (web != null) web.destroy(); super.onDestroy(); }
}

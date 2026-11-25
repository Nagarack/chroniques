package app.chroniques;

import android.content.Context;
import android.net.Uri;
import android.webkit.WebResourceResponse;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;

/** L'interface complète de Chroniques est livrée dans l'application (dossier assets/app).
 *  Quand le serveur du MJ a la même version, ces fichiers sont servis directement depuis le téléphone :
 *  démarrage immédiat, moins de données, et l'interface reste disponible hors connexion.
 *  Si le serveur a une autre version, c'est l'interface du serveur qui est utilisée (toujours compatible). */
final class Bundle {
    final String version;
    private final Map<String, String[]> files = new HashMap<>();
    private final Context ctx;

    Bundle(Context c) {
        ctx = c;
        String v = "";
        try {
            JSONObject j = new JSONObject(read(c.getAssets().open("app/files.json")));
            v = j.optString("version", "");
            JSONObject f = j.getJSONObject("files");
            JSONArray names = f.names();
            for (int i = 0; names != null && i < names.length(); i++) {
                String k = names.getString(i); JSONArray x = f.getJSONArray(k);
                files.put(k, new String[]{ x.getString(0), x.getString(1) });
            }
        } catch (Exception ignored) { }
        version = v;
    }

    static String read(InputStream in) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream(); byte[] b = new byte[16384]; int n;
        while ((n = in.read(b)) > 0) out.write(b, 0, n);
        in.close(); return out.toString("UTF-8");
    }

    WebResourceResponse serve(Uri uri) {
        String path = uri.getPath();
        if (path == null || path.isEmpty()) path = "/";
        String[] f = files.get(path);
        if (f == null) return null;
        try {
            Map<String, String> h = new HashMap<>();
            h.put("Cache-Control", "no-store");
            String mime = f[1], enc = null;
            int semi = mime.indexOf(';');
            if (semi > 0) { enc = "utf-8"; mime = mime.substring(0, semi).trim(); }
            return new WebResourceResponse(mime, enc, 200, "OK", h, ctx.getAssets().open("app/" + f[0]));
        } catch (Exception e) { return null; }
    }
}

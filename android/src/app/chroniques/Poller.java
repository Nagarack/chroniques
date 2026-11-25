package app.chroniques;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.webkit.CookieManager;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import org.json.JSONArray;
import org.json.JSONObject;

/** Récupère les notifications en attente sur le serveur (rappel de séance, « À vous de jouer ! »). */
final class Poller {
    static final int OK = 200, NO_SERVER = 0, LOGGED_OUT = 401, OFFLINE = -1;

    static String get(String url, String cookie, int timeout) throws Exception {
        HttpURLConnection con = (HttpURLConnection) new URL(url).openConnection();
        con.setConnectTimeout(timeout); con.setReadTimeout(timeout);
        con.setRequestProperty("Accept", "application/json");
        if (cookie != null) con.setRequestProperty("Cookie", cookie);
        int code = con.getResponseCode();
        if (code != 200) { con.disconnect(); throw new HttpError(code); }
        InputStream in = con.getInputStream();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[8192]; int n;
        while ((n = in.read(buf)) > 0) { out.write(buf, 0, n); if (out.size() > 2_000_000) break; }
        in.close(); con.disconnect();
        return out.toString("UTF-8");
    }

    static final class HttpError extends Exception { final int code; HttpError(int c) { super("HTTP " + c); code = c; } }

    static int poll(Context c) {
        Store s = new Store(c); if (Compat.lang == null && s.lang() != null) Compat.lang = s.lang();
        String server = s.server();
        if (server == null) return NO_SERVER;
        String cookie;
        try { cookie = CookieManager.getInstance().getCookie(server); } catch (Exception e) { cookie = null; }
        if (cookie == null || !cookie.contains("chroniques_sid")) return LOGGED_OUT;
        try {
            String after = s.lastPoll();
            JSONObject r = new JSONObject(get(server + "/api/notify/poll?after=" + URLEncoder.encode(after, "UTF-8"), cookie, 12000));
            String now = r.optString("now", "");
            // Premier passage : on ne rejoue pas les anciens messages.
            if (!after.isEmpty() && s.notifyOn()) {
                JSONArray list = r.optJSONArray("messages");
                for (int i = 0; list != null && i < list.length(); i++) {
                    JSONObject m = list.getJSONObject(i);
                    show(c, m.optString("title", "Chroniques"), m.optString("body", ""), m.optString("tag", m.optString("id")));
                }
            }
            if (!now.isEmpty()) s.setLastPoll(now);
            return OK;
        } catch (HttpError e) {
            return e.code == 401 ? LOGGED_OUT : OFFLINE;
        } catch (Exception e) {
            return OFFLINE;
        }
    }

    @SuppressWarnings("deprecation")
    static void show(Context c, String title, String body, String tag) {
        Compat.channels(c);
        Intent open = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(c, 1, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Compat.builder(c, Compat.CHANNEL)
            .setSmallIcon(R.drawable.ic_stat).setContentTitle(title).setContentText(body)
            .setStyle(new Notification.BigTextStyle().bigText(body))
            .setAutoCancel(true).setContentIntent(pi)
            .setPriority(Notification.PRIORITY_HIGH).setDefaults(Notification.DEFAULT_ALL);
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        nm.notify(tag == null ? 0 : tag.hashCode(), b.build());
    }
}

package app.chroniques;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;

/** Réglages de l'application : serveur choisi, serveurs connus, notifications. */
final class Store {
    private final SharedPreferences p;
    Store(Context c) { p = c.getSharedPreferences("chroniques", Context.MODE_PRIVATE); }

    String server() { return p.getString("server", null); }
    void setServer(String url) { p.edit().putString("server", url).putString("lastPoll", "").apply(); addKnown(url); }
    void clearServer() { p.edit().remove("server").apply(); }

    JSONArray known() { try { return new JSONArray(p.getString("known", "[]")); } catch (Exception e) { return new JSONArray(); } }
    void addKnown(String url) {
        JSONArray a = known(), out = new JSONArray();
        out.put(url);
        for (int i = 0; i < a.length() && out.length() < 8; i++) { String u = a.optString(i); if (!u.equals(url)) out.put(u); }
        p.edit().putString("known", out.toString()).apply();
    }
    void removeKnown(String url) {
        JSONArray a = known(), out = new JSONArray();
        for (int i = 0; i < a.length(); i++) { String u = a.optString(i); if (!u.equals(url)) out.put(u); }
        p.edit().putString("known", out.toString()).apply();
        if (url.equals(server())) clearServer();
    }

    String serverVersion() { return p.getString("serverVersion", ""); }
    void setServerVersion(String v) { p.edit().putString("serverVersion", v).apply(); }
    String lastPoll() { return p.getString("lastPoll", ""); }
    void setLastPoll(String v) { p.edit().putString("lastPoll", v).apply(); }
    boolean notifyOn() { return p.getBoolean("notify", true); }
    void setNotify(boolean b) { p.edit().putBoolean("notify", b).apply(); }
    boolean live() { return p.getBoolean("live", true); }
    void setLive(boolean b) { p.edit().putBoolean("live", b).apply(); }
    String dismissedVersion() { return p.getString("dismissed", ""); }
    void setDismissedVersion(String v) { p.edit().putString("dismissed", v).apply(); }
}

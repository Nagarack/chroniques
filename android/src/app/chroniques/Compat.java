package app.chroniques;

import android.app.Notification;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/** Appels aux API Android récentes (8.0+) par réflexion : l'application est compilée avec l'API 23. */
final class Compat {
    static final String CHANNEL = "partie";
    static final String CHANNEL_LIVE = "partie-en-cours";
    /** 5.2 : langue des textes de l'application (choix fait dans le site, sinon langue du téléphone). */
    static String lang = null;
    static String t(String fr, String en) { String l = lang != null ? lang : java.util.Locale.getDefault().getLanguage(); return "fr".equals(l) ? fr : en; }

    static void channels(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        try {
            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            Class<?> cls = Class.forName("android.app.NotificationChannel");
            Object a = cls.getConstructor(String.class, CharSequence.class, int.class).newInstance(CHANNEL, Compat.t("Rappels et tours de jeu", "Reminders and turns"), 4);
            cls.getMethod("setDescription", String.class).invoke(a, Compat.t("Rappel de séance, « À vous de jouer ! »", "Session reminder, “Your turn!”"));
            Object b = cls.getConstructor(String.class, CharSequence.class, int.class).newInstance(CHANNEL_LIVE, Compat.t("Partie en cours", "Game in progress"), 2);
            cls.getMethod("setDescription", String.class).invoke(b, Compat.t("Indique que Chroniques reste à l'écoute pendant un combat", "Shows that Chroniques keeps listening during a combat"));
            NotificationManager.class.getMethod("createNotificationChannel", cls).invoke(nm, a);
            NotificationManager.class.getMethod("createNotificationChannel", cls).invoke(nm, b);
        } catch (Exception ignored) { }
    }

    @SuppressWarnings("deprecation")
    static Notification.Builder builder(Context c, String channel) {
        if (Build.VERSION.SDK_INT >= 26) {
            try { return Notification.Builder.class.getConstructor(Context.class, String.class).newInstance(c, channel); }
            catch (Exception ignored) { }
        }
        return new Notification.Builder(c);
    }

    static void startForeground(Context c, Intent i) {
        try {
            if (Build.VERSION.SDK_INT >= 26) Context.class.getMethod("startForegroundService", Intent.class).invoke(c, i);
            else c.startService(i);
        } catch (Exception ignored) { }
    }
}

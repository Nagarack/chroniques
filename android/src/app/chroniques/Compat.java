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

    static void channels(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        try {
            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            Class<?> cls = Class.forName("android.app.NotificationChannel");
            Object a = cls.getConstructor(String.class, CharSequence.class, int.class).newInstance(CHANNEL, "Rappels et tours de jeu", 4);
            cls.getMethod("setDescription", String.class).invoke(a, "Rappel de séance, « À vous de jouer ! »");
            Object b = cls.getConstructor(String.class, CharSequence.class, int.class).newInstance(CHANNEL_LIVE, "Partie en cours", 2);
            cls.getMethod("setDescription", String.class).invoke(b, "Indique que Chroniques reste à l'écoute pendant un combat");
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

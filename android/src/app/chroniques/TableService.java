package app.chroniques;

import android.app.Notification;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

/** « Partie en cours » : pendant un combat, si l'application passe en arrière-plan, elle reste à l'écoute
 *  (vérification toutes les 15 secondes) pour prévenir le joueur quand c'est son tour. S'arrête seule après 4 heures,
 *  au retour dans l'application, ou avec le bouton « Arrêter » de la notification. */
public class TableService extends Service {
    static final String STOP = "app.chroniques.STOP";
    private static final long EVERY = 15000L, MAX = 4L * 3600 * 1000;
    private Handler handler;
    private long started;
    private volatile boolean running;

    static void start(Context c) { Compat.startForeground(c, new Intent(c, TableService.class)); }
    static void stop(Context c) { c.stopService(new Intent(c, TableService.class)); }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && STOP.equals(intent.getAction())) { stopSelf(); return START_NOT_STICKY; }
        Compat.channels(this);
        Intent open = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(this, 2, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        PendingIntent stop = PendingIntent.getService(this, 3, new Intent(this, TableService.class).setAction(STOP), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        @SuppressWarnings("deprecation")
        Notification n = Compat.builder(this, Compat.CHANNEL_LIVE)
            .setSmallIcon(R.drawable.ic_stat).setContentTitle("Partie en cours")
            .setContentText("Chroniques vous préviendra quand ce sera votre tour.")
            .setContentIntent(pi).setOngoing(true)
            .addAction(new Notification.Action.Builder(0, "Arrêter", stop).build())
            .build();
        startForeground(7, n);
        if (!running) {
            running = true; started = System.currentTimeMillis();
            handler = new Handler(Looper.getMainLooper());
            handler.post(tick);
        }
        return START_NOT_STICKY;
    }

    private final Runnable tick = new Runnable() { public void run() {
        if (!running) return;
        if (System.currentTimeMillis() - started > MAX) { stopSelf(); return; }
        new Thread(new Runnable() { public void run() {
            int r = Poller.poll(getApplicationContext());
            if (r == Poller.LOGGED_OUT || r == Poller.NO_SERVER) stopSelf();
        } }).start();
        handler.postDelayed(this, EVERY);
    } };

    @Override public void onDestroy() { running = false; if (handler != null) handler.removeCallbacks(tick); super.onDestroy(); }
    @Override public IBinder onBind(Intent intent) { return null; }
}

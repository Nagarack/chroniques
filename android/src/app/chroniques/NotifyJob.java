package app.chroniques;

import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.app.job.JobService;
import android.content.ComponentName;
import android.content.Context;

/** Vérification périodique (environ toutes les 15 minutes, quand Android le permet) des rappels de séance. */
public class NotifyJob extends JobService {
    static final int ID = 4242;

    static void schedule(Context c) {
        JobScheduler js = (JobScheduler) c.getSystemService(Context.JOB_SCHEDULER_SERVICE);
        if (js == null) return;
        for (JobInfo j : js.getAllPendingJobs()) if (j.getId() == ID) return;
        js.schedule(new JobInfo.Builder(ID, new ComponentName(c, NotifyJob.class))
            .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
            .setPeriodic(15 * 60 * 1000L)
            .setPersisted(true)
            .build());
    }

    @Override public boolean onStartJob(final JobParameters params) {
        new Thread(new Runnable() { public void run() {
            Poller.poll(getApplicationContext());
            jobFinished(params, false);
        } }).start();
        return true;
    }

    @Override public boolean onStopJob(JobParameters params) { return true; }
}

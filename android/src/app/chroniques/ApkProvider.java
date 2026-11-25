package app.chroniques;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import java.io.File;
import java.io.FileNotFoundException;

/** Donne à l'installateur d'Android (lecture seule, permission temporaire) la nouvelle version téléchargée. */
public class ApkProvider extends ContentProvider {
    static final String AUTHORITY = "app.chroniques.maj";
    static File file(android.content.Context c) { File d = new File(c.getCacheDir(), "maj"); d.mkdirs(); return new File(d, "chroniques.apk"); }
    static Uri uri() { return Uri.parse("content://" + AUTHORITY + "/chroniques.apk"); }

    @Override public boolean onCreate() { return true; }
    @Override public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        if (!"chroniques.apk".equals(uri.getLastPathSegment())) throw new FileNotFoundException();
        return ParcelFileDescriptor.open(file(getContext()), ParcelFileDescriptor.MODE_READ_ONLY);
    }
    @Override public String getType(Uri uri) { return "application/vnd.android.package-archive"; }
    @Override public Cursor query(Uri u, String[] p, String s, String[] a, String o) { return null; }
    @Override public Uri insert(Uri u, ContentValues v) { return null; }
    @Override public int delete(Uri u, String s, String[] a) { return 0; }
    @Override public int update(Uri u, ContentValues v, String s, String[] a) { return 0; }
}

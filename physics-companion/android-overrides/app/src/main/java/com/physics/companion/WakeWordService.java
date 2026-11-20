package com.physics.companion;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import java.io.IOException;
import org.vosk.LibVosk;
import org.vosk.LogLevel;
import org.vosk.Model;
import org.vosk.Recognizer;
import org.vosk.android.RecognitionListener;
import org.vosk.android.SpeechService;
import org.vosk.android.StorageService;

public class WakeWordService extends Service implements RecognitionListener {
    private static final String TAG = "PhysicsWakeService";
    private static final String CHANNEL_ID = "physics_wake_channel";
    private static final int NOTIF_ID = 7071;

    public static final String ACTION_START = "com.physics.companion.WAKE_START";
    public static final String ACTION_PAUSE = "com.physics.companion.WAKE_PAUSE";
    public static final String ACTION_RESUME = "com.physics.companion.WAKE_RESUME";
    public static final String ACTION_STOP = "com.physics.companion.WAKE_STOP";

    private Model model;
    private SpeechService speechService;
    private boolean isPaused = false;
    private boolean wakeTriggered = false;

    @Override
    public void onCreate() {
        super.onCreate();
        LibVosk.setLogLevel(LogLevel.WARNINGS);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : ACTION_START;
        if (ACTION_STOP.equals(action)) {
            stopListening();
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }
        if (ACTION_PAUSE.equals(action)) {
            isPaused = true;
            stopListening();
            return START_STICKY;
        }
        startAsForeground();
        isPaused = false;
        wakeTriggered = false;
        if (model == null) {
            StorageService.unpack(this, "model-en-us", "model",
                (loadedModel) -> { this.model = loadedModel; if (!isPaused) startListening(); },
                (ex) -> Log.e(TAG, "Vosk unpack error: " + ex.getMessage()));
        } else {
            startListening();
        }
        return START_STICKY;
    }

    private void startAsForeground() {
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm != null) {
            nm.createNotificationChannel(new NotificationChannel(CHANNEL_ID, "Physics Voice Listener", NotificationManager.IMPORTANCE_LOW));
        }
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(this, 0, openIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification n = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Physics is listening")
            .setContentText("Say \"Hey Physics\" anytime")
            .setSmallIcon(getApplicationInfo().icon)
            .setOngoing(true)
            .setContentIntent(pi)
            .build();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
        } else {
            startForeground(NOTIF_ID, n);
        }
    }

    private void startListening() {
        if (model == null || speechService != null || isPaused) return;
        try {
            String grammar = "[\"hey physics\", \"physics\", \"ok physics\", \"[unk]\"]";
            Recognizer rec = new Recognizer(model, 16000.0f, grammar);
            speechService = new SpeechService(rec, 16000.0f);
            speechService.startListening(this);
        } catch (IOException e) {
            Log.e(TAG, "Vosk startListening failed: " + e.getMessage());
        }
    }

    private void stopListening() {
        if (speechService != null) {
            speechService.stop();
            speechService.shutdown();
            speechService = null;
        }
    }

    private void checkHypothesis(String hypothesis) {
        if (wakeTriggered || hypothesis == null) return;
        if (hypothesis.toLowerCase().contains("physics")) {
            wakeTriggered = true;
            stopListening();
            Intent launch = new Intent(this, MainActivity.class);
            launch.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            launch.putExtra("physics_wake_triggered", true);
            startActivity(launch);
        }
    }

    @Override public void onPartialResult(String h) { checkHypothesis(h); }
    @Override public void onResult(String h) { checkHypothesis(h); }
    @Override public void onFinalResult(String h) { checkHypothesis(h); }
    @Override public void onError(Exception e) { Log.e(TAG, "Vosk error: " + e.getMessage()); }
    @Override public void onTimeout() { stopListening(); if (!isPaused) startListening(); }
    @Override public void onDestroy() { stopListening(); super.onDestroy(); }
    @Override public IBinder onBind(Intent intent) { return null; }
}
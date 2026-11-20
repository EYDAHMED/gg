package com.physics.companion;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.hardware.camera2.CameraManager;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.provider.AlarmClock;
import android.provider.ContactsContract;
import android.provider.Settings;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CapacitorPlugin(name = "PhoneControl")
public class PhoneControlPlugin extends Plugin {
    private static PhoneControlPlugin activeInstance;
    private static boolean pendingWakeTrigger = false;

    @Override
    public void load() {
        activeInstance = this;
        if (pendingWakeTrigger) {
            pendingWakeTrigger = false;
            notifyListeners("wakeTriggered", new JSObject(), true);
        }
    }

    public static void notifyWakeWordTriggered() {
        if (activeInstance != null) {
            activeInstance.notifyListeners("wakeTriggered", new JSObject(), true);
        } else {
            pendingWakeTrigger = true;
        }
    }

    @PluginMethod
    public void requestAllPermissions(PluginCall call) {
        List<String> perms = new ArrayList<>();
        perms.add(Manifest.permission.RECORD_AUDIO);
        perms.add(Manifest.permission.CALL_PHONE);
        perms.add(Manifest.permission.READ_CONTACTS);
        perms.add(Manifest.permission.CAMERA);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            perms.add(Manifest.permission.POST_NOTIFICATIONS);
        }
        ActivityCompat.requestPermissions(getActivity(), perms.toArray(new String[0]), 9001);
        call.resolve();
    }

    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(getContext())) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        JSObject ret = new JSObject();
        ret.put("canDrawOverlays", Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(getContext()));
        call.resolve(ret);
    }

    @PluginMethod
    public void startWakeService(PluginCall call) {
        Intent intent = new Intent(getContext(), WakeWordService.class);
        intent.setAction(WakeWordService.ACTION_START);
        ContextCompat.startForegroundService(getContext(), intent);
        call.resolve();
    }

    @PluginMethod
    public void pauseWakeService(PluginCall call) {
        Intent intent = new Intent(getContext(), WakeWordService.class);
        intent.setAction(WakeWordService.ACTION_PAUSE);
        getContext().startService(intent);
        call.resolve();
    }

    @PluginMethod
    public void resumeWakeService(PluginCall call) {
        Intent intent = new Intent(getContext(), WakeWordService.class);
        intent.setAction(WakeWordService.ACTION_RESUME);
        ContextCompat.startForegroundService(getContext(), intent);
        call.resolve();
    }

    @PluginMethod
    public void stopWakeService(PluginCall call) {
        Intent intent = new Intent(getContext(), WakeWordService.class);
        intent.setAction(WakeWordService.ACTION_STOP);
        getContext().startService(intent);
        call.resolve();
    }

    @PluginMethod
    public void openApp(PluginCall call) {
        String rawName = call.getString("appName", "").trim().toLowerCase();
        if (rawName.isEmpty()) { call.reject("Missing appName"); return; }

        Map<String, String> aliases = new HashMap<>();
        aliases.put("ظˆط§طھط³ط§ط¨", "whatsapp");
        aliases.put("ظˆط§طھط³", "whatsapp");
        aliases.put("ظٹظˆطھظٹظˆط¨", "youtube");
        aliases.put("ظƒط§ظ…ظٹط±ط§", "camera");
        aliases.put("ط§ظ„ظƒط§ظ…ظٹط±ط§", "camera");
        aliases.put("ط§ط¹ط¯ط§ط¯ط§طھ", "settings");
        aliases.put("ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ", "settings");
        aliases.put("ظƒط±ظˆظ…", "chrome");
        aliases.put("ط§ظ†ط³طھط¬ط±ط§ظ…", "instagram");
        aliases.put("طھظ„ط¬ط±ط§ظ…", "telegram");
        aliases.put("ط®ط±ط§ط¦ط·", "maps");
        String target = aliases.getOrDefault(rawName, rawName);

        PackageManager pm = getContext().getPackageManager();
        for (ApplicationInfo app : pm.getInstalledApplications(PackageManager.GET_META_DATA)) {
            String label = pm.getApplicationLabel(app).toString().toLowerCase();
            if (label.contains(target) || app.packageName.toLowerCase().contains(target)) {
                Intent launch = pm.getLaunchIntentForPackage(app.packageName);
                if (launch != null) {
                    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(launch);
                    JSObject ret = new JSObject();
                    ret.put("opened", label);
                    call.resolve(ret);
                    return;
                }
            }
        }
        call.reject("App not found: " + rawName);
    }

    @PluginMethod
    public void setAlarm(PluginCall call) {
        Intent intent = new Intent(AlarmClock.ACTION_SET_ALARM)
            .putExtra(AlarmClock.EXTRA_HOUR, call.getInt("hour", 7))
            .putExtra(AlarmClock.EXTRA_MINUTES, call.getInt("minute", 0))
            .putExtra(AlarmClock.EXTRA_MESSAGE, call.getString("message", "Physics Alarm"))
            .putExtra(AlarmClock.EXTRA_SKIP_UI, true);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void toggleFlashlight(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", true);
        try {
            CameraManager cm = (CameraManager) getContext().getSystemService(Context.CAMERA_SERVICE);
            if (cm != null && cm.getCameraIdList().length > 0) {
                cm.setTorchMode(cm.getCameraIdList()[0], enabled);
                call.resolve();
                return;
            }
        } catch (Exception e) {
            call.reject("Flashlight error: " + e.getMessage());
            return;
        }
        call.reject("No camera flash available");
    }

    @PluginMethod
    public void setVolume(PluginCall call) {
        int levelPercent = Math.max(0, Math.min(100, call.getInt("level", 50)));
        AudioManager am = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        if (am != null) {
            int max = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
            am.setStreamVolume(AudioManager.STREAM_MUSIC, Math.round((levelPercent / 100f) * max), AudioManager.FLAG_SHOW_UI);
        }
        call.resolve();
    }

    @PluginMethod
    public void callPhone(PluginCall call) {
        String target = call.getString("target", "").trim();
        if (target.isEmpty()) { call.reject("Missing target"); return; }
        String phoneNumber = target.replaceAll("[^0-9+]", "");
        if (phoneNumber.length() < 3 && ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_CONTACTS) == PackageManager.PERMISSION_GRANTED) {
            phoneNumber = lookupContactPhone(target);
        }
        if (phoneNumber == null || phoneNumber.isEmpty()) { call.reject("Contact not found"); return; }
        boolean canCall = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.CALL_PHONE) == PackageManager.PERMISSION_GRANTED;
        Intent intent = new Intent(canCall ? Intent.ACTION_CALL : Intent.ACTION_DIAL, Uri.parse("tel:" + phoneNumber));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    private String lookupContactPhone(String nameQuery) {
        String lower = nameQuery.toLowerCase();
        Cursor cursor = getContext().getContentResolver().query(
            ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
            new String[]{ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME, ContactsContract.CommonDataKinds.Phone.NUMBER},
            null, null, null);
        if (cursor == null) return null;
        try {
            while (cursor.moveToNext()) {
                String name = cursor.getString(0);
                if (name != null && name.toLowerCase().contains(lower)) return cursor.getString(1);
            }
        } finally { cursor.close(); }
        return null;
    }

    @PluginMethod
    public void openSystemPanel(PluginCall call) {
        String panel = call.getString("panel", "wifi").toLowerCase();
        Intent intent;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && panel.contains("wifi")) {
            intent = new Intent(Settings.Panel.ACTION_WIFI);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && panel.contains("internet")) {
            intent = new Intent(Settings.Panel.ACTION_INTERNET_CONNECTIVITY);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && panel.contains("volume")) {
            intent = new Intent(Settings.Panel.ACTION_VOLUME);
        } else if (panel.contains("bluetooth")) {
            intent = new Intent(Settings.ACTION_BLUETOOTH_SETTINGS);
        } else {
            intent = new Intent(Settings.ACTION_SETTINGS);
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }
}
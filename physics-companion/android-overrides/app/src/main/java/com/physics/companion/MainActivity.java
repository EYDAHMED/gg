package com.physics.companion;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PhoneControlPlugin.class);
        super.onCreate(savedInstanceState);
        handleWakeIntent(getIntent());
    }
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleWakeIntent(intent);
    }
    private void handleWakeIntent(Intent intent) {
        if (intent == null) return;
        boolean wakeTriggered = intent.getBooleanExtra("physics_wake_triggered", false)
            || Intent.ACTION_ASSIST.equals(intent.getAction());
        if (wakeTriggered) {
            intent.removeExtra("physics_wake_triggered");
            PhoneControlPlugin.notifyWakeWordTriggered();
        }
    }
}
package de.z11.caveshuttle;

import android.os.Bundle;
import android.os.Build;
import android.view.View;
import android.view.WindowManager;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.WebView;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "CaveShuttleBridge";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Disable system haptic feedback on the WebView to prevent echo vibration
        // on long-press. Android's default touch haptic fires independently of
        // navigator.vibrate() and would produce an unwanted second pulse.
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().setHapticFeedbackEnabled(false);
            Log.d(TAG, "Disabled system haptic feedback on WebView");
        }

        // Enable fullscreen mode - hide both status bar and navigation bar
        hideSystemBars();
    }

    @Override
    public void onResume() {
        super.onResume();
        // Re-apply fullscreen mode on resume
        hideSystemBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            // Re-apply fullscreen mode when window gains focus
            hideSystemBars();
        }
    }

    private void hideSystemBars() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // For Android 11 (API 30) and above, use WindowInsetsController
            View decorView = getWindow().getDecorView();
            WindowInsetsController controller = decorView.getWindowInsetsController();
            if (controller != null) {
                // Hide system bars completely
                controller.hide(WindowInsets.Type.systemBars() | WindowInsets.Type.navigationBars());
                // Set immersive mode - never show bars
                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                Log.d(TAG, "Applied immersive mode using WindowInsetsController");
            }
        } else {
            // For older Android versions, use the legacy approach
            getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                    WindowManager.LayoutParams.FLAG_FULLSCREEN);

            View decorView = getWindow().getDecorView();
            int uiOptions = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_IMMERSIVE
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;
            decorView.setSystemUiVisibility(uiOptions);
            Log.d(TAG, "Applied immersive mode using legacy API");
        }
    }
}

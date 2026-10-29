package com.floww.app;

import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeGoogleAuthPlugin.class);
        super.onCreate(savedInstanceState);
        try {
            if (bridge != null && bridge.getWebView() != null) {
                WebView webView = bridge.getWebView();
                WebSettings settings = webView.getSettings();
                settings.setJavaScriptEnabled(true);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                settings.setSupportMultipleWindows(false);
                settings.setJavaScriptCanOpenWindowsAutomatically(true);

                // Performance & Responsiveness Enhancements
                settings.setCacheMode(WebSettings.LOAD_DEFAULT);
                settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
                webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
                webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
                settings.setOffscreenPreRaster(true);

                CookieManager cookieManager = CookieManager.getInstance();
                cookieManager.setAcceptCookie(true);
                cookieManager.setAcceptThirdPartyCookies(webView, true);
            }
        } catch (Exception ignored) {
        }
    }
}

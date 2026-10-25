package com.floww.app;

import android.app.Activity;
import android.accounts.AccountManager;
import android.content.Intent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.common.AccountPicker;
import java.util.Collections;

@CapacitorPlugin(name = "NativeGoogleAuth")
public class NativeGoogleAuthPlugin extends Plugin {

    @PluginMethod
    public void signIn(PluginCall call) {
        try {
            Intent intent = null;
            try {
                AccountPicker.AccountChooserOptions options = new AccountPicker.AccountChooserOptions.Builder()
                        .setAllowableAccountsTypes(Collections.singletonList("com.google"))
                        .setAlwaysShowAccountPicker(true)
                        .build();
                intent = AccountPicker.newChooseAccountIntent(options);
            } catch (Throwable t) {
                // Fallback to platform AccountManager
                intent = AccountManager.newChooseAccountIntent(
                        null,
                        null,
                        new String[]{"com.google"},
                        true,
                        null,
                        null,
                        null,
                        null
                );
            }

            if (intent != null) {
                startActivityForResult(call, intent, "handleAccountPickerResult");
            } else {
                call.reject("Unable to create Google account picker intent");
            }
        } catch (Exception e) {
            call.reject("Failed to open Google account picker: " + e.getMessage(), e);
        }
    }

    @ActivityCallback
    private void handleAccountPickerResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        try {
            int resultCode = result.getResultCode();
            Intent data = result.getData();

            if (resultCode == Activity.RESULT_OK && data != null) {
                String email = data.getStringExtra(AccountManager.KEY_ACCOUNT_NAME);
                if (email != null && !email.trim().isEmpty()) {
                    String cleanEmail = email.trim().toLowerCase();
                    String name = cleanEmail.split("@")[0];
                    if (data.hasExtra("account_display_name")) {
                        String extraName = data.getStringExtra("account_display_name");
                        if (extraName != null && !extraName.isEmpty()) {
                            name = extraName;
                        }
                    }

                    JSObject ret = new JSObject();
                    ret.put("email", cleanEmail);
                    ret.put("name", name);
                    ret.put("id", cleanEmail);
                    ret.put("imageUrl", "https://api.dicebear.com/7.x/initials/svg?seed=" + cleanEmail);
                    call.resolve(ret);
                    return;
                }
            }

            // User cancelled or pressed back
            call.reject("Cancelled by user", "CANCELLED");
        } catch (Exception e) {
            call.reject("Account selection error: " + e.getMessage(), e);
        }
    }
}

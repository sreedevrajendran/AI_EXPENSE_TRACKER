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
        getActivity().runOnUiThread(() -> {
            launchAccountPicker(call);
        });
    }

    private void launchAccountPicker(PluginCall call) {
        try {
            Intent intent = null;
            try {
                AccountPicker.AccountChooserOptions options = new AccountPicker.AccountChooserOptions.Builder()
                        .setAllowableAccountsTypes(Collections.singletonList("com.google"))
                        .setAlwaysShowAccountPicker(true)
                        .setTitleOverrideText("Choose Google Account")
                        .build();
                intent = AccountPicker.newChooseAccountIntent(options);
            } catch (Throwable t) {
                intent = AccountManager.newChooseAccountIntent(
                        null,
                        null,
                        new String[]{"com.google"},
                        true,
                        "Choose Google Account",
                        null,
                        null,
                        null
                );
            }

            if (intent != null) {
                startActivityForResult(call, intent, "handleAccountPickerResult");
            } else {
                call.reject("Unable to open Google account picker", "NO_PICKER");
            }
        } catch (Exception e) {
            call.reject("Account picker error: " + e.getMessage(), "ERROR", e);
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

            call.reject("Cancelled by user", "CANCELLED");
        } catch (Exception e) {
            call.reject("Account selection error: " + e.getMessage(), "ERROR", e);
        }
    }
}

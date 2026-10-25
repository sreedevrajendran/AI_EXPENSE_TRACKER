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
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.auth.api.signin.GoogleSignInStatusCodes;
import com.google.android.gms.common.AccountPicker;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;
import java.util.Collections;

@CapacitorPlugin(name = "NativeGoogleAuth")
public class NativeGoogleAuthPlugin extends Plugin {

    private GoogleSignInClient googleSignInClient;

    @PluginMethod
    public void signIn(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                // Initialize modern Google Sign-In with Material bottom sheet
                GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                        .requestEmail()
                        .requestProfile()
                        .build();

                googleSignInClient = GoogleSignIn.getClient(getActivity(), gso);

                // Sign out previous session so account picker always displays cleanly
                googleSignInClient.signOut().addOnCompleteListener(task -> {
                    try {
                        Intent signInIntent = googleSignInClient.getSignInIntent();
                        startActivityForResult(call, signInIntent, "handleModernGoogleSignInResult");
                    } catch (Exception e) {
                        launchAccountPicker(call);
                    }
                });
            } catch (Exception e) {
                launchAccountPicker(call);
            }
        });
    }

    @ActivityCallback
    private void handleModernGoogleSignInResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        try {
            int resultCode = result.getResultCode();
            if (resultCode == Activity.RESULT_CANCELED) {
                call.reject("Cancelled by user", "CANCELLED");
                return;
            }

            Intent data = result.getData();
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            GoogleSignInAccount account = task.getResult(ApiException.class);

            if (account != null && account.getEmail() != null) {
                String email = account.getEmail().trim().toLowerCase();
                String name = account.getDisplayName() != null && !account.getDisplayName().isEmpty()
                        ? account.getDisplayName()
                        : email.split("@")[0];
                String id = account.getId() != null ? account.getId() : email;
                String imageUrl = account.getPhotoUrl() != null
                        ? account.getPhotoUrl().toString()
                        : ("https://api.dicebear.com/7.x/initials/svg?seed=" + email);

                JSObject ret = new JSObject();
                ret.put("email", email);
                ret.put("name", name);
                ret.put("id", id);
                ret.put("imageUrl", imageUrl);
                call.resolve(ret);
                return;
            }
        } catch (ApiException e) {
            int statusCode = e.getStatusCode();
            if (statusCode == GoogleSignInStatusCodes.SIGN_IN_CANCELLED || statusCode == 12501 || statusCode == 16) {
                call.reject("Cancelled by user", "CANCELLED");
                return;
            }
            // If code 10 (DEVELOPER_ERROR) or other failure, fallback to AccountPicker
            launchAccountPicker(call);
            return;
        } catch (Exception e) {
            launchAccountPicker(call);
            return;
        }

        launchAccountPicker(call);
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
                call.reject("Unable to open Google account picker");
            }
        } catch (Exception e) {
            call.reject("Account picker error: " + e.getMessage(), e);
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
            call.reject("Account selection error: " + e.getMessage(), e);
        }
    }
}

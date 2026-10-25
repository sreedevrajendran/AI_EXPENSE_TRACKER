package com.floww.app;

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
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

@CapacitorPlugin(name = "NativeGoogleAuth")
public class NativeGoogleAuthPlugin extends Plugin {

    private GoogleSignInClient googleSignInClient;

    @PluginMethod
    public void signIn(PluginCall call) {
        try {
            // Standard DEFAULT_SIGN_IN requesting email & profile.
            // DO NOT request idToken as that requires SHA-1 fingerprint registration on Google Cloud Console
            // and causes ApiException 10 (Developer Error).
            GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestEmail()
                    .requestProfile()
                    .build();

            googleSignInClient = GoogleSignIn.getClient(getActivity(), gso);

            // Always sign out local Google client cache first so the system account picker ALWAYS shows
            googleSignInClient.signOut().addOnCompleteListener(getActivity(), task -> {
                try {
                    Intent signInIntent = googleSignInClient.getSignInIntent();
                    startActivityForResult(call, signInIntent, "handleSignInResult");
                } catch (Exception e) {
                    call.reject("Could not launch account chooser: " + e.getMessage(), e);
                }
            });

        } catch (Exception e) {
            call.reject("Failed to initialize Google Sign In: " + e.getMessage(), e);
        }
    }

    @ActivityCallback
    private void handleSignInResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        try {
            Intent data = result.getData();
            if (data == null) {
                call.reject("Cancelled by user");
                return;
            }

            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            GoogleSignInAccount account = null;

            try {
                account = task.getResult(ApiException.class);
            } catch (ApiException ae) {
                // If ApiException, check if account object was passed directly in intent extras
                if (data.hasExtra("googleSignInAccount")) {
                    account = data.getParcelableExtra("googleSignInAccount");
                }
                if (account == null) {
                    account = GoogleSignIn.getLastSignedInAccount(getContext());
                }
                if (account == null) {
                    throw ae;
                }
            }

            if (account != null && account.getEmail() != null) {
                JSObject ret = new JSObject();
                ret.put("email", account.getEmail());
                ret.put("name", account.getDisplayName() != null ? account.getDisplayName() : account.getEmail().split("@")[0]);
                ret.put("id", account.getId() != null ? account.getId() : account.getEmail());
                ret.put("imageUrl", account.getPhotoUrl() != null ? account.getPhotoUrl().toString() : null);
                call.resolve(ret);
            } else {
                call.reject("No Google account selected");
            }
        } catch (ApiException e) {
            call.reject("Google sign in failed (code " + e.getStatusCode() + ")", String.valueOf(e.getStatusCode()), e);
        } catch (Exception e) {
            call.reject("Google sign in error: " + e.getMessage(), e);
        }
    }
}

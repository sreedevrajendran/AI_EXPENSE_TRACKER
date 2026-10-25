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
            String serverClientId = call.getString("serverClientId", "902896742960-sfp6ifpgq0jdp7522rc5ja6qhkrnqn3u.apps.googleusercontent.com");

            GoogleSignInOptions.Builder gsoBuilder = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestEmail()
                    .requestProfile();

            if (serverClientId != null && !serverClientId.trim().isEmpty()) {
                try {
                    gsoBuilder.requestIdToken(serverClientId);
                } catch (Exception ignored) {
                }
            }

            GoogleSignInOptions gso = gsoBuilder.build();
            googleSignInClient = GoogleSignIn.getClient(getActivity(), gso);

            // Sign out any cached local session first so the account chooser dialog is ALWAYS prompted
            googleSignInClient.signOut().addOnCompleteListener(getActivity(), task -> {
                Intent signInIntent = googleSignInClient.getSignInIntent();
                startActivityForResult(call, signInIntent, "handleSignInResult");
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
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            GoogleSignInAccount account = task.getResult(ApiException.class);

            if (account != null) {
                JSObject ret = new JSObject();
                ret.put("email", account.getEmail());
                ret.put("name", account.getDisplayName());
                ret.put("idToken", account.getIdToken());
                ret.put("id", account.getId());
                ret.put("imageUrl", account.getPhotoUrl() != null ? account.getPhotoUrl().toString() : null);
                call.resolve(ret);
            } else {
                call.reject("Google account selection was cancelled.");
            }
        } catch (ApiException e) {
            call.reject("Google sign in failed (code " + e.getStatusCode() + ")", String.valueOf(e.getStatusCode()), e);
        } catch (Exception e) {
            call.reject("Google sign in error: " + e.getMessage(), e);
        }
    }
}

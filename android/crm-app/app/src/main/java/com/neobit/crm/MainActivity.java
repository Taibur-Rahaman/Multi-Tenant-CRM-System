package com.neobit.crm;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;

import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.firebase.messaging.FirebaseMessaging;
import com.neobit.crm.databinding.ActivityMainBinding;
import com.neobit.crm.ui.customer.CustomerListFragment;
import com.neobit.crm.ui.dashboard.DashboardFragment;
import com.neobit.crm.ui.interaction.InteractionLogFragment;
import com.neobit.crm.ui.auth.LoginActivity;
import com.neobit.crm.util.TokenManager;
import com.neobit.crm.viewmodel.MainViewModel;

/**
 * NeoBit CRM - Main Activity
 * 
 * Entry point for the Android application after authentication.
 * Handles:
 * - Bottom navigation between main sections
 * - Push notification registration
 * - Session management
 * - Deep linking
 */
public class MainActivity extends AppCompatActivity {

    private static final String TAG = "MainActivity";

    private ActivityMainBinding binding;
    private MainViewModel viewModel;
    private TokenManager tokenManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Check authentication status
        tokenManager = new TokenManager(this);
        if (!tokenManager.isLoggedIn()) {
            navigateToLogin();
            return;
        }

        // Initialize ViewBinding
        binding = ActivityMainBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        // Initialize ViewModel
        viewModel = new ViewModelProvider(this).get(MainViewModel.class);

        // Setup UI
        setupBottomNavigation();
        setupObservers();
        
        // Register for push notifications
        registerForPushNotifications();

        // Handle deep links
        handleIntent(getIntent());

        // Load initial fragment
        if (savedInstanceState == null) {
            loadFragment(new DashboardFragment());
        }
    }

    /**
     * Setup bottom navigation with fragment switching
     */
    private void setupBottomNavigation() {
        binding.bottomNavigation.setOnItemSelectedListener(item -> {
            Fragment fragment = null;
            
            int itemId = item.getItemId();
            if (itemId == R.id.nav_dashboard) {
                fragment = new DashboardFragment();
            } else if (itemId == R.id.nav_customers) {
                fragment = new CustomerListFragment();
            } else if (itemId == R.id.nav_interactions) {
                fragment = new InteractionLogFragment();
            } else if (itemId == R.id.nav_settings) {
                fragment = new SettingsFragment();
            }

            if (fragment != null) {
                loadFragment(fragment);
                return true;
            }
            return false;
        });
    }

    /**
     * Setup LiveData observers for ViewModel
     */
    private void setupObservers() {
        // Observe loading state
        viewModel.getIsLoading().observe(this, isLoading -> {
            binding.progressBar.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        });

        // Observe error messages
        viewModel.getErrorMessage().observe(this, error -> {
            if (error != null && !error.isEmpty()) {
                Toast.makeText(this, error, Toast.LENGTH_LONG).show();
            }
        });

        // Observe logout event
        viewModel.getLogoutEvent().observe(this, shouldLogout -> {
            if (shouldLogout) {
                performLogout();
            }
        });

        // Observe notification count
        viewModel.getNotificationCount().observe(this, count -> {
            if (count > 0) {
                binding.bottomNavigation.getOrCreateBadge(R.id.nav_interactions)
                    .setNumber(count);
            } else {
                binding.bottomNavigation.removeBadge(R.id.nav_interactions);
            }
        });
    }

    /**
     * Load fragment into container
     */
    private void loadFragment(Fragment fragment) {
        getSupportFragmentManager()
            .beginTransaction()
            .replace(R.id.fragment_container, fragment)
            .commit();
    }

    /**
     * Register device for Firebase Cloud Messaging
     */
    private void registerForPushNotifications() {
        FirebaseMessaging.getInstance().getToken()
            .addOnCompleteListener(task -> {
                if (!task.isSuccessful()) {
                    Log.w(TAG, "Fetching FCM registration token failed", task.getException());
                    return;
                }

                // Get new FCM registration token
                String token = task.getResult();
                Log.d(TAG, "FCM Token: " + token);

                // Send token to backend
                viewModel.registerDeviceToken(token);
            });
    }

    /**
     * Handle incoming intents (deep links, notifications)
     */
    private void handleIntent(Intent intent) {
        if (intent == null) return;

        String action = intent.getAction();
        String data = intent.getDataString();

        if (Intent.ACTION_VIEW.equals(action) && data != null) {
            // Handle deep link
            Log.d(TAG, "Deep link: " + data);
            
            if (data.contains("/customers/")) {
                // Navigate to customer detail
                String customerId = extractIdFromUri(data, "/customers/");
                navigateToCustomerDetail(customerId);
            } else if (data.contains("/call/")) {
                // Handle incoming call
                String roomId = extractIdFromUri(data, "/call/");
                handleIncomingCall(roomId);
            }
        }

        // Handle notification data
        Bundle extras = intent.getExtras();
        if (extras != null) {
            String type = extras.getString("notification_type");
            String entityId = extras.getString("entity_id");
            
            if ("new_message".equals(type) && entityId != null) {
                navigateToCustomerDetail(entityId);
            } else if ("incoming_call".equals(type) && entityId != null) {
                handleIncomingCall(entityId);
            }
        }
    }

    /**
     * Extract ID from deep link URI
     */
    private String extractIdFromUri(String uri, String prefix) {
        int startIndex = uri.indexOf(prefix) + prefix.length();
        int endIndex = uri.indexOf("/", startIndex);
        if (endIndex == -1) endIndex = uri.length();
        return uri.substring(startIndex, endIndex);
    }

    /**
     * Navigate to customer detail screen
     */
    private void navigateToCustomerDetail(String customerId) {
        CustomerListFragment fragment = CustomerListFragment.newInstance(customerId);
        loadFragment(fragment);
        binding.bottomNavigation.setSelectedItemId(R.id.nav_customers);
    }

    /**
     * Handle incoming call - launch call activity
     */
    private void handleIncomingCall(String roomId) {
        Intent callIntent = new Intent(this, CallActivity.class);
        callIntent.putExtra("room_id", roomId);
        callIntent.putExtra("is_incoming", true);
        startActivity(callIntent);
    }

    /**
     * Navigate to login screen
     */
    private void navigateToLogin() {
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    /**
     * Perform logout
     */
    private void performLogout() {
        tokenManager.clearTokens();
        navigateToLogin();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        binding = null;
    }
}


// ============================================================
// ADDITIONAL ANDROID FILES (Structure Notes)
// ============================================================

/*
 * PROJECT STRUCTURE:
 * 
 * mobile/android/
 * ├── app/
 * │   ├── build.gradle
 * │   └── src/
 * │       └── main/
 * │           ├── AndroidManifest.xml
 * │           ├── java/com/neobit/crm/
 * │           │   ├── MainActivity.java
 * │           │   ├── NeoBitApplication.java
 * │           │   │
 * │           │   ├── ui/
 * │           │   │   ├── auth/
 * │           │   │   │   ├── LoginActivity.java
 * │           │   │   │   └── LoginViewModel.java
 * │           │   │   ├── customer/
 * │           │   │   │   ├── CustomerListFragment.java
 * │           │   │   │   ├── CustomerDetailFragment.java
 * │           │   │   │   ├── CustomerAdapter.java
 * │           │   │   │   └── CustomerViewModel.java
 * │           │   │   ├── interaction/
 * │           │   │   │   ├── InteractionLogFragment.java
 * │           │   │   │   ├── InteractionAdapter.java
 * │           │   │   │   └── InteractionViewModel.java
 * │           │   │   ├── dashboard/
 * │           │   │   │   ├── DashboardFragment.java
 * │           │   │   │   └── DashboardViewModel.java
 * │           │   │   └── call/
 * │           │   │       ├── CallActivity.java
 * │           │   │       └── CallViewModel.java
 * │           │   │
 * │           │   ├── data/
 * │           │   │   ├── api/
 * │           │   │   │   ├── ApiService.java
 * │           │   │   │   ├── AuthInterceptor.java
 * │           │   │   │   └── RetrofitClient.java
 * │           │   │   ├── repository/
 * │           │   │   │   ├── AuthRepository.java
 * │           │   │   │   ├── CustomerRepository.java
 * │           │   │   │   └── InteractionRepository.java
 * │           │   │   └── local/
 * │           │   │       ├── AppDatabase.java
 * │           │   │       ├── CustomerDao.java
 * │           │   │       └── InteractionDao.java
 * │           │   │
 * │           │   ├── model/
 * │           │   │   ├── User.java
 * │           │   │   ├── Customer.java
 * │           │   │   ├── Interaction.java
 * │           │   │   └── AuthResponse.java
 * │           │   │
 * │           │   ├── util/
 * │           │   │   ├── TokenManager.java
 * │           │   │   ├── NotificationHelper.java
 * │           │   │   └── Constants.java
 * │           │   │
 * │           │   └── service/
 * │           │       ├── FirebaseMessagingService.java
 * │           │       └── CallService.java
 * │           │
 * │           └── res/
 * │               ├── layout/
 * │               │   ├── activity_main.xml
 * │               │   ├── activity_login.xml
 * │               │   ├── fragment_customer_list.xml
 * │               │   └── item_customer.xml
 * │               ├── values/
 * │               │   ├── strings.xml
 * │               │   ├── colors.xml
 * │               │   └── themes.xml
 * │               └── drawable/
 * │
 * ├── build.gradle (project)
 * └── settings.gradle
 */

// ============================================================
// LoginActivity.java - Authentication Flow
// ============================================================

/*
package com.neobit.crm.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;
import com.neobit.crm.MainActivity;
import com.neobit.crm.R;
import com.neobit.crm.databinding.ActivityLoginBinding;
import com.neobit.crm.util.Constants;
import com.neobit.crm.util.TokenManager;

public class LoginActivity extends AppCompatActivity {

    private ActivityLoginBinding binding;
    private LoginViewModel viewModel;
    private GoogleSignInClient googleSignInClient;
    private TokenManager tokenManager;

    private final ActivityResultLauncher<Intent> googleSignInLauncher =
        registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(result.getData());
                handleGoogleSignInResult(task);
            }
        );

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        binding = ActivityLoginBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        tokenManager = new TokenManager(this);
        viewModel = new ViewModelProvider(this).get(LoginViewModel.class);

        // Check if already logged in
        if (tokenManager.isLoggedIn()) {
            navigateToMain();
            return;
        }

        setupGoogleSignIn();
        setupClickListeners();
        setupObservers();
    }

    private void setupGoogleSignIn() {
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(Constants.GOOGLE_CLIENT_ID)
            .requestEmail()
            .build();

        googleSignInClient = GoogleSignIn.getClient(this, gso);
    }

    private void setupClickListeners() {
        // Email/Password login
        binding.btnLogin.setOnClickListener(v -> {
            String email = binding.etEmail.getText().toString().trim();
            String password = binding.etPassword.getText().toString();

            if (validateInput(email, password)) {
                viewModel.login(email, password);
            }
        });

        // Google Sign-In
        binding.btnGoogleSignIn.setOnClickListener(v -> {
            Intent signInIntent = googleSignInClient.getSignInIntent();
            googleSignInLauncher.launch(signInIntent);
        });

        // GitHub Sign-In
        binding.btnGithubSignIn.setOnClickListener(v -> {
            viewModel.initiateGitHubOAuth();
        });
    }

    private void setupObservers() {
        viewModel.getIsLoading().observe(this, isLoading -> {
            binding.progressBar.setVisibility(isLoading ? View.VISIBLE : View.GONE);
            binding.btnLogin.setEnabled(!isLoading);
            binding.btnGoogleSignIn.setEnabled(!isLoading);
            binding.btnGithubSignIn.setEnabled(!isLoading);
        });

        viewModel.getLoginSuccess().observe(this, authResponse -> {
            if (authResponse != null) {
                tokenManager.saveTokens(
                    authResponse.getAccessToken(),
                    authResponse.getRefreshToken()
                );
                tokenManager.saveUser(authResponse.getUser());
                navigateToMain();
            }
        });

        viewModel.getErrorMessage().observe(this, error -> {
            if (error != null && !error.isEmpty()) {
                Toast.makeText(this, error, Toast.LENGTH_LONG).show();
            }
        });

        viewModel.getGitHubAuthUrl().observe(this, url -> {
            if (url != null) {
                // Open GitHub OAuth in browser
                Intent intent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse(url));
                startActivity(intent);
            }
        });
    }

    private boolean validateInput(String email, String password) {
        boolean valid = true;

        if (email.isEmpty() || !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            binding.tilEmail.setError("Enter a valid email");
            valid = false;
        } else {
            binding.tilEmail.setError(null);
        }

        if (password.isEmpty() || password.length() < 8) {
            binding.tilPassword.setError("Password must be at least 8 characters");
            valid = false;
        } else {
            binding.tilPassword.setError(null);
        }

        return valid;
    }

    private void handleGoogleSignInResult(Task<GoogleSignInAccount> completedTask) {
        try {
            GoogleSignInAccount account = completedTask.getResult(ApiException.class);
            String idToken = account.getIdToken();
            viewModel.loginWithGoogle(idToken);
        } catch (ApiException e) {
            Toast.makeText(this, "Google sign-in failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    private void navigateToMain() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
*/

// ============================================================
// TokenManager.java - Token Storage
// ============================================================

/*
package com.neobit.crm.util;

import android.content.Context;
import android.content.SharedPreferences;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;
import com.google.gson.Gson;
import com.neobit.crm.model.User;

public class TokenManager {
    private static final String PREF_NAME = "neobit_secure_prefs";
    private static final String KEY_ACCESS_TOKEN = "access_token";
    private static final String KEY_REFRESH_TOKEN = "refresh_token";
    private static final String KEY_USER = "user";

    private final SharedPreferences preferences;
    private final Gson gson;

    public TokenManager(Context context) {
        this.gson = new Gson();
        try {
            MasterKey masterKey = new MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build();

            this.preferences = EncryptedSharedPreferences.create(
                context,
                PREF_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to create encrypted preferences", e);
        }
    }

    public void saveTokens(String accessToken, String refreshToken) {
        preferences.edit()
            .putString(KEY_ACCESS_TOKEN, accessToken)
            .putString(KEY_REFRESH_TOKEN, refreshToken)
            .apply();
    }

    public String getAccessToken() {
        return preferences.getString(KEY_ACCESS_TOKEN, null);
    }

    public String getRefreshToken() {
        return preferences.getString(KEY_REFRESH_TOKEN, null);
    }

    public void saveUser(User user) {
        String userJson = gson.toJson(user);
        preferences.edit().putString(KEY_USER, userJson).apply();
    }

    public User getUser() {
        String userJson = preferences.getString(KEY_USER, null);
        if (userJson != null) {
            return gson.fromJson(userJson, User.class);
        }
        return null;
    }

    public boolean isLoggedIn() {
        return getAccessToken() != null;
    }

    public void clearTokens() {
        preferences.edit().clear().apply();
    }
}
*/

// ============================================================
// ApiService.java - Retrofit API Interface
// ============================================================

/*
package com.neobit.crm.data.api;

import com.neobit.crm.model.*;
import retrofit2.Call;
import retrofit2.http.*;

import java.util.List;

public interface ApiService {

    // Authentication
    @POST("auth/login")
    Call<AuthResponse> login(@Body LoginRequest request);

    @POST("auth/oauth/callback")
    Call<AuthResponse> oauthCallback(@Body OAuthCallbackRequest request);

    @POST("auth/refresh")
    Call<TokenRefreshResponse> refreshToken(@Body RefreshTokenRequest request);

    @POST("auth/logout")
    Call<Void> logout(@Body LogoutRequest request);

    // Customers
    @GET("customers")
    Call<PagedResponse<Customer>> getCustomers(
        @Query("page") int page,
        @Query("size") int size,
        @Query("search") String search
    );

    @GET("customers/{id}")
    Call<Customer> getCustomer(@Path("id") String id);

    @POST("customers")
    Call<Customer> createCustomer(@Body CreateCustomerRequest request);

    @PUT("customers/{id}")
    Call<Customer> updateCustomer(@Path("id") String id, @Body UpdateCustomerRequest request);

    // Interactions
    @GET("interactions")
    Call<PagedResponse<Interaction>> getInteractions(
        @Query("page") int page,
        @Query("size") int size,
        @Query("customerId") String customerId
    );

    @POST("interactions")
    Call<Interaction> createInteraction(@Body CreateInteractionRequest request);

    @POST("interactions/call")
    Call<CallInitResponse> initiateCall(@Body InitiateCallRequest request);

    // Device registration for push notifications
    @POST("users/me/devices")
    Call<Void> registerDevice(@Body DeviceRegistrationRequest request);
}
*/

// ============================================================
// build.gradle (app level) - Dependencies
// ============================================================

/*
plugins {
    id 'com.android.application'
}

android {
    namespace 'com.neobit.crm'
    compileSdk 34

    defaultConfig {
        applicationId "com.neobit.crm"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"

        buildConfigField "String", "API_BASE_URL", '"https://api.neobit.com/api/"'
        buildConfigField "String", "GOOGLE_CLIENT_ID", '"912910293606-g20s0rs4rhs3nftqkvi9s7isj6n07m4j.apps.googleusercontent.com"'
        buildConfigField "long", "ZEGO_APP_ID", '1934093598L'
    }

    buildFeatures {
        viewBinding true
        buildConfig true
    }
}

dependencies {
    // AndroidX
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.lifecycle:lifecycle-viewmodel:2.7.0'
    implementation 'androidx.lifecycle:lifecycle-livedata:2.7.0'
    implementation 'androidx.fragment:fragment:1.6.2'
    implementation 'androidx.swiperefreshlayout:swiperefreshlayout:1.1.0'
    implementation 'androidx.security:security-crypto:1.1.0-alpha06'

    // Material Design
    implementation 'com.google.android.material:material:1.11.0'

    // Networking
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    implementation 'com.squareup.okhttp3:logging-interceptor:4.12.0'

    // Image Loading
    implementation 'com.github.bumptech.glide:glide:4.16.0'

    // Google Sign-In
    implementation 'com.google.android.gms:play-services-auth:20.7.0'

    // Firebase
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'

    // ZegoCloud SDK
    implementation 'im.zego:express-video:3.8.1'

    // Room Database
    implementation 'androidx.room:room-runtime:2.6.1'
    annotationProcessor 'androidx.room:room-compiler:2.6.1'

    // Testing
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}
*/


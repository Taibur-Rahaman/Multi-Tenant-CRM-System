package com.neobit.crm.controller;

import com.neobit.crm.dto.auth.*;
import com.neobit.crm.dto.common.ApiResponse;
import com.neobit.crm.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication endpoints")
public class AuthController {
    
    private final AuthService authService;
    
    @Value("${integrations.github.client-id:}")
    private String githubClientId;
    
    @Value("${integrations.github.redirect-uri:}")
    private String githubRedirectUri;
    
    @Value("${integrations.google.client-id:}")
    private String googleClientId;
    
    @Value("${integrations.google.redirect-uri:}")
    private String googleRedirectUri;
    
    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }
    
    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }
    
    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @PostMapping("/logout")
    @Operation(summary = "Logout and invalidate refresh token")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody RefreshTokenRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
    }
    
    @GetMapping("/oauth/providers")
    @Operation(summary = "Get available OAuth providers")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOAuthProviders() {
        Map<String, Object> providers = new HashMap<>();
        
        // GitHub OAuth
        if (githubClientId != null && !githubClientId.isEmpty()) {
            Map<String, String> github = new HashMap<>();
            github.put("clientId", githubClientId);
            github.put("redirectUri", githubRedirectUri);
            github.put("authUrl", "https://github.com/login/oauth/authorize");
            github.put("scope", "user:email read:user");
            providers.put("github", github);
        }
        
        // Google OAuth
        if (googleClientId != null && !googleClientId.isEmpty()) {
            Map<String, String> google = new HashMap<>();
            google.put("clientId", googleClientId);
            google.put("redirectUri", googleRedirectUri);
            google.put("authUrl", "https://accounts.google.com/o/oauth2/v2/auth");
            google.put("scope", "openid profile email");
            providers.put("google", google);
        }
        
        return ResponseEntity.ok(ApiResponse.success(providers));
    }
    
    @PostMapping("/oauth/github/callback")
    @Operation(summary = "Handle GitHub OAuth callback")
    public ResponseEntity<ApiResponse<AuthResponse>> githubCallback(@RequestParam String code) {
        AuthResponse response = authService.handleGitHubCallback(code);
        return ResponseEntity.ok(ApiResponse.success("GitHub login successful", response));
    }
    
    @PostMapping("/oauth/google/callback")
    @Operation(summary = "Handle Google OAuth callback")
    public ResponseEntity<ApiResponse<AuthResponse>> googleCallback(@RequestParam String code) {
        AuthResponse response = authService.handleGoogleCallback(code);
        return ResponseEntity.ok(ApiResponse.success("Google login successful", response));
    }
}


package com.neobit.crm.controller;

import com.neobit.crm.dto.request.*;
import com.neobit.crm.dto.response.*;
import com.neobit.crm.service.AuthService;
import com.neobit.crm.service.OAuth2Service;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication Controller
 * 
 * Handles:
 * - Email/password login
 * - OAuth2 social login (Google, GitHub)
 * - Token refresh
 * - Logout and token revocation
 * - User registration
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Authentication and authorization endpoints")
public class AuthController {

    private final AuthService authService;
    private final OAuth2Service oAuth2Service;

    /**
     * Login with email and password
     * 
     * POST /api/auth/login
     * Request: { "email": "user@example.com", "password": "password123" }
     * Response: { "accessToken": "...", "refreshToken": "...", "user": {...} }
     */
    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        
        log.info("Login attempt for email: {}", request.getEmail());
        
        String ipAddress = getClientIP(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        AuthResponse response = authService.login(
            request.getEmail(), 
            request.getPassword(),
            ipAddress,
            userAgent
        );
        
        log.info("Login successful for user: {}", response.getUser().getEmail());
        return ResponseEntity.ok(response);
    }

    /**
     * Register new user (creates new tenant for VENDOR_ADMIN)
     * 
     * POST /api/auth/register
     * Request: { "email": "...", "password": "...", "name": "...", "companyName": "..." }
     */
    @PostMapping("/register")
    @Operation(summary = "Register new user and tenant")
    public ResponseEntity<UserResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        
        log.info("Registration attempt for email: {}", request.getEmail());
        
        UserResponse response = authService.register(request);
        
        log.info("Registration successful for user: {}", response.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Initiate OAuth2 login flow
     * 
     * GET /api/auth/oauth/{provider}?redirect_uri=...
     * Response: Redirect to OAuth provider
     */
    @GetMapping("/oauth/{provider}")
    @Operation(summary = "Initiate OAuth2 login")
    public ResponseEntity<OAuthUrlResponse> initiateOAuth(
            @PathVariable String provider,
            @RequestParam(required = false) String redirectUri) {
        
        log.info("Initiating OAuth flow for provider: {}", provider);
        
        String authUrl = oAuth2Service.getAuthorizationUrl(provider, redirectUri);
        
        return ResponseEntity.ok(new OAuthUrlResponse(authUrl));
    }

    /**
     * OAuth2 callback handler
     * 
     * POST /api/auth/oauth/callback
     * Request: { "provider": "google", "code": "...", "redirectUri": "..." }
     * Response: { "accessToken": "...", "refreshToken": "...", "user": {...} }
     */
    @PostMapping("/oauth/callback")
    @Operation(summary = "Handle OAuth2 callback")
    public ResponseEntity<AuthResponse> handleOAuthCallback(
            @Valid @RequestBody OAuthCallbackRequest request,
            HttpServletRequest httpRequest) {
        
        log.info("OAuth callback for provider: {}", request.getProvider());
        
        String ipAddress = getClientIP(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        AuthResponse response = oAuth2Service.handleCallback(
            request.getProvider(),
            request.getCode(),
            request.getRedirectUri(),
            ipAddress,
            userAgent
        );
        
        log.info("OAuth login successful for user: {}", response.getUser().getEmail());
        return ResponseEntity.ok(response);
    }

    /**
     * Refresh access token
     * 
     * POST /api/auth/refresh
     * Request: { "refreshToken": "..." }
     * Response: { "accessToken": "...", "expiresIn": 900 }
     */
    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<TokenRefreshResponse> refreshToken(
            @Valid @RequestBody TokenRefreshRequest request) {
        
        log.debug("Token refresh request");
        
        TokenRefreshResponse response = authService.refreshToken(request.getRefreshToken());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Logout and revoke refresh token
     * 
     * POST /api/auth/logout
     * Request: { "refreshToken": "..." }
     */
    @PostMapping("/logout")
    @Operation(summary = "Logout and revoke tokens")
    public ResponseEntity<Void> logout(
            @Valid @RequestBody LogoutRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Logout request for user: {}", principal.getEmail());
        
        authService.logout(request.getRefreshToken(), principal.getId());
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Get current user profile
     * 
     * GET /api/auth/me
     */
    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<UserResponse> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal principal) {
        
        UserResponse response = authService.getCurrentUser(principal.getId());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Update current user profile
     * 
     * PUT /api/auth/me
     */
    @PutMapping("/me")
    @Operation(summary = "Update current user profile")
    public ResponseEntity<UserResponse> updateCurrentUser(
            @Valid @RequestBody UpdateUserRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        UserResponse response = authService.updateUser(principal.getId(), request);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Change password
     * 
     * POST /api/auth/change-password
     */
    @PostMapping("/change-password")
    @Operation(summary = "Change user password")
    public ResponseEntity<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        authService.changePassword(
            principal.getId(), 
            request.getCurrentPassword(), 
            request.getNewPassword()
        );
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Request password reset
     * 
     * POST /api/auth/forgot-password
     */
    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset email")
    public ResponseEntity<MessageResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        
        authService.sendPasswordResetEmail(request.getEmail());
        
        return ResponseEntity.ok(new MessageResponse(
            "If the email exists, a password reset link has been sent"
        ));
    }

    /**
     * Reset password with token
     * 
     * POST /api/auth/reset-password
     */
    @PostMapping("/reset-password")
    @Operation(summary = "Reset password with token")
    public ResponseEntity<MessageResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        
        authService.resetPassword(request.getToken(), request.getNewPassword());
        
        return ResponseEntity.ok(new MessageResponse("Password has been reset successfully"));
    }

    /**
     * Verify email with token
     * 
     * GET /api/auth/verify-email?token=...
     */
    @GetMapping("/verify-email")
    @Operation(summary = "Verify email address")
    public ResponseEntity<MessageResponse> verifyEmail(
            @RequestParam String token) {
        
        authService.verifyEmail(token);
        
        return ResponseEntity.ok(new MessageResponse("Email verified successfully"));
    }

    /**
     * Helper method to extract client IP
     */
    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

// ============================================================
// Request/Response DTOs (would be in separate files)
// ============================================================

/*
// LoginRequest.java
@Data
public class LoginRequest {
    @NotBlank @Email
    private String email;
    
    @NotBlank @Size(min = 8)
    private String password;
}

// RegisterRequest.java
@Data
public class RegisterRequest {
    @NotBlank @Email
    private String email;
    
    @NotBlank @Size(min = 8)
    private String password;
    
    @NotBlank
    private String name;
    
    @NotBlank
    private String companyName;
    
    private String plan = "FREE";
}

// AuthResponse.java
@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private int expiresIn;
    private boolean isNewUser;
    private UserResponse user;
}

// UserResponse.java
@Data
@Builder
public class UserResponse {
    private UUID id;
    private String email;
    private String name;
    private String avatar;
    private String role;
    private UUID tenantId;
    private String tenantName;
    private Map<String, Object> preferences;
    private LocalDateTime createdAt;
}

// OAuthCallbackRequest.java
@Data
public class OAuthCallbackRequest {
    @NotBlank
    private String provider;
    
    @NotBlank
    private String code;
    
    private String redirectUri;
}

// TokenRefreshRequest.java
@Data
public class TokenRefreshRequest {
    @NotBlank
    private String refreshToken;
}

// TokenRefreshResponse.java
@Data
@Builder
public class TokenRefreshResponse {
    private String accessToken;
    private int expiresIn;
}
*/


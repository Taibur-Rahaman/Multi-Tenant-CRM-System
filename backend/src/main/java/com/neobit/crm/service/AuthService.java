package com.neobit.crm.service;

import com.neobit.crm.dto.auth.*;
import com.neobit.crm.dto.user.UserDTO;
import com.neobit.crm.entity.RefreshToken;
import com.neobit.crm.entity.Tenant;
import com.neobit.crm.entity.User;
import com.neobit.crm.exception.BadRequestException;
import com.neobit.crm.exception.DuplicateResourceException;
import com.neobit.crm.exception.ResourceNotFoundException;
import com.neobit.crm.exception.UnauthorizedException;
import com.neobit.crm.mapper.UserMapper;
import com.neobit.crm.repository.RefreshTokenRepository;
import com.neobit.crm.repository.TenantRepository;
import com.neobit.crm.repository.UserRepository;
import com.neobit.crm.security.JwtTokenProvider;
import com.neobit.crm.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final RestTemplate restTemplate = new RestTemplate();
    
    @Value("${integrations.github.client-id:}")
    private String githubClientId;
    
    @Value("${integrations.github.client-secret:}")
    private String githubClientSecret;
    
    @Value("${integrations.google.client-id:}")
    private String googleClientId;
    
    @Value("${integrations.google.client-secret:}")
    private String googleClientSecret;
    
    @Value("${integrations.google.redirect-uri:}")
    private String googleRedirectUri;
    
    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        
        // Generate tokens
        String accessToken = tokenProvider.generateAccessToken(authentication);
        String refreshToken = createRefreshToken(userPrincipal.getId());
        
        // Update last login
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userPrincipal.getId()));
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);
        
        return AuthResponse.of(
            accessToken,
            refreshToken,
            tokenProvider.getAccessTokenExpiration(),
            userMapper.toDTO(user)
        );
    }
    
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Find tenant
        Tenant tenant = tenantRepository.findBySlug(request.getTenantSlug())
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", "slug", request.getTenantSlug()));
        
        // Check if user already exists
        if (userRepository.existsByEmailAndTenantId(request.getEmail(), tenant.getId())) {
            throw new DuplicateResourceException("User", "email", request.getEmail());
        }
        
        // Check max users limit
        long currentUserCount = userRepository.countByTenantId(tenant.getId());
        if (currentUserCount >= tenant.getMaxUsers()) {
            throw new BadRequestException("Maximum user limit reached for this tenant");
        }
        
        // Create user
        User user = User.builder()
                .tenant(tenant)
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .role(User.UserRole.AGENT)
                .isActive(true)
                .emailVerified(false)
                .build();
        
        user = userRepository.save(user);
        
        // Generate tokens
        String accessToken = tokenProvider.generateAccessToken(user.getId(), tenant.getId(), user.getEmail());
        String refreshToken = createRefreshToken(user.getId());
        
        return AuthResponse.of(
            accessToken,
            refreshToken,
            tokenProvider.getAccessTokenExpiration(),
            userMapper.toDTO(user)
        );
    }
    
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));
        
        if (!refreshToken.isValid()) {
            throw new UnauthorizedException("Refresh token has expired or been revoked");
        }
        
        User user = refreshToken.getUser();
        
        // Revoke old refresh token
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);
        
        // Generate new tokens
        String newAccessToken = tokenProvider.generateAccessToken(
            user.getId(), 
            user.getTenant().getId(), 
            user.getEmail()
        );
        String newRefreshToken = createRefreshToken(user.getId());
        
        return AuthResponse.of(
            newAccessToken,
            newRefreshToken,
            tokenProvider.getAccessTokenExpiration(),
            userMapper.toDTO(user)
        );
    }
    
    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken)
                .ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokenRepository.save(token);
                });
    }
    
    private String createRefreshToken(java.util.UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        String token = tokenProvider.generateRefreshToken();
        
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(token)
                .expiresAt(Instant.now().plusMillis(tokenProvider.getRefreshTokenExpiration()))
                .build();
        
        refreshTokenRepository.save(refreshToken);
        
        return token;
    }
    
    @Transactional
    public AuthResponse handleGitHubCallback(String code) {
        try {
            // Exchange code for access token
            String tokenUrl = "https://github.com/login/oauth/access_token";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));
            
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("client_id", githubClientId);
            params.add("client_secret", githubClientSecret);
            params.add("code", code);
            
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
            ResponseEntity<Map> tokenResponse = restTemplate.postForEntity(tokenUrl, request, Map.class);
            
            String accessToken = (String) tokenResponse.getBody().get("access_token");
            if (accessToken == null) {
                throw new UnauthorizedException("Failed to get GitHub access token");
            }
            
            // Get user info from GitHub
            HttpHeaders userHeaders = new HttpHeaders();
            userHeaders.setBearerAuth(accessToken);
            HttpEntity<Void> userRequest = new HttpEntity<>(userHeaders);
            
            ResponseEntity<Map> userResponse = restTemplate.exchange(
                "https://api.github.com/user",
                HttpMethod.GET,
                userRequest,
                Map.class
            );
            
            Map<String, Object> githubUser = userResponse.getBody();
            String email = (String) githubUser.get("email");
            String name = (String) githubUser.get("name");
            String login = (String) githubUser.get("login");
            
            // If email is not public, fetch from emails endpoint
            if (email == null) {
                ResponseEntity<java.util.List> emailsResponse = restTemplate.exchange(
                    "https://api.github.com/user/emails",
                    HttpMethod.GET,
                    userRequest,
                    java.util.List.class
                );
                for (Object emailObj : emailsResponse.getBody()) {
                    Map<String, Object> emailData = (Map<String, Object>) emailObj;
                    if (Boolean.TRUE.equals(emailData.get("primary"))) {
                        email = (String) emailData.get("email");
                        break;
                    }
                }
            }
            
            if (email == null) {
                email = login + "@github.local";
            }
            
            return findOrCreateOAuthUser(email, name != null ? name : login, "github");
            
        } catch (Exception e) {
            log.error("GitHub OAuth error: {}", e.getMessage(), e);
            throw new UnauthorizedException("GitHub authentication failed: " + e.getMessage());
        }
    }
    
    @Transactional
    public AuthResponse handleGoogleCallback(String code) {
        try {
            // Exchange code for access token
            String tokenUrl = "https://oauth2.googleapis.com/token";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("client_id", googleClientId);
            params.add("client_secret", googleClientSecret);
            params.add("code", code);
            params.add("grant_type", "authorization_code");
            params.add("redirect_uri", googleRedirectUri);
            
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
            ResponseEntity<Map> tokenResponse = restTemplate.postForEntity(tokenUrl, request, Map.class);
            
            String accessToken = (String) tokenResponse.getBody().get("access_token");
            if (accessToken == null) {
                throw new UnauthorizedException("Failed to get Google access token");
            }
            
            // Get user info from Google
            HttpHeaders userHeaders = new HttpHeaders();
            userHeaders.setBearerAuth(accessToken);
            HttpEntity<Void> userRequest = new HttpEntity<>(userHeaders);
            
            ResponseEntity<Map> userResponse = restTemplate.exchange(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                HttpMethod.GET,
                userRequest,
                Map.class
            );
            
            Map<String, Object> googleUser = userResponse.getBody();
            String email = (String) googleUser.get("email");
            String name = (String) googleUser.get("name");
            
            return findOrCreateOAuthUser(email, name, "google");
            
        } catch (Exception e) {
            log.error("Google OAuth error: {}", e.getMessage(), e);
            throw new UnauthorizedException("Google authentication failed: " + e.getMessage());
        }
    }
    
    private AuthResponse findOrCreateOAuthUser(String email, String name, String provider) {
        // Get default tenant (demo)
        Tenant tenant = tenantRepository.findBySlug("demo")
                .orElseGet(() -> {
                    Tenant newTenant = Tenant.builder()
                            .name("Demo Tenant")
                            .slug("demo")
                            .isActive(true)
                            .maxUsers(100)
                            .build();
                    return tenantRepository.save(newTenant);
                });
        
        // Find or create user
        User user = userRepository.findByEmailAndTenantId(email, tenant.getId())
                .orElseGet(() -> {
                    String[] nameParts = name != null ? name.split(" ", 2) : new String[]{"User"};
                    User newUser = User.builder()
                            .tenant(tenant)
                            .email(email)
                            .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                            .firstName(nameParts[0])
                            .lastName(nameParts.length > 1 ? nameParts[1] : "")
                            .role(User.UserRole.AGENT)
                            .isActive(true)
                            .emailVerified(true)
                            .build();
                    return userRepository.save(newUser);
                });
        
        // Update last login
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);
        
        // Generate tokens
        String accessToken = tokenProvider.generateAccessToken(user.getId(), tenant.getId(), user.getEmail());
        String refreshToken = createRefreshToken(user.getId());
        
        log.info("OAuth login successful for {} via {}", email, provider);
        
        return AuthResponse.of(
            accessToken,
            refreshToken,
            tokenProvider.getAccessTokenExpiration(),
            userMapper.toDTO(user)
        );
    }
}


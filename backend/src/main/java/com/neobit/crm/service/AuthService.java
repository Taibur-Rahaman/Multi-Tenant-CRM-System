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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

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
}


package com.neobit.crm.service;

import com.neobit.crm.dto.auth.AuthResponse;
import com.neobit.crm.dto.auth.LoginRequest;
import com.neobit.crm.dto.auth.RegisterRequest;
import com.neobit.crm.entity.Tenant;
import com.neobit.crm.entity.User;
import com.neobit.crm.mapper.UserMapper;
import com.neobit.crm.repository.RefreshTokenRepository;
import com.neobit.crm.repository.TenantRepository;
import com.neobit.crm.repository.UserRepository;
import com.neobit.crm.security.JwtTokenProvider;
import com.neobit.crm.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AuthService
 * Tests UC-2: Authenticate Vendor User
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private AuthService authService;

    private UUID userId;
    private UUID tenantId;
    private User testUser;
    private Tenant testTenant;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        tenantId = UUID.randomUUID();

        testTenant = Tenant.builder()
                .id(tenantId)
                .name("Test Tenant")
                .slug("test")
                .maxUsers(10)
                .isActive(true)
                .build();

        testUser = User.builder()
                .id(userId)
                .tenant(testTenant)
                .email("test@example.com")
                .passwordHash("hashedPassword")
                .firstName("Test")
                .lastName("User")
                .role(User.UserRole.AGENT)
                .isActive(true)
                .build();
    }

    @Test
    void login_WithValidCredentials_ShouldReturnAuthResponse() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");

        UserPrincipal userPrincipal = UserPrincipal.create(testUser);
        Authentication authentication = mock(Authentication.class);
        
        when(authentication.getPrincipal()).thenReturn(userPrincipal);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(tokenProvider.generateAccessToken(authentication)).thenReturn("access-token");
        when(tokenProvider.generateRefreshToken()).thenReturn("refresh-token");
        when(tokenProvider.getAccessTokenExpiration()).thenReturn(900000L);
        when(tokenProvider.getRefreshTokenExpiration()).thenReturn(604800000L);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        // Act
        AuthResponse result = authService.login(request);

        // Assert
        assertNotNull(result);
        assertEquals("access-token", result.getAccessToken());
        verify(authenticationManager).authenticate(any());
    }

    @Test
    void register_WithValidData_ShouldCreateUser() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setEmail("newuser@example.com");
        request.setPassword("password123");
        request.setFirstName("New");
        request.setLastName("User");
        request.setTenantSlug("test");

        when(tenantRepository.findBySlug("test")).thenReturn(Optional.of(testTenant));
        when(userRepository.existsByEmailAndTenantId(anyString(), any(UUID.class))).thenReturn(false);
        when(userRepository.countByTenantId(tenantId)).thenReturn(1L);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(tokenProvider.generateAccessToken(any(UUID.class), any(UUID.class), anyString()))
                .thenReturn("access-token");
        when(tokenProvider.generateRefreshToken()).thenReturn("refresh-token");
        when(tokenProvider.getAccessTokenExpiration()).thenReturn(900000L);
        when(tokenProvider.getRefreshTokenExpiration()).thenReturn(604800000L);

        // Act
        AuthResponse result = authService.register(request);

        // Assert
        assertNotNull(result);
        verify(userRepository).save(any(User.class));
    }
}


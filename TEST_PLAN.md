# NeoBit CRM - Test Plan

> Comprehensive testing strategy for the Multi-Tenant CRM System

---

## Table of Contents

1. [Testing Strategy Overview](#testing-strategy-overview)
2. [Unit Tests](#unit-tests)
3. [Integration Tests](#integration-tests)
4. [End-to-End Tests](#end-to-end-tests)
5. [Security Tests](#security-tests)
6. [Performance Tests](#performance-tests)
7. [Mobile Tests](#mobile-tests)
8. [Test Data Management](#test-data-management)

---

## Testing Strategy Overview

### Testing Pyramid

```
         /\
        /  \       E2E Tests (10%)
       /----\      - Full user journeys
      /      \     - Critical paths only
     /--------\    Integration Tests (30%)
    /          \   - API endpoints
   /------------\  - Service interactions
  /              \ Unit Tests (60%)
 /----------------\ - Business logic
                   - Utility functions
```

### Tools & Frameworks

| Layer | Backend | Frontend | Mobile |
|-------|---------|----------|--------|
| **Unit** | JUnit 5, Mockito | Jest, React Testing Library | JUnit, Mockito |
| **Integration** | Spring Boot Test, TestContainers | MSW (Mock Service Worker) | Espresso |
| **E2E** | REST Assured | Cypress | UI Automator |
| **Coverage** | JaCoCo | Istanbul/NYC | JaCoCo |
| **Mutation** | PIT Mutation | Stryker | - |

### Coverage Targets

| Component | Line Coverage | Branch Coverage |
|-----------|--------------|-----------------|
| Backend Services | 80% | 70% |
| Backend Controllers | 75% | 65% |
| Frontend Components | 70% | 60% |
| Critical Paths | 90% | 85% |

---

## Unit Tests

### Backend Unit Tests (JUnit 5 + Mockito)

#### Test Categories

1. **Service Layer Tests**
2. **Repository Tests**
3. **Controller Tests**
4. **Utility/Helper Tests**
5. **Security Tests**

#### Sample Test Files

##### AuthServiceTest.java

```java
package com.neobit.crm.service;

import com.neobit.crm.dto.request.LoginRequest;
import com.neobit.crm.dto.response.AuthResponse;
import com.neobit.crm.exception.InvalidCredentialsException;
import com.neobit.crm.model.entity.User;
import com.neobit.crm.repository.UserRepository;
import com.neobit.crm.security.JwtTokenProvider;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    
    @Mock
    private PasswordEncoder passwordEncoder;
    
    @Mock
    private JwtTokenProvider jwtTokenProvider;
    
    @Mock
    private RefreshTokenService refreshTokenService;
    
    @InjectMocks
    private AuthService authService;
    
    private User testUser;
    
    @BeforeEach
    void setUp() {
        testUser = User.builder()
            .id(UUID.randomUUID())
            .email("test@example.com")
            .passwordHash("hashedPassword")
            .name("Test User")
            .role(Role.AGENT)
            .tenantId(UUID.randomUUID())
            .isActive(true)
            .build();
    }
    
    @Nested
    @DisplayName("Login Tests")
    class LoginTests {
        
        @Test
        @DisplayName("Should login successfully with valid credentials")
        void shouldLoginWithValidCredentials() {
            // Given
            when(userRepository.findByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches("password123", "hashedPassword"))
                .thenReturn(true);
            when(jwtTokenProvider.generateAccessToken(any()))
                .thenReturn("access-token");
            when(refreshTokenService.createRefreshToken(any(), any(), any()))
                .thenReturn("refresh-token");
            
            // When
            AuthResponse response = authService.login(
                "test@example.com", 
                "password123",
                "127.0.0.1",
                "TestAgent"
            );
            
            // Then
            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("access-token");
            assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
            assertThat(response.getUser().getEmail()).isEqualTo("test@example.com");
            
            verify(userRepository).findByEmail("test@example.com");
            verify(passwordEncoder).matches("password123", "hashedPassword");
        }
        
        @Test
        @DisplayName("Should throw exception for invalid email")
        void shouldThrowForInvalidEmail() {
            // Given
            when(userRepository.findByEmail("invalid@example.com"))
                .thenReturn(Optional.empty());
            
            // When/Then
            assertThatThrownBy(() -> 
                authService.login("invalid@example.com", "password", null, null)
            )
            .isInstanceOf(InvalidCredentialsException.class)
            .hasMessage("Invalid email or password");
        }
        
        @Test
        @DisplayName("Should throw exception for invalid password")
        void shouldThrowForInvalidPassword() {
            // Given
            when(userRepository.findByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches("wrongpassword", "hashedPassword"))
                .thenReturn(false);
            
            // When/Then
            assertThatThrownBy(() -> 
                authService.login("test@example.com", "wrongpassword", null, null)
            )
            .isInstanceOf(InvalidCredentialsException.class);
        }
        
        @Test
        @DisplayName("Should throw exception for inactive user")
        void shouldThrowForInactiveUser() {
            // Given
            testUser.setIsActive(false);
            when(userRepository.findByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));
            
            // When/Then
            assertThatThrownBy(() -> 
                authService.login("test@example.com", "password", null, null)
            )
            .isInstanceOf(AccountDisabledException.class);
        }
    }
    
    @Nested
    @DisplayName("Token Refresh Tests")
    class TokenRefreshTests {
        
        @Test
        @DisplayName("Should refresh token successfully")
        void shouldRefreshToken() {
            // Given
            when(refreshTokenService.validateAndGetUserId("valid-refresh-token"))
                .thenReturn(testUser.getId());
            when(userRepository.findById(testUser.getId()))
                .thenReturn(Optional.of(testUser));
            when(jwtTokenProvider.generateAccessToken(any()))
                .thenReturn("new-access-token");
            
            // When
            TokenRefreshResponse response = authService.refreshToken("valid-refresh-token");
            
            // Then
            assertThat(response.getAccessToken()).isEqualTo("new-access-token");
        }
    }
}
```

##### CustomerServiceTest.java

```java
@ExtendWith(MockitoExtension.class)
@DisplayName("CustomerService Unit Tests")
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @InjectMocks
    private CustomerService customerService;
    
    private UUID tenantId;
    private Customer testCustomer;
    
    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        testCustomer = Customer.builder()
            .id(UUID.randomUUID())
            .tenantId(tenantId)
            .name("John Doe")
            .email("john@example.com")
            .phone("+8801712345678")
            .build();
    }
    
    @Test
    @DisplayName("Should create customer successfully")
    void shouldCreateCustomer() {
        // Given
        CreateCustomerRequest request = new CreateCustomerRequest();
        request.setName("Jane Doe");
        request.setEmail("jane@example.com");
        
        when(customerRepository.existsByTenantIdAndEmail(tenantId, "jane@example.com"))
            .thenReturn(false);
        when(customerRepository.save(any(Customer.class)))
            .thenAnswer(inv -> {
                Customer c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                return c;
            });
        
        // When
        CustomerResponse response = customerService.createCustomer(tenantId, request);
        
        // Then
        assertThat(response.getName()).isEqualTo("Jane Doe");
        assertThat(response.getEmail()).isEqualTo("jane@example.com");
        verify(customerRepository).save(any(Customer.class));
    }
    
    @Test
    @DisplayName("Should not allow duplicate email in same tenant")
    void shouldRejectDuplicateEmail() {
        // Given
        CreateCustomerRequest request = new CreateCustomerRequest();
        request.setEmail("john@example.com");
        
        when(customerRepository.existsByTenantIdAndEmail(tenantId, "john@example.com"))
            .thenReturn(true);
        
        // When/Then
        assertThatThrownBy(() -> customerService.createCustomer(tenantId, request))
            .isInstanceOf(DuplicateResourceException.class);
    }
    
    @Test
    @DisplayName("Should enforce tenant isolation on queries")
    void shouldEnforceTenantIsolation() {
        // Given
        UUID otherTenantId = UUID.randomUUID();
        
        when(customerRepository.findByIdAndTenantId(testCustomer.getId(), otherTenantId))
            .thenReturn(Optional.empty());
        
        // When/Then
        assertThatThrownBy(() -> 
            customerService.getCustomerById(otherTenantId, testCustomer.getId())
        )
        .isInstanceOf(ResourceNotFoundException.class);
    }
}
```

##### TenantIsolationTest.java

```java
@ExtendWith(MockitoExtension.class)
@DisplayName("Tenant Isolation Security Tests")
class TenantIsolationTest {

    @Mock
    private CustomerRepository customerRepository;
    
    @InjectMocks
    private CustomerService customerService;
    
    private UUID tenantA;
    private UUID tenantB;
    private UUID customerId;
    
    @BeforeEach
    void setUp() {
        tenantA = UUID.fromString("11111111-1111-1111-1111-111111111111");
        tenantB = UUID.fromString("22222222-2222-2222-2222-222222222222");
        customerId = UUID.randomUUID();
    }
    
    @Test
    @DisplayName("Tenant A cannot access Tenant B's customers")
    void tenantCannotAccessOtherTenantsData() {
        // Given - Customer belongs to Tenant A
        Customer customer = Customer.builder()
            .id(customerId)
            .tenantId(tenantA)
            .name("Tenant A Customer")
            .build();
        
        when(customerRepository.findByIdAndTenantId(customerId, tenantA))
            .thenReturn(Optional.of(customer));
        when(customerRepository.findByIdAndTenantId(customerId, tenantB))
            .thenReturn(Optional.empty());
        
        // When - Tenant A accesses their customer
        CustomerDetailResponse responseA = customerService.getCustomerById(tenantA, customerId);
        assertThat(responseA).isNotNull();
        
        // Then - Tenant B cannot access the same customer
        assertThatThrownBy(() -> customerService.getCustomerById(tenantB, customerId))
            .isInstanceOf(ResourceNotFoundException.class);
    }
    
    @Test
    @DisplayName("List customers returns only tenant's data")
    void listReturnsOnlyTenantData() {
        // Given
        Page<Customer> tenantACustomers = new PageImpl<>(List.of(
            Customer.builder().tenantId(tenantA).name("Customer 1").build(),
            Customer.builder().tenantId(tenantA).name("Customer 2").build()
        ));
        
        when(customerRepository.findByTenantId(eq(tenantA), any()))
            .thenReturn(tenantACustomers);
        
        // When
        Page<CustomerResponse> result = customerService.listCustomers(
            tenantA, null, null, null, PageRequest.of(0, 20)
        );
        
        // Then
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent())
            .extracting("name")
            .containsExactly("Customer 1", "Customer 2");
    }
}
```

### Frontend Unit Tests (Jest + React Testing Library)

#### Sample Test Files

##### Login.test.jsx

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from '../pages/Login';
import { AuthProvider } from '../contexts/AuthContext';
import * as authApi from '../api/auth';

// Mock API
jest.mock('../api/auth');

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

const renderLogin = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render login form', () => {
      renderLogin();
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render OAuth buttons', () => {
      renderLogin();
      
      expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error for invalid email', async () => {
      renderLogin();
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });
    });

    it('should show error for short password', async () => {
      renderLogin();
      
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      await userEvent.type(passwordInput, 'short');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call login API with credentials', async () => {
      const mockLogin = authApi.login.mockResolvedValue({
        accessToken: 'token',
        user: { email: 'test@example.com' }
      });
      
      renderLogin();
      
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });
    });

    it('should show error message on login failure', async () => {
      authApi.login.mockRejectedValue({
        response: { data: { message: 'Invalid credentials' } }
      });
      
      renderLogin();
      
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
  });
});
```

##### CustomerList.test.jsx

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Customers from '../pages/Customers';
import * as customersApi from '../api/customers';

jest.mock('../api/customers');

const mockCustomers = {
  content: [
    { id: '1', name: 'John Doe', email: 'john@example.com', tags: ['vip'] },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', tags: ['new'] }
  ],
  totalElements: 2,
  totalPages: 1
};

describe('Customers Page', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    customersApi.list.mockResolvedValue(mockCustomers);
  });

  const renderCustomers = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Customers />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('should display customer list', async () => {
    renderCustomers();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should filter customers by search', async () => {
    renderCustomers();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    await userEvent.type(searchInput, 'john');

    await waitFor(() => {
      expect(customersApi.list).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'john' })
      );
    });
  });

  it('should open create customer modal', async () => {
    renderCustomers();

    const addButton = screen.getByRole('button', { name: /add customer/i });
    await userEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/add new customer/i)).toBeInTheDocument();
    });
  });
});
```

---

## Integration Tests

### Backend Integration Tests (TestContainers)

#### Sample Test File

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DisplayName("Customer API Integration Tests")
class CustomerControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
        .withDatabaseName("neobit_test");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7")
        .withExposedPorts(6379);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.redis.host", redis::getHost);
        registry.add("spring.redis.port", () -> redis.getMappedPort(6379));
    }

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private TenantRepository tenantRepository;

    private String authToken;
    private UUID tenantId;

    @BeforeEach
    void setUp() {
        // Setup test tenant and user
        Tenant tenant = tenantRepository.save(Tenant.builder()
            .name("Test Tenant")
            .subdomain("test")
            .status(TenantStatus.ACTIVE)
            .build());
        tenantId = tenant.getId();

        // Get auth token
        authToken = getAuthToken();
    }

    @Test
    @DisplayName("GET /api/customers - should return paginated customers")
    void shouldReturnPaginatedCustomers() {
        // Given
        createTestCustomers(25);

        // When
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(authToken);
        HttpEntity<?> entity = new HttpEntity<>(headers);

        ResponseEntity<PagedResponse<CustomerResponse>> response = restTemplate.exchange(
            "/api/customers?page=0&size=10",
            HttpMethod.GET,
            entity,
            new ParameterizedTypeReference<>() {}
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getContent()).hasSize(10);
        assertThat(response.getBody().getTotalElements()).isEqualTo(25);
        assertThat(response.getBody().getTotalPages()).isEqualTo(3);
    }

    @Test
    @DisplayName("POST /api/customers - should create customer")
    void shouldCreateCustomer() {
        // Given
        CreateCustomerRequest request = new CreateCustomerRequest();
        request.setName("New Customer");
        request.setEmail("new@example.com");

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(authToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<CreateCustomerRequest> entity = new HttpEntity<>(request, headers);

        // When
        ResponseEntity<CustomerResponse> response = restTemplate.exchange(
            "/api/customers",
            HttpMethod.POST,
            entity,
            CustomerResponse.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().getName()).isEqualTo("New Customer");
        assertThat(customerRepository.existsByEmail("new@example.com")).isTrue();
    }

    @Test
    @DisplayName("GET /api/customers/{id} - should return 404 for other tenant's customer")
    void shouldReturn404ForOtherTenantCustomer() {
        // Given - Create customer in different tenant
        UUID otherTenantCustomerId = createCustomerInOtherTenant();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(authToken);
        HttpEntity<?> entity = new HttpEntity<>(headers);

        // When
        ResponseEntity<ErrorResponse> response = restTemplate.exchange(
            "/api/customers/" + otherTenantCustomerId,
            HttpMethod.GET,
            entity,
            ErrorResponse.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
```

---

## End-to-End Tests

### Cypress E2E Tests

#### cypress/e2e/auth.cy.js

```javascript
describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should login with valid credentials', () => {
    cy.get('[data-testid="email-input"]').type('vendor@demo.com');
    cy.get('[data-testid="password-input"]').type('Vendor@123!');
    cy.get('[data-testid="login-button"]').click();

    cy.url().should('include', '/dashboard');
    cy.contains('Welcome').should('be.visible');
  });

  it('should show error for invalid credentials', () => {
    cy.get('[data-testid="email-input"]').type('invalid@example.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();

    cy.contains('Invalid credentials').should('be.visible');
    cy.url().should('include', '/login');
  });

  it('should login with Google OAuth', () => {
    // Mock OAuth flow for testing
    cy.intercept('GET', '/api/auth/oauth/google*', {
      statusCode: 302,
      headers: { Location: '/oauth/callback?code=mock-code' }
    });

    cy.get('[data-testid="google-login-button"]').click();
    
    // Verify redirect happens
    cy.url().should('include', '/oauth/callback');
  });

  it('should logout successfully', () => {
    // Login first
    cy.login('vendor@demo.com', 'Vendor@123!');

    // Logout
    cy.get('[data-testid="user-menu"]').click();
    cy.get('[data-testid="logout-button"]').click();

    cy.url().should('include', '/login');
  });
});
```

#### cypress/e2e/customers.cy.js

```javascript
describe('Customer Management', () => {
  beforeEach(() => {
    cy.login('vendor@demo.com', 'Vendor@123!');
    cy.visit('/customers');
  });

  it('should display customer list', () => {
    cy.get('[data-testid="customer-table"]').should('be.visible');
    cy.get('[data-testid="customer-row"]').should('have.length.greaterThan', 0);
  });

  it('should create new customer', () => {
    cy.get('[data-testid="add-customer-button"]').click();

    cy.get('[data-testid="customer-form"]').within(() => {
      cy.get('[name="name"]').type('Test Customer');
      cy.get('[name="email"]').type('test@example.com');
      cy.get('[name="phone"]').type('+8801712345678');
      cy.get('[name="company"]').type('Test Company');
      cy.get('[type="submit"]').click();
    });

    cy.contains('Customer created successfully').should('be.visible');
    cy.contains('Test Customer').should('be.visible');
  });

  it('should search customers', () => {
    cy.get('[data-testid="search-input"]').type('John');
    
    cy.get('[data-testid="customer-row"]').each(($row) => {
      cy.wrap($row).should('contain.text', 'John');
    });
  });

  it('should filter by tags', () => {
    cy.get('[data-testid="filter-button"]').click();
    cy.get('[data-testid="tag-filter-vip"]').click();

    cy.get('[data-testid="customer-row"]').each(($row) => {
      cy.wrap($row).find('[data-testid="tag-vip"]').should('exist');
    });
  });

  it('should view customer details', () => {
    cy.get('[data-testid="customer-row"]').first().click();

    cy.url().should('include', '/customers/');
    cy.get('[data-testid="customer-detail"]').should('be.visible');
    cy.get('[data-testid="interaction-history"]').should('be.visible');
  });
});
```

#### cypress/e2e/interactions.cy.js

```javascript
describe('Interaction Logging', () => {
  beforeEach(() => {
    cy.login('agent@demo.com', 'Agent@123!');
  });

  it('should log a new interaction', () => {
    cy.visit('/customers');
    cy.get('[data-testid="customer-row"]').first().click();

    cy.get('[data-testid="add-interaction-button"]').click();
    cy.get('[data-testid="interaction-form"]').within(() => {
      cy.get('[name="type"]').select('NOTE');
      cy.get('[name="subject"]').type('Meeting follow-up');
      cy.get('[name="content"]').type('Discussed project requirements...');
      cy.get('[type="submit"]').click();
    });

    cy.contains('Interaction created').should('be.visible');
    cy.get('[data-testid="interaction-list"]')
      .should('contain.text', 'Meeting follow-up');
  });

  it('should initiate a call', () => {
    cy.visit('/customers');
    cy.get('[data-testid="customer-row"]').first().click();
    cy.get('[data-testid="call-button"]').click();

    // Should show call interface
    cy.get('[data-testid="call-modal"]').should('be.visible');
    cy.get('[data-testid="end-call-button"]').should('be.visible');
  });
});
```

---

## Security Tests

### Tenant Isolation Tests

```java
@Test
@DisplayName("Cross-tenant data access should be blocked")
void crossTenantAccessBlocked() {
    // Tenant A's token
    String tenantAToken = loginAs("admin@tenantA.com");
    
    // Tenant B's customer ID
    UUID tenantBCustomerId = createCustomerForTenant("tenantB");
    
    // Try to access with Tenant A's token
    ResponseEntity<ErrorResponse> response = restTemplate.exchange(
        "/api/customers/" + tenantBCustomerId,
        HttpMethod.GET,
        withAuth(tenantAToken),
        ErrorResponse.class
    );
    
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
}

@Test
@DisplayName("SQL injection should be prevented")
void sqlInjectionPrevented() {
    String maliciousInput = "'; DROP TABLE customers; --";
    
    ResponseEntity<?> response = restTemplate.exchange(
        "/api/customers?search=" + URLEncoder.encode(maliciousInput, UTF_8),
        HttpMethod.GET,
        withAuth(authToken),
        PagedResponse.class
    );
    
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    // Verify table still exists
    assertThat(customerRepository.count()).isGreaterThan(0);
}
```

---

## Performance Tests

### Load Testing with k6

```javascript
// k6/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Spike to 200
    { duration: '5m', target: 200 },  // Stay at 200
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],    // Less than 1% failure rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export function setup() {
  // Login and get token
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'load-test@example.com',
    password: 'LoadTest123!'
  }), { headers: { 'Content-Type': 'application/json' } });
  
  return { token: loginRes.json('accessToken') };
}

export default function(data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json'
  };

  // Get customers
  const customersRes = http.get(`${BASE_URL}/api/customers?page=0&size=20`, { headers });
  check(customersRes, {
    'customers status 200': (r) => r.status === 200,
    'customers response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Get interactions
  const interactionsRes = http.get(`${BASE_URL}/api/interactions?page=0&size=20`, { headers });
  check(interactionsRes, {
    'interactions status 200': (r) => r.status === 200,
  });

  sleep(1);
}
```

---

## Mobile Tests (Espresso)

### Android Test Example

```java
@RunWith(AndroidJUnit4.class)
@LargeTest
public class LoginActivityTest {

    @Rule
    public ActivityScenarioRule<LoginActivity> activityRule =
        new ActivityScenarioRule<>(LoginActivity.class);

    @Test
    public void loginWithValidCredentials() {
        // Enter email
        onView(withId(R.id.et_email))
            .perform(typeText("vendor@demo.com"), closeSoftKeyboard());

        // Enter password
        onView(withId(R.id.et_password))
            .perform(typeText("Vendor@123!"), closeSoftKeyboard());

        // Click login
        onView(withId(R.id.btn_login))
            .perform(click());

        // Verify navigation to main activity
        intended(hasComponent(MainActivity.class.getName()));
    }

    @Test
    public void loginWithInvalidCredentials() {
        onView(withId(R.id.et_email))
            .perform(typeText("invalid@example.com"), closeSoftKeyboard());

        onView(withId(R.id.et_password))
            .perform(typeText("wrongpassword"), closeSoftKeyboard());

        onView(withId(R.id.btn_login))
            .perform(click());

        // Verify error message
        onView(withText("Invalid credentials"))
            .check(matches(isDisplayed()));
    }
}
```

---

## Test Data Management

### Test Fixtures

```java
// TestDataFactory.java
public class TestDataFactory {
    
    public static Tenant createTenant(String name) {
        return Tenant.builder()
            .id(UUID.randomUUID())
            .name(name)
            .subdomain(name.toLowerCase().replaceAll("\\s+", "-"))
            .plan(TenantPlan.PROFESSIONAL)
            .status(TenantStatus.ACTIVE)
            .build();
    }
    
    public static User createUser(UUID tenantId, Role role) {
        return User.builder()
            .id(UUID.randomUUID())
            .tenantId(tenantId)
            .email(UUID.randomUUID() + "@test.com")
            .name("Test User")
            .role(role)
            .isActive(true)
            .build();
    }
    
    public static Customer createCustomer(UUID tenantId) {
        return Customer.builder()
            .id(UUID.randomUUID())
            .tenantId(tenantId)
            .name("Test Customer")
            .email(UUID.randomUUID() + "@customer.com")
            .phone("+8801700000000")
            .build();
    }
}
```

---

## Running Tests

### Commands

```bash
# Backend Tests
cd backend
./mvnw test                           # Unit tests
./mvnw verify -Pintegration-tests    # Integration tests
./mvnw jacoco:report                  # Coverage report

# Frontend Tests
cd frontend
npm test                              # Unit tests
npm run test:coverage                # With coverage
npm run test:e2e                     # Cypress E2E

# Mobile Tests
cd mobile/android
./gradlew test                        # Unit tests
./gradlew connectedAndroidTest       # Instrumented tests

# Load Tests
k6 run k6/load-test.js --env BASE_URL=http://staging.neobit.com
```

---

**Test Plan Version:** 1.0  
**Last Updated:** 2024-01-15  
**Maintained by:** NeoBit Team


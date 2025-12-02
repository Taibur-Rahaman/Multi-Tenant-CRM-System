package com.neobit.crm.service;

import com.neobit.crm.dto.common.PageResponse;
import com.neobit.crm.dto.customer.CreateCustomerRequest;
import com.neobit.crm.dto.customer.CustomerDTO;
import com.neobit.crm.entity.Customer;
import com.neobit.crm.entity.Tenant;
import com.neobit.crm.mapper.CustomerMapper;
import com.neobit.crm.repository.*;
import com.neobit.crm.security.TenantContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CustomerService
 * Tests UC-3: Manage Customers
 */
@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;
    
    @Mock
    private TenantRepository tenantRepository;
    
    @Mock
    private AccountRepository accountRepository;
    
    @Mock
    private UserRepository userRepository;

    @Mock
    private CustomerMapper customerMapper;
    
    @Mock
    private TelegramNotificationService telegramNotificationService;
    
    @Mock
    private WebSocketNotificationService webSocketNotificationService;

    @InjectMocks
    private CustomerService customerService;

    private UUID tenantId;
    private UUID customerId;
    private Customer testCustomer;
    private CustomerDTO testCustomerDTO;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        customerId = UUID.randomUUID();
        
        Tenant tenant = Tenant.builder()
                .id(tenantId)
                .name("Test Tenant")
                .slug("test")
                .build();

        testCustomer = Customer.builder()
                .id(customerId)
                .tenant(tenant)
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .phone("+1234567890")
                .build();

        testCustomerDTO = new CustomerDTO();
        testCustomerDTO.setId(customerId);
        testCustomerDTO.setFirstName("John");
        testCustomerDTO.setLastName("Doe");
        testCustomerDTO.setEmail("john.doe@example.com");

        // Set tenant context
        TenantContext.setCurrentTenant(tenantId);
    }

    @Test
    void getAllCustomers_ShouldReturnPageOfCustomers() {
        // Arrange
        PageRequest pageable = PageRequest.of(0, 10);
        Page<Customer> customerPage = new PageImpl<>(List.of(testCustomer));
        
        when(customerRepository.findByTenantId(tenantId, pageable)).thenReturn(customerPage);
        when(customerMapper.toDTO(any(Customer.class))).thenReturn(testCustomerDTO);

        // Act
        PageResponse<CustomerDTO> result = customerService.getCustomers(pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(customerRepository).findByTenantId(tenantId, pageable);
    }

    @Test
    void getCustomerById_WhenExists_ShouldReturnCustomer() {
        // Arrange
        when(customerRepository.findByIdAndTenantId(customerId, tenantId))
                .thenReturn(Optional.of(testCustomer));
        when(customerMapper.toDTO(testCustomer)).thenReturn(testCustomerDTO);

        // Act
        CustomerDTO result = customerService.getCustomerById(customerId);

        // Assert
        assertNotNull(result);
        assertEquals("John", result.getFirstName());
        assertEquals("Doe", result.getLastName());
    }

    @Test
    void createCustomer_ShouldReturnCreatedCustomer() {
        // Arrange
        CreateCustomerRequest request = new CreateCustomerRequest();
        request.setFirstName("Jane");
        request.setLastName("Smith");
        request.setEmail("jane.smith@example.com");

        Tenant tenant = Tenant.builder()
                .id(tenantId)
                .name("Test Tenant")
                .slug("test")
                .build();
        
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(customerRepository.save(any(Customer.class))).thenReturn(testCustomer);
        when(customerMapper.toDTO(any(Customer.class))).thenReturn(testCustomerDTO);

        // Act
        CustomerDTO result = customerService.createCustomer(request);

        // Assert
        assertNotNull(result);
        verify(customerRepository).save(any(Customer.class));
    }

    @Test
    void deleteCustomer_WhenExists_ShouldDelete() {
        // Arrange
        when(customerRepository.findByIdAndTenantId(customerId, tenantId))
                .thenReturn(Optional.of(testCustomer));

        // Act
        customerService.deleteCustomer(customerId);

        // Assert
        verify(customerRepository).delete(testCustomer);
    }
}


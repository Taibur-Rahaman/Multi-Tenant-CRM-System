package com.neobit.crm.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neobit.crm.dto.customer.CreateCustomerRequest;
import com.neobit.crm.dto.customer.CustomerDTO;
import com.neobit.crm.service.CustomerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for CustomerController
 * Tests REST API endpoints for customer management
 */
@WebMvcTest(CustomerController.class)
class CustomerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CustomerService customerService;

    private CustomerDTO testCustomerDTO;
    private UUID customerId;

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();
        
        testCustomerDTO = new CustomerDTO();
        testCustomerDTO.setId(customerId);
        testCustomerDTO.setFirstName("John");
        testCustomerDTO.setLastName("Doe");
        testCustomerDTO.setEmail("john.doe@example.com");
        testCustomerDTO.setPhone("+1234567890");
    }

    @Test
    @WithMockUser(roles = "AGENT")
    void getAllCustomers_ShouldReturnPageOfCustomers() throws Exception {
        // Arrange
        Page<CustomerDTO> customerPage = new PageImpl<>(List.of(testCustomerDTO));
        when(customerService.getAllCustomers(any(PageRequest.class))).thenReturn(customerPage);

        // Act & Assert
        mockMvc.perform(get("/customers")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].firstName").value("John"));
    }

    @Test
    @WithMockUser(roles = "AGENT")
    void getCustomerById_WhenExists_ShouldReturnCustomer() throws Exception {
        // Arrange
        when(customerService.getCustomerById(customerId)).thenReturn(testCustomerDTO);

        // Act & Assert
        mockMvc.perform(get("/customers/{id}", customerId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.firstName").value("John"))
                .andExpect(jsonPath("$.data.lastName").value("Doe"));
    }

    @Test
    @WithMockUser(roles = "AGENT")
    void createCustomer_WithValidData_ShouldReturnCreated() throws Exception {
        // Arrange
        CreateCustomerRequest request = new CreateCustomerRequest();
        request.setFirstName("Jane");
        request.setLastName("Smith");
        request.setEmail("jane.smith@example.com");

        when(customerService.createCustomer(any(CreateCustomerRequest.class)))
                .thenReturn(testCustomerDTO);

        // Act & Assert
        mockMvc.perform(post("/customers")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "AGENT")
    void deleteCustomer_ShouldReturnSuccess() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/customers/{id}", customerId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}


package com.neobit.crm.controller;

import com.neobit.crm.dto.common.ApiResponse;
import com.neobit.crm.dto.common.PageResponse;
import com.neobit.crm.dto.customer.CreateCustomerRequest;
import com.neobit.crm.dto.customer.CustomerDTO;
import com.neobit.crm.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/customers")
@RequiredArgsConstructor
@Tag(name = "Customers", description = "Customer management endpoints")
public class CustomerController {
    
    private final CustomerService customerService;
    
    @GetMapping
    @Operation(summary = "Get all customers")
    public ResponseEntity<ApiResponse<PageResponse<CustomerDTO>>> getCustomers(Pageable pageable) {
        PageResponse<CustomerDTO> customers = customerService.getCustomers(pageable);
        return ResponseEntity.ok(ApiResponse.success(customers));
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get customer by ID")
    public ResponseEntity<ApiResponse<CustomerDTO>> getCustomerById(@PathVariable UUID id) {
        CustomerDTO customer = customerService.getCustomerById(id);
        return ResponseEntity.ok(ApiResponse.success(customer));
    }
    
    @GetMapping("/search")
    @Operation(summary = "Search customers")
    public ResponseEntity<ApiResponse<PageResponse<CustomerDTO>>> searchCustomers(
            @RequestParam String q,
            Pageable pageable) {
        PageResponse<CustomerDTO> customers = customerService.searchCustomers(q, pageable);
        return ResponseEntity.ok(ApiResponse.success(customers));
    }
    
    @GetMapping("/leads")
    @Operation(summary = "Get all leads")
    public ResponseEntity<ApiResponse<PageResponse<CustomerDTO>>> getLeads(Pageable pageable) {
        PageResponse<CustomerDTO> leads = customerService.getLeads(pageable);
        return ResponseEntity.ok(ApiResponse.success(leads));
    }
    
    @GetMapping("/status/{status}")
    @Operation(summary = "Get customers by lead status")
    public ResponseEntity<ApiResponse<PageResponse<CustomerDTO>>> getCustomersByStatus(
            @PathVariable String status,
            Pageable pageable) {
        PageResponse<CustomerDTO> customers = customerService.getCustomersByStatus(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(customers));
    }
    
    @PostMapping
    @Operation(summary = "Create a new customer")
    public ResponseEntity<ApiResponse<CustomerDTO>> createCustomer(@Valid @RequestBody CreateCustomerRequest request) {
        CustomerDTO customer = customerService.createCustomer(request);
        return ResponseEntity.ok(ApiResponse.success("Customer created successfully", customer));
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Update customer")
    public ResponseEntity<ApiResponse<CustomerDTO>> updateCustomer(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCustomerRequest request) {
        CustomerDTO customer = customerService.updateCustomer(id, request);
        return ResponseEntity.ok(ApiResponse.success("Customer updated successfully", customer));
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete customer")
    public ResponseEntity<ApiResponse<Void>> deleteCustomer(@PathVariable UUID id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.ok(ApiResponse.success("Customer deleted successfully", null));
    }
}


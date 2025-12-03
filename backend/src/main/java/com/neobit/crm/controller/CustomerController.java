package com.neobit.crm.controller;

import com.neobit.crm.dto.request.*;
import com.neobit.crm.dto.response.*;
import com.neobit.crm.security.TenantContext;
import com.neobit.crm.security.UserPrincipal;
import com.neobit.crm.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Customer Controller
 * 
 * Handles customer management:
 * - CRUD operations
 * - Search and filtering
 * - Import/Export
 * - Assignment
 */
@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Customers", description = "Customer management endpoints")
public class CustomerController {

    private final CustomerService customerService;

    /**
     * List customers with filtering and pagination
     * 
     * GET /api/customers?page=0&size=20&search=john&tags=vip,enterprise
     * 
     * Response:
     * {
     *   "content": [{ "id": "...", "name": "John Doe", ... }],
     *   "page": 0,
     *   "size": 20,
     *   "totalElements": 150,
     *   "totalPages": 8
     * }
     */
    @GetMapping
    @Operation(summary = "List customers with filtering")
    public ResponseEntity<Page<CustomerResponse>> listCustomers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) List<String> tags,
            @RequestParam(required = false) UUID assignedTo,
            Pageable pageable) {
        
        log.debug("Listing customers - search: {}, tags: {}, assignedTo: {}", 
            search, tags, assignedTo);
        
        UUID tenantId = TenantContext.getTenantId();
        
        Page<CustomerResponse> customers = customerService.listCustomers(
            tenantId, search, tags, assignedTo, pageable
        );
        
        return ResponseEntity.ok(customers);
    }

    /**
     * Get customer by ID
     * 
     * GET /api/customers/{id}
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get customer details")
    public ResponseEntity<CustomerDetailResponse> getCustomer(@PathVariable UUID id) {
        
        log.debug("Getting customer: {}", id);
        
        UUID tenantId = TenantContext.getTenantId();
        
        CustomerDetailResponse customer = customerService.getCustomerById(tenantId, id);
        
        return ResponseEntity.ok(customer);
    }

    /**
     * Create new customer
     * 
     * POST /api/customers
     * 
     * Request:
     * {
     *   "name": "Jane Smith",
     *   "email": "jane@example.com",
     *   "phone": "+8801712345678",
     *   "company": "Example Inc",
     *   "tags": ["new", "lead"],
     *   "metadata": { "source": "website" }
     * }
     */
    @PostMapping
    @Operation(summary = "Create new customer")
    public ResponseEntity<CustomerResponse> createCustomer(
            @Valid @RequestBody CreateCustomerRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Creating customer: {} by user: {}", 
            request.getName(), principal.getEmail());
        
        UUID tenantId = TenantContext.getTenantId();
        
        CustomerResponse customer = customerService.createCustomer(tenantId, request);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(customer);
    }

    /**
     * Update customer
     * 
     * PUT /api/customers/{id}
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update customer")
    public ResponseEntity<CustomerResponse> updateCustomer(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCustomerRequest request) {
        
        log.info("Updating customer: {}", id);
        
        UUID tenantId = TenantContext.getTenantId();
        
        CustomerResponse customer = customerService.updateCustomer(tenantId, id, request);
        
        return ResponseEntity.ok(customer);
    }

    /**
     * Delete customer (soft delete)
     * 
     * DELETE /api/customers/{id}
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete customer")
    public ResponseEntity<Void> deleteCustomer(@PathVariable UUID id) {
        
        log.warn("Deleting customer: {}", id);
        
        UUID tenantId = TenantContext.getTenantId();
        
        customerService.deleteCustomer(tenantId, id);
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Assign customer to agent
     * 
     * PUT /api/customers/{id}/assign
     */
    @PutMapping("/{id}/assign")
    @Operation(summary = "Assign customer to agent")
    public ResponseEntity<CustomerResponse> assignCustomer(
            @PathVariable UUID id,
            @RequestBody AssignCustomerRequest request) {
        
        log.info("Assigning customer {} to user {}", id, request.getUserId());
        
        UUID tenantId = TenantContext.getTenantId();
        
        CustomerResponse customer = customerService.assignCustomer(
            tenantId, id, request.getUserId()
        );
        
        return ResponseEntity.ok(customer);
    }

    /**
     * Add tags to customer
     * 
     * POST /api/customers/{id}/tags
     */
    @PostMapping("/{id}/tags")
    @Operation(summary = "Add tags to customer")
    public ResponseEntity<CustomerResponse> addTags(
            @PathVariable UUID id,
            @RequestBody TagsRequest request) {
        
        UUID tenantId = TenantContext.getTenantId();
        
        CustomerResponse customer = customerService.addTags(tenantId, id, request.getTags());
        
        return ResponseEntity.ok(customer);
    }

    /**
     * Remove tags from customer
     * 
     * DELETE /api/customers/{id}/tags
     */
    @DeleteMapping("/{id}/tags")
    @Operation(summary = "Remove tags from customer")
    public ResponseEntity<CustomerResponse> removeTags(
            @PathVariable UUID id,
            @RequestBody TagsRequest request) {
        
        UUID tenantId = TenantContext.getTenantId();
        
        CustomerResponse customer = customerService.removeTags(tenantId, id, request.getTags());
        
        return ResponseEntity.ok(customer);
    }

    /**
     * Get customer interactions
     * 
     * GET /api/customers/{id}/interactions
     */
    @GetMapping("/{id}/interactions")
    @Operation(summary = "Get customer interactions")
    public ResponseEntity<Page<InteractionResponse>> getCustomerInteractions(
            @PathVariable UUID id,
            @RequestParam(required = false) String type,
            Pageable pageable) {
        
        UUID tenantId = TenantContext.getTenantId();
        
        Page<InteractionResponse> interactions = customerService.getCustomerInteractions(
            tenantId, id, type, pageable
        );
        
        return ResponseEntity.ok(interactions);
    }

    /**
     * Import customers from CSV
     * 
     * POST /api/customers/import
     */
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Import customers from CSV")
    public ResponseEntity<ImportResponse> importCustomers(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false, defaultValue = "true") boolean skipHeader,
            @AuthenticationPrincipal UserPrincipal principal) throws IOException {
        
        log.info("Importing customers from file: {} by user: {}", 
            file.getOriginalFilename(), principal.getEmail());
        
        UUID tenantId = TenantContext.getTenantId();
        
        ImportResponse response = customerService.importCustomers(
            tenantId, file, skipHeader, principal.getId()
        );
        
        return ResponseEntity.accepted().body(response);
    }

    /**
     * Export customers to CSV
     * 
     * GET /api/customers/export?format=csv&search=...
     */
    @GetMapping("/export")
    @Operation(summary = "Export customers to CSV")
    public void exportCustomers(
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) List<String> tags,
            @RequestParam(required = false) List<String> fields,
            HttpServletResponse response) throws IOException {
        
        log.info("Exporting customers to {}", format);
        
        UUID tenantId = TenantContext.getTenantId();
        
        // Set response headers
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", 
            "attachment; filename=\"customers_export.csv\"");
        
        customerService.exportCustomers(
            tenantId, format, search, tags, fields, response.getOutputStream()
        );
    }

    /**
     * Get import status
     * 
     * GET /api/customers/import/{importId}
     */
    @GetMapping("/import/{importId}")
    @Operation(summary = "Get import status")
    public ResponseEntity<ImportResponse> getImportStatus(@PathVariable UUID importId) {
        
        UUID tenantId = TenantContext.getTenantId();
        
        ImportResponse response = customerService.getImportStatus(tenantId, importId);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Merge duplicate customers
     * 
     * POST /api/customers/merge
     */
    @PostMapping("/merge")
    @Operation(summary = "Merge duplicate customers")
    public ResponseEntity<CustomerResponse> mergeCustomers(
            @Valid @RequestBody MergeCustomersRequest request) {
        
        log.info("Merging customers: {} into {}", 
            request.getSourceIds(), request.getTargetId());
        
        UUID tenantId = TenantContext.getTenantId();
        
        CustomerResponse customer = customerService.mergeCustomers(
            tenantId, request.getTargetId(), request.getSourceIds()
        );
        
        return ResponseEntity.ok(customer);
    }
}

// ============================================================
// Request/Response DTOs (would be in separate files)
// ============================================================

/*
// CreateCustomerRequest.java
@Data
public class CreateCustomerRequest {
    @NotBlank
    private String name;
    
    @Email
    private String email;
    
    private String phone;
    
    private String company;
    
    private AddressDto address;
    
    private List<String> tags;
    
    private UUID assignedTo;
    
    private Map<String, Object> metadata;
}

// UpdateCustomerRequest.java
@Data
public class UpdateCustomerRequest {
    private String name;
    private String email;
    private String phone;
    private String company;
    private AddressDto address;
    private List<String> tags;
    private UUID assignedTo;
    private Map<String, Object> metadata;
}

// CustomerResponse.java
@Data
@Builder
public class CustomerResponse {
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private String company;
    private List<String> tags;
    private UserSummary assignedTo;
    private Map<String, Object> metadata;
    private LocalDateTime lastInteractionAt;
    private LocalDateTime createdAt;
}

// CustomerDetailResponse.java
@Data
@Builder
public class CustomerDetailResponse {
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private String company;
    private AddressDto address;
    private List<String> tags;
    private UserSummary assignedTo;
    private Map<String, Object> metadata;
    private CustomerStats stats;
    private List<InteractionSummary> recentInteractions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

// ImportResponse.java
@Data
@Builder
public class ImportResponse {
    private UUID importId;
    private String status; // PROCESSING, COMPLETED, FAILED
    private int totalRows;
    private int successCount;
    private int errorCount;
    private List<String> errors;
    private String message;
}

// MergeCustomersRequest.java
@Data
public class MergeCustomersRequest {
    @NotNull
    private UUID targetId;
    
    @NotEmpty
    private List<UUID> sourceIds;
}
*/


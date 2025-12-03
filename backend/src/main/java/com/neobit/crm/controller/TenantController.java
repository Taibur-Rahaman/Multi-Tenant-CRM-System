package com.neobit.crm.controller;

import com.neobit.crm.dto.request.*;
import com.neobit.crm.dto.response.*;
import com.neobit.crm.security.UserPrincipal;
import com.neobit.crm.service.TenantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Tenant Controller
 * 
 * Handles tenant/vendor management:
 * - List tenants (Platform Admin only)
 * - Get tenant details
 * - Update tenant settings
 * - Manage tenant users
 */
@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tenants", description = "Tenant management endpoints")
public class TenantController {

    private final TenantService tenantService;

    /**
     * List all tenants (Platform Admin only)
     * 
     * GET /api/tenants?page=0&size=20&search=...&status=ACTIVE
     */
    @GetMapping
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "List all tenants (Platform Admin only)")
    public ResponseEntity<Page<TenantResponse>> listTenants(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        
        log.debug("Listing tenants with search: {}, status: {}", search, status);
        
        Page<TenantResponse> tenants = tenantService.listTenants(search, status, pageable);
        
        return ResponseEntity.ok(tenants);
    }

    /**
     * Get tenant by ID
     * 
     * GET /api/tenants/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('PLATFORM_ADMIN') or @tenantSecurity.isSameTenant(#id)")
    @Operation(summary = "Get tenant details")
    public ResponseEntity<TenantResponse> getTenant(@PathVariable UUID id) {
        
        log.debug("Getting tenant: {}", id);
        
        TenantResponse tenant = tenantService.getTenantById(id);
        
        return ResponseEntity.ok(tenant);
    }

    /**
     * Get current tenant (for logged-in user)
     * 
     * GET /api/tenants/current
     */
    @GetMapping("/current")
    @Operation(summary = "Get current user's tenant")
    public ResponseEntity<TenantResponse> getCurrentTenant(
            @AuthenticationPrincipal UserPrincipal principal) {
        
        TenantResponse tenant = tenantService.getTenantById(principal.getTenantId());
        
        return ResponseEntity.ok(tenant);
    }

    /**
     * Create new tenant (Platform Admin only)
     * 
     * POST /api/tenants
     */
    @PostMapping
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Create new tenant (Platform Admin only)")
    public ResponseEntity<TenantResponse> createTenant(
            @Valid @RequestBody CreateTenantRequest request) {
        
        log.info("Creating new tenant: {}", request.getName());
        
        TenantResponse tenant = tenantService.createTenant(request);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(tenant);
    }

    /**
     * Update tenant
     * 
     * PUT /api/tenants/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PLATFORM_ADMIN') or (@tenantSecurity.isSameTenant(#id) and hasRole('VENDOR_ADMIN'))")
    @Operation(summary = "Update tenant settings")
    public ResponseEntity<TenantResponse> updateTenant(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTenantRequest request) {
        
        log.info("Updating tenant: {}", id);
        
        TenantResponse tenant = tenantService.updateTenant(id, request);
        
        return ResponseEntity.ok(tenant);
    }

    /**
     * Delete/Suspend tenant (Platform Admin only)
     * 
     * DELETE /api/tenants/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Suspend tenant (Platform Admin only)")
    public ResponseEntity<Void> deleteTenant(@PathVariable UUID id) {
        
        log.warn("Suspending tenant: {}", id);
        
        tenantService.suspendTenant(id);
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Get tenant statistics
     * 
     * GET /api/tenants/{id}/stats
     */
    @GetMapping("/{id}/stats")
    @PreAuthorize("hasRole('PLATFORM_ADMIN') or @tenantSecurity.isSameTenant(#id)")
    @Operation(summary = "Get tenant statistics")
    public ResponseEntity<TenantStatsResponse> getTenantStats(@PathVariable UUID id) {
        
        TenantStatsResponse stats = tenantService.getTenantStats(id);
        
        return ResponseEntity.ok(stats);
    }

    /**
     * List users in tenant
     * 
     * GET /api/tenants/{id}/users
     */
    @GetMapping("/{id}/users")
    @PreAuthorize("hasRole('PLATFORM_ADMIN') or (@tenantSecurity.isSameTenant(#id) and hasRole('VENDOR_ADMIN'))")
    @Operation(summary = "List users in tenant")
    public ResponseEntity<Page<UserResponse>> listTenantUsers(
            @PathVariable UUID id,
            @RequestParam(required = false) String role,
            Pageable pageable) {
        
        Page<UserResponse> users = tenantService.listTenantUsers(id, role, pageable);
        
        return ResponseEntity.ok(users);
    }

    /**
     * Update tenant plan (Platform Admin only)
     * 
     * PUT /api/tenants/{id}/plan
     */
    @PutMapping("/{id}/plan")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    @Operation(summary = "Update tenant plan")
    public ResponseEntity<TenantResponse> updateTenantPlan(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePlanRequest request) {
        
        log.info("Updating plan for tenant {} to {}", id, request.getPlan());
        
        TenantResponse tenant = tenantService.updatePlan(id, request.getPlan());
        
        return ResponseEntity.ok(tenant);
    }
}

// ============================================================
// Request/Response DTOs (would be in separate files)
// ============================================================

/*
// CreateTenantRequest.java
@Data
public class CreateTenantRequest {
    @NotBlank
    private String name;
    
    @NotBlank
    @Pattern(regexp = "^[a-z0-9-]+$")
    private String subdomain;
    
    private String plan = "FREE";
    
    @NotBlank @Email
    private String adminEmail;
    
    @NotBlank
    private String adminName;
}

// UpdateTenantRequest.java
@Data
public class UpdateTenantRequest {
    private String name;
    private Map<String, Object> settings;
}

// TenantResponse.java
@Data
@Builder
public class TenantResponse {
    private UUID id;
    private String name;
    private String subdomain;
    private String plan;
    private String status;
    private Map<String, Object> settings;
    private Map<String, Object> limits;
    private int userCount;
    private int customerCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

// TenantStatsResponse.java
@Data
@Builder
public class TenantStatsResponse {
    private UUID tenantId;
    private int totalUsers;
    private int totalCustomers;
    private int totalInteractions;
    private long storageUsedBytes;
    private Map<String, Integer> interactionsByType;
    private Map<String, Integer> interactionsByChannel;
}
*/


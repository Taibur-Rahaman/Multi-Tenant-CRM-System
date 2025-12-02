package com.neobit.crm.controller;

import com.neobit.crm.dto.common.ApiResponse;
import com.neobit.crm.dto.tenant.CreateTenantRequest;
import com.neobit.crm.dto.tenant.TenantDTO;
import com.neobit.crm.service.TenantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/tenants")
@RequiredArgsConstructor
@Tag(name = "Tenants", description = "Tenant management endpoints")
public class TenantController {
    
    private final TenantService tenantService;
    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all tenants (Admin only)")
    public ResponseEntity<ApiResponse<Page<TenantDTO>>> getAllTenants(Pageable pageable) {
        Page<TenantDTO> tenants = tenantService.getAllTenants(pageable);
        return ResponseEntity.ok(ApiResponse.success(tenants));
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get tenant by ID")
    public ResponseEntity<ApiResponse<TenantDTO>> getTenantById(@PathVariable UUID id) {
        TenantDTO tenant = tenantService.getTenantById(id);
        return ResponseEntity.ok(ApiResponse.success(tenant));
    }
    
    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get tenant by slug")
    public ResponseEntity<ApiResponse<TenantDTO>> getTenantBySlug(@PathVariable String slug) {
        TenantDTO tenant = tenantService.getTenantBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(tenant));
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new tenant (Admin only)")
    public ResponseEntity<ApiResponse<TenantDTO>> createTenant(@Valid @RequestBody CreateTenantRequest request) {
        TenantDTO tenant = tenantService.createTenant(request);
        return ResponseEntity.ok(ApiResponse.success("Tenant created successfully", tenant));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update tenant (Admin only)")
    public ResponseEntity<ApiResponse<TenantDTO>> updateTenant(
            @PathVariable UUID id,
            @Valid @RequestBody CreateTenantRequest request) {
        TenantDTO tenant = tenantService.updateTenant(id, request);
        return ResponseEntity.ok(ApiResponse.success("Tenant updated successfully", tenant));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete tenant (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteTenant(@PathVariable UUID id) {
        tenantService.deleteTenant(id);
        return ResponseEntity.ok(ApiResponse.success("Tenant deleted successfully", null));
    }
}


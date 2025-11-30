package com.neobit.crm.dto.tenant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CreateTenantRequest {
    
    @NotBlank(message = "Tenant name is required")
    private String name;
    
    @NotBlank(message = "Slug is required")
    @Pattern(regexp = "^[a-z0-9-]+$", message = "Slug must contain only lowercase letters, numbers, and hyphens")
    private String slug;
    
    private String domain;
    
    private String logoUrl;
    
    private String subscriptionPlan;
    
    // Admin user details for the new tenant
    @NotBlank(message = "Admin email is required")
    private String adminEmail;
    
    @NotBlank(message = "Admin password is required")
    private String adminPassword;
    
    private String adminFirstName;
    private String adminLastName;
}


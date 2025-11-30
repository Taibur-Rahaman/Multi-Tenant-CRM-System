package com.neobit.crm.security;

import java.util.UUID;

/**
 * Thread-local context for storing current tenant information.
 * Used for multi-tenant data isolation.
 */
public class TenantContext {
    
    private static final ThreadLocal<UUID> currentTenant = new ThreadLocal<>();
    
    public static void setCurrentTenant(UUID tenantId) {
        currentTenant.set(tenantId);
    }
    
    public static UUID getCurrentTenant() {
        return currentTenant.get();
    }
    
    public static void clear() {
        currentTenant.remove();
    }
}


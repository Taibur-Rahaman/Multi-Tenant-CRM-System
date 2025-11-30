package com.neobit.crm.mapper;

import com.neobit.crm.dto.tenant.TenantDTO;
import com.neobit.crm.entity.Tenant;
import org.springframework.stereotype.Component;

@Component
public class TenantMapper {
    
    public TenantDTO toDTO(Tenant tenant) {
        if (tenant == null) return null;
        
        return TenantDTO.builder()
                .id(tenant.getId())
                .name(tenant.getName())
                .slug(tenant.getSlug())
                .domain(tenant.getDomain())
                .logoUrl(tenant.getLogoUrl())
                .settings(tenant.getSettings())
                .subscriptionPlan(tenant.getSubscriptionPlan())
                .subscriptionStatus(tenant.getSubscriptionStatus())
                .maxUsers(tenant.getMaxUsers())
                .isActive(tenant.getIsActive())
                .createdAt(tenant.getCreatedAt())
                .build();
    }
}


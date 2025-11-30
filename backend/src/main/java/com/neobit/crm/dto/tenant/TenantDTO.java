package com.neobit.crm.dto.tenant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantDTO {
    
    private UUID id;
    private String name;
    private String slug;
    private String domain;
    private String logoUrl;
    private Map<String, Object> settings;
    private String subscriptionPlan;
    private String subscriptionStatus;
    private Integer maxUsers;
    private Boolean isActive;
    private Instant createdAt;
}


package com.neobit.crm.dto.account;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountDTO {
    
    private UUID id;
    private String name;
    private String industry;
    private String website;
    private String phone;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private BigDecimal annualRevenue;
    private Integer employeeCount;
    private String description;
    private UUID ownerId;
    private String ownerName;
    private String status;
    private List<String> tags;
    private Map<String, Object> customFields;
    private Integer customerCount;
    private Instant createdAt;
    private Instant updatedAt;
}


package com.neobit.crm.dto.account;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
public class CreateAccountRequest {
    
    @NotBlank(message = "Account name is required")
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
    private List<String> tags;
    private Map<String, Object> customFields;
}


package com.neobit.crm.dto.customer;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
public class CreateCustomerRequest {
    
    @NotBlank(message = "First name is required")
    private String firstName;
    
    private String lastName;
    private String email;
    private String phone;
    private String mobile;
    private String jobTitle;
    private String department;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private String leadSource;
    private String leadStatus;
    private UUID accountId;
    private UUID ownerId;
    private Boolean isLead;
    private List<String> tags;
    private Map<String, Object> customFields;
}


package com.neobit.crm.dto.customer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDTO {
    
    private UUID id;
    private UUID accountId;
    private String accountName;
    private String firstName;
    private String lastName;
    private String fullName;
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
    private Integer leadScore;
    private Boolean isLead;
    private UUID ownerId;
    private String ownerName;
    private List<String> tags;
    private Map<String, Object> customFields;
    private Instant lastContactedAt;
    private Integer interactionCount;
    private Instant createdAt;
    private Instant updatedAt;
}


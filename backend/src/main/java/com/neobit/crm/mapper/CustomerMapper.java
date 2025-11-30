package com.neobit.crm.mapper;

import com.neobit.crm.dto.customer.CustomerDTO;
import com.neobit.crm.entity.Customer;
import org.springframework.stereotype.Component;

@Component
public class CustomerMapper {
    
    public CustomerDTO toDTO(Customer customer) {
        if (customer == null) return null;
        
        return CustomerDTO.builder()
                .id(customer.getId())
                .accountId(customer.getAccount() != null ? customer.getAccount().getId() : null)
                .accountName(customer.getAccount() != null ? customer.getAccount().getName() : null)
                .firstName(customer.getFirstName())
                .lastName(customer.getLastName())
                .fullName(customer.getFullName())
                .email(customer.getEmail())
                .phone(customer.getPhone())
                .mobile(customer.getMobile())
                .jobTitle(customer.getJobTitle())
                .department(customer.getDepartment())
                .addressLine1(customer.getAddressLine1())
                .addressLine2(customer.getAddressLine2())
                .city(customer.getCity())
                .state(customer.getState())
                .country(customer.getCountry())
                .postalCode(customer.getPostalCode())
                .leadSource(customer.getLeadSource())
                .leadStatus(customer.getLeadStatus())
                .leadScore(customer.getLeadScore())
                .isLead(customer.getIsLead())
                .ownerId(customer.getOwner() != null ? customer.getOwner().getId() : null)
                .ownerName(customer.getOwner() != null ? customer.getOwner().getFullName() : null)
                .tags(customer.getTags())
                .customFields(customer.getCustomFields())
                .lastContactedAt(customer.getLastContactedAt())
                .interactionCount(customer.getInteractions() != null ? customer.getInteractions().size() : 0)
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .build();
    }
}


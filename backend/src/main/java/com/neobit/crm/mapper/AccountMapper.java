package com.neobit.crm.mapper;

import com.neobit.crm.dto.account.AccountDTO;
import com.neobit.crm.entity.Account;
import org.springframework.stereotype.Component;

@Component
public class AccountMapper {
    
    public AccountDTO toDTO(Account account) {
        if (account == null) return null;
        
        return AccountDTO.builder()
                .id(account.getId())
                .name(account.getName())
                .industry(account.getIndustry())
                .website(account.getWebsite())
                .phone(account.getPhone())
                .addressLine1(account.getAddressLine1())
                .addressLine2(account.getAddressLine2())
                .city(account.getCity())
                .state(account.getState())
                .country(account.getCountry())
                .postalCode(account.getPostalCode())
                .annualRevenue(account.getAnnualRevenue())
                .employeeCount(account.getEmployeeCount())
                .description(account.getDescription())
                .ownerId(account.getOwner() != null ? account.getOwner().getId() : null)
                .ownerName(account.getOwner() != null ? account.getOwner().getFullName() : null)
                .status(account.getStatus())
                .tags(account.getTags())
                .customFields(account.getCustomFields())
                .customerCount(account.getCustomers() != null ? account.getCustomers().size() : 0)
                .createdAt(account.getCreatedAt())
                .updatedAt(account.getUpdatedAt())
                .build();
    }
}


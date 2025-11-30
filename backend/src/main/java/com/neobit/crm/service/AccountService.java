package com.neobit.crm.service;

import com.neobit.crm.dto.account.AccountDTO;
import com.neobit.crm.dto.account.CreateAccountRequest;
import com.neobit.crm.dto.common.PageResponse;
import com.neobit.crm.entity.Account;
import com.neobit.crm.entity.Tenant;
import com.neobit.crm.entity.User;
import com.neobit.crm.exception.ResourceNotFoundException;
import com.neobit.crm.mapper.AccountMapper;
import com.neobit.crm.repository.AccountRepository;
import com.neobit.crm.repository.TenantRepository;
import com.neobit.crm.repository.UserRepository;
import com.neobit.crm.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountService {
    
    private final AccountRepository accountRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final AccountMapper accountMapper;
    
    public PageResponse<AccountDTO> getAccounts(Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<Account> page = accountRepository.findByTenantId(tenantId, pageable);
        return PageResponse.of(page, page.getContent().stream().map(accountMapper::toDTO).toList());
    }
    
    public AccountDTO getAccountById(UUID accountId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Account account = accountRepository.findByIdAndTenantId(accountId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "id", accountId));
        return accountMapper.toDTO(account);
    }
    
    public PageResponse<AccountDTO> searchAccounts(String search, Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<Account> page = accountRepository.searchByName(tenantId, search, pageable);
        return PageResponse.of(page, page.getContent().stream().map(accountMapper::toDTO).toList());
    }
    
    @Transactional
    public AccountDTO createAccount(CreateAccountRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", "id", tenantId));
        
        Account account = Account.builder()
                .tenant(tenant)
                .name(request.getName())
                .industry(request.getIndustry())
                .website(request.getWebsite())
                .phone(request.getPhone())
                .addressLine1(request.getAddressLine1())
                .addressLine2(request.getAddressLine2())
                .city(request.getCity())
                .state(request.getState())
                .country(request.getCountry())
                .postalCode(request.getPostalCode())
                .annualRevenue(request.getAnnualRevenue())
                .employeeCount(request.getEmployeeCount())
                .description(request.getDescription())
                .tags(request.getTags())
                .customFields(request.getCustomFields())
                .build();
        
        if (request.getOwnerId() != null) {
            User owner = userRepository.findById(request.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getOwnerId()));
            account.setOwner(owner);
        }
        
        return accountMapper.toDTO(accountRepository.save(account));
    }
    
    @Transactional
    public AccountDTO updateAccount(UUID accountId, CreateAccountRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Account account = accountRepository.findByIdAndTenantId(accountId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "id", accountId));
        
        if (request.getName() != null) account.setName(request.getName());
        if (request.getIndustry() != null) account.setIndustry(request.getIndustry());
        if (request.getWebsite() != null) account.setWebsite(request.getWebsite());
        if (request.getPhone() != null) account.setPhone(request.getPhone());
        if (request.getAddressLine1() != null) account.setAddressLine1(request.getAddressLine1());
        if (request.getAddressLine2() != null) account.setAddressLine2(request.getAddressLine2());
        if (request.getCity() != null) account.setCity(request.getCity());
        if (request.getState() != null) account.setState(request.getState());
        if (request.getCountry() != null) account.setCountry(request.getCountry());
        if (request.getPostalCode() != null) account.setPostalCode(request.getPostalCode());
        if (request.getAnnualRevenue() != null) account.setAnnualRevenue(request.getAnnualRevenue());
        if (request.getEmployeeCount() != null) account.setEmployeeCount(request.getEmployeeCount());
        if (request.getDescription() != null) account.setDescription(request.getDescription());
        if (request.getTags() != null) account.setTags(request.getTags());
        if (request.getCustomFields() != null) account.setCustomFields(request.getCustomFields());
        
        if (request.getOwnerId() != null) {
            User owner = userRepository.findById(request.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getOwnerId()));
            account.setOwner(owner);
        }
        
        return accountMapper.toDTO(accountRepository.save(account));
    }
    
    @Transactional
    public void deleteAccount(UUID accountId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Account account = accountRepository.findByIdAndTenantId(accountId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "id", accountId));
        accountRepository.delete(account);
    }
}


package com.neobit.crm.service;

import com.neobit.crm.dto.common.PageResponse;
import com.neobit.crm.dto.customer.CreateCustomerRequest;
import com.neobit.crm.dto.customer.CustomerDTO;
import com.neobit.crm.entity.Account;
import com.neobit.crm.entity.Customer;
import com.neobit.crm.entity.Tenant;
import com.neobit.crm.entity.User;
import com.neobit.crm.exception.ResourceNotFoundException;
import com.neobit.crm.mapper.CustomerMapper;
import com.neobit.crm.repository.AccountRepository;
import com.neobit.crm.repository.CustomerRepository;
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
public class CustomerService {
    
    private final CustomerRepository customerRepository;
    private final TenantRepository tenantRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final CustomerMapper customerMapper;
    
    public PageResponse<CustomerDTO> getCustomers(Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<Customer> page = customerRepository.findByTenantId(tenantId, pageable);
        return PageResponse.of(page, page.getContent().stream().map(customerMapper::toDTO).toList());
    }
    
    public CustomerDTO getCustomerById(UUID customerId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Customer customer = customerRepository.findByIdAndTenantId(customerId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", customerId));
        return customerMapper.toDTO(customer);
    }
    
    public PageResponse<CustomerDTO> searchCustomers(String search, Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<Customer> page = customerRepository.search(tenantId, search, pageable);
        return PageResponse.of(page, page.getContent().stream().map(customerMapper::toDTO).toList());
    }
    
    public PageResponse<CustomerDTO> getLeads(Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<Customer> page = customerRepository.findLeads(tenantId, pageable);
        return PageResponse.of(page, page.getContent().stream().map(customerMapper::toDTO).toList());
    }
    
    public PageResponse<CustomerDTO> getCustomersByStatus(String status, Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<Customer> page = customerRepository.findByLeadStatus(tenantId, status, pageable);
        return PageResponse.of(page, page.getContent().stream().map(customerMapper::toDTO).toList());
    }
    
    @Transactional
    public CustomerDTO createCustomer(CreateCustomerRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", "id", tenantId));
        
        Customer customer = Customer.builder()
                .tenant(tenant)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .mobile(request.getMobile())
                .jobTitle(request.getJobTitle())
                .department(request.getDepartment())
                .addressLine1(request.getAddressLine1())
                .addressLine2(request.getAddressLine2())
                .city(request.getCity())
                .state(request.getState())
                .country(request.getCountry())
                .postalCode(request.getPostalCode())
                .leadSource(request.getLeadSource())
                .leadStatus(request.getLeadStatus() != null ? request.getLeadStatus() : "new")
                .isLead(request.getIsLead() != null ? request.getIsLead() : true)
                .tags(request.getTags())
                .customFields(request.getCustomFields())
                .build();
        
        if (request.getAccountId() != null) {
            Account account = accountRepository.findByIdAndTenantId(request.getAccountId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Account", "id", request.getAccountId()));
            customer.setAccount(account);
        }
        
        if (request.getOwnerId() != null) {
            User owner = userRepository.findById(request.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getOwnerId()));
            customer.setOwner(owner);
        }
        
        return customerMapper.toDTO(customerRepository.save(customer));
    }
    
    @Transactional
    public CustomerDTO updateCustomer(UUID customerId, CreateCustomerRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Customer customer = customerRepository.findByIdAndTenantId(customerId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", customerId));
        
        if (request.getFirstName() != null) customer.setFirstName(request.getFirstName());
        if (request.getLastName() != null) customer.setLastName(request.getLastName());
        if (request.getEmail() != null) customer.setEmail(request.getEmail());
        if (request.getPhone() != null) customer.setPhone(request.getPhone());
        if (request.getMobile() != null) customer.setMobile(request.getMobile());
        if (request.getJobTitle() != null) customer.setJobTitle(request.getJobTitle());
        if (request.getDepartment() != null) customer.setDepartment(request.getDepartment());
        if (request.getAddressLine1() != null) customer.setAddressLine1(request.getAddressLine1());
        if (request.getAddressLine2() != null) customer.setAddressLine2(request.getAddressLine2());
        if (request.getCity() != null) customer.setCity(request.getCity());
        if (request.getState() != null) customer.setState(request.getState());
        if (request.getCountry() != null) customer.setCountry(request.getCountry());
        if (request.getPostalCode() != null) customer.setPostalCode(request.getPostalCode());
        if (request.getLeadSource() != null) customer.setLeadSource(request.getLeadSource());
        if (request.getLeadStatus() != null) customer.setLeadStatus(request.getLeadStatus());
        if (request.getIsLead() != null) customer.setIsLead(request.getIsLead());
        if (request.getTags() != null) customer.setTags(request.getTags());
        if (request.getCustomFields() != null) customer.setCustomFields(request.getCustomFields());
        
        if (request.getAccountId() != null) {
            Account account = accountRepository.findByIdAndTenantId(request.getAccountId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Account", "id", request.getAccountId()));
            customer.setAccount(account);
        }
        
        if (request.getOwnerId() != null) {
            User owner = userRepository.findById(request.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getOwnerId()));
            customer.setOwner(owner);
        }
        
        return customerMapper.toDTO(customerRepository.save(customer));
    }
    
    @Transactional
    public void deleteCustomer(UUID customerId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Customer customer = customerRepository.findByIdAndTenantId(customerId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", customerId));
        customerRepository.delete(customer);
    }
}


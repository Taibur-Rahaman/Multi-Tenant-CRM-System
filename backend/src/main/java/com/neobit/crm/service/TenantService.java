package com.neobit.crm.service;

import com.neobit.crm.dto.tenant.CreateTenantRequest;
import com.neobit.crm.dto.tenant.TenantDTO;
import com.neobit.crm.entity.Tenant;
import com.neobit.crm.entity.User;
import com.neobit.crm.exception.DuplicateResourceException;
import com.neobit.crm.exception.ResourceNotFoundException;
import com.neobit.crm.mapper.TenantMapper;
import com.neobit.crm.repository.TenantRepository;
import com.neobit.crm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TenantService {
    
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final TenantMapper tenantMapper;
    private final PasswordEncoder passwordEncoder;
    
    public TenantDTO getTenantById(UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", "id", tenantId));
        return tenantMapper.toDTO(tenant);
    }
    
    public TenantDTO getTenantBySlug(String slug) {
        Tenant tenant = tenantRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", "slug", slug));
        return tenantMapper.toDTO(tenant);
    }
    
    public Page<TenantDTO> getAllTenants(Pageable pageable) {
        return tenantRepository.findAll(pageable)
                .map(tenantMapper::toDTO);
    }
    
    @Transactional
    public TenantDTO createTenant(CreateTenantRequest request) {
        // Check if slug already exists
        if (tenantRepository.existsBySlug(request.getSlug())) {
            throw new DuplicateResourceException("Tenant", "slug", request.getSlug());
        }
        
        // Check if domain already exists
        if (request.getDomain() != null && tenantRepository.existsByDomain(request.getDomain())) {
            throw new DuplicateResourceException("Tenant", "domain", request.getDomain());
        }
        
        // Create tenant
        Tenant tenant = Tenant.builder()
                .name(request.getName())
                .slug(request.getSlug())
                .domain(request.getDomain())
                .logoUrl(request.getLogoUrl())
                .subscriptionPlan(request.getSubscriptionPlan() != null ? request.getSubscriptionPlan() : "free")
                .build();
        
        tenant = tenantRepository.save(tenant);
        
        // Create admin user for the tenant
        User adminUser = User.builder()
                .tenant(tenant)
                .email(request.getAdminEmail())
                .passwordHash(passwordEncoder.encode(request.getAdminPassword()))
                .firstName(request.getAdminFirstName())
                .lastName(request.getAdminLastName())
                .role(User.UserRole.ADMIN)
                .isActive(true)
                .emailVerified(true)
                .build();
        
        userRepository.save(adminUser);
        
        return tenantMapper.toDTO(tenant);
    }
    
    @Transactional
    public TenantDTO updateTenant(UUID tenantId, CreateTenantRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", "id", tenantId));
        
        if (request.getName() != null) tenant.setName(request.getName());
        if (request.getDomain() != null) tenant.setDomain(request.getDomain());
        if (request.getLogoUrl() != null) tenant.setLogoUrl(request.getLogoUrl());
        if (request.getSubscriptionPlan() != null) tenant.setSubscriptionPlan(request.getSubscriptionPlan());
        
        return tenantMapper.toDTO(tenantRepository.save(tenant));
    }
    
    @Transactional
    public void deleteTenant(UUID tenantId) {
        if (!tenantRepository.existsById(tenantId)) {
            throw new ResourceNotFoundException("Tenant", "id", tenantId);
        }
        tenantRepository.deleteById(tenantId);
    }
}


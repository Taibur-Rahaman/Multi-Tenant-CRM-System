package com.neobit.crm.service;

import com.neobit.crm.dto.common.PageResponse;
import com.neobit.crm.dto.interaction.CreateInteractionRequest;
import com.neobit.crm.dto.interaction.InteractionDTO;
import com.neobit.crm.entity.*;
import com.neobit.crm.exception.ResourceNotFoundException;
import com.neobit.crm.mapper.InteractionMapper;
import com.neobit.crm.repository.*;
import com.neobit.crm.security.TenantContext;
import com.neobit.crm.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InteractionService {
    
    private final InteractionRepository interactionRepository;
    private final TenantRepository tenantRepository;
    private final CustomerRepository customerRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final InteractionMapper interactionMapper;
    
    public PageResponse<InteractionDTO> getInteractions(Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<Interaction> page = interactionRepository.findByTenantId(tenantId, pageable);
        return PageResponse.of(page, page.getContent().stream().map(interactionMapper::toDTO).toList());
    }
    
    public InteractionDTO getInteractionById(UUID interactionId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Interaction interaction = interactionRepository.findByIdAndTenantId(interactionId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Interaction", "id", interactionId));
        return interactionMapper.toDTO(interaction);
    }
    
    public PageResponse<InteractionDTO> getInteractionsByCustomer(UUID customerId, Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<Interaction> page = interactionRepository.findByTenantIdAndCustomerId(tenantId, customerId, pageable);
        return PageResponse.of(page, page.getContent().stream().map(interactionMapper::toDTO).toList());
    }
    
    public PageResponse<InteractionDTO> getInteractionsByAccount(UUID accountId, Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<Interaction> page = interactionRepository.findByTenantIdAndAccountId(tenantId, accountId, pageable);
        return PageResponse.of(page, page.getContent().stream().map(interactionMapper::toDTO).toList());
    }
    
    public PageResponse<InteractionDTO> getInteractionsByType(Interaction.InteractionType type, Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<Interaction> page = interactionRepository.findByTenantIdAndType(tenantId, type, pageable);
        return PageResponse.of(page, page.getContent().stream().map(interactionMapper::toDTO).toList());
    }
    
    public PageResponse<InteractionDTO> getInteractionsByDateRange(Instant startDate, Instant endDate, Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<Interaction> page = interactionRepository.findByTenantIdAndDateRange(tenantId, startDate, endDate, pageable);
        return PageResponse.of(page, page.getContent().stream().map(interactionMapper::toDTO).toList());
    }
    
    @Transactional
    public InteractionDTO createInteraction(CreateInteractionRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", "id", tenantId));
        
        UserPrincipal currentUser = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));
        
        Interaction interaction = Interaction.builder()
                .tenant(tenant)
                .user(user)
                .type(request.getType())
                .direction(request.getDirection() != null ? request.getDirection() : Interaction.InteractionDirection.OUTBOUND)
                .status(request.getStatus() != null ? request.getStatus() : Interaction.InteractionStatus.COMPLETED)
                .subject(request.getSubject())
                .description(request.getDescription())
                .startedAt(request.getStartedAt() != null ? request.getStartedAt() : Instant.now())
                .endedAt(request.getEndedAt())
                .durationSeconds(request.getDurationSeconds())
                .scheduledAt(request.getScheduledAt())
                .location(request.getLocation())
                .externalId(request.getExternalId())
                .externalSource(request.getExternalSource())
                .metadata(request.getMetadata())
                .tags(request.getTags())
                .build();
        
        if (request.getCustomerId() != null) {
            Customer customer = customerRepository.findByIdAndTenantId(request.getCustomerId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", request.getCustomerId()));
            interaction.setCustomer(customer);
            
            // Update customer's last contacted timestamp
            customer.setLastContactedAt(Instant.now());
            customerRepository.save(customer);
        }
        
        if (request.getAccountId() != null) {
            Account account = accountRepository.findByIdAndTenantId(request.getAccountId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Account", "id", request.getAccountId()));
            interaction.setAccount(account);
        }
        
        return interactionMapper.toDTO(interactionRepository.save(interaction));
    }
    
    @Transactional
    public InteractionDTO updateInteraction(UUID interactionId, CreateInteractionRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Interaction interaction = interactionRepository.findByIdAndTenantId(interactionId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Interaction", "id", interactionId));
        
        if (request.getType() != null) interaction.setType(request.getType());
        if (request.getDirection() != null) interaction.setDirection(request.getDirection());
        if (request.getStatus() != null) interaction.setStatus(request.getStatus());
        if (request.getSubject() != null) interaction.setSubject(request.getSubject());
        if (request.getDescription() != null) interaction.setDescription(request.getDescription());
        if (request.getStartedAt() != null) interaction.setStartedAt(request.getStartedAt());
        if (request.getEndedAt() != null) interaction.setEndedAt(request.getEndedAt());
        if (request.getDurationSeconds() != null) interaction.setDurationSeconds(request.getDurationSeconds());
        if (request.getScheduledAt() != null) interaction.setScheduledAt(request.getScheduledAt());
        if (request.getLocation() != null) interaction.setLocation(request.getLocation());
        if (request.getMetadata() != null) interaction.setMetadata(request.getMetadata());
        if (request.getTags() != null) interaction.setTags(request.getTags());
        
        if (request.getCustomerId() != null) {
            Customer customer = customerRepository.findByIdAndTenantId(request.getCustomerId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", request.getCustomerId()));
            interaction.setCustomer(customer);
        }
        
        if (request.getAccountId() != null) {
            Account account = accountRepository.findByIdAndTenantId(request.getAccountId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Account", "id", request.getAccountId()));
            interaction.setAccount(account);
        }
        
        return interactionMapper.toDTO(interactionRepository.save(interaction));
    }
    
    @Transactional
    public void deleteInteraction(UUID interactionId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Interaction interaction = interactionRepository.findByIdAndTenantId(interactionId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Interaction", "id", interactionId));
        interactionRepository.delete(interaction);
    }
}


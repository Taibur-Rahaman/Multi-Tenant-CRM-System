package com.neobit.crm.service;

import com.neobit.crm.dto.issue.CreateIssueRequest;
import com.neobit.crm.dto.issue.IssueDTO;
import com.neobit.crm.entity.Issue;
import com.neobit.crm.exception.ResourceNotFoundException;
import com.neobit.crm.mapper.IssueMapper;
import com.neobit.crm.repository.IssueRepository;
import com.neobit.crm.security.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
public class IssueService {

    private final IssueRepository issueRepository;
    private final IssueMapper issueMapper;
    // Note: Jira and Linear integrations require Kotlin compilation - disabled for now
    // private final JiraService jiraService;
    // private final LinearService linearService;

    @Transactional(readOnly = true)
    public Page<IssueDTO> getAllIssues(Pageable pageable) {
        String tenantId = TenantContext.getCurrentTenantId();
        return issueRepository.findByTenantId(tenantId, pageable)
                .map(issueMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public IssueDTO getIssueById(String id) {
        String tenantId = TenantContext.getCurrentTenantId();
        Issue issue = issueRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found: " + id));
        return issueMapper.toDTO(issue);
    }

    @Transactional(readOnly = true)
    public Page<IssueDTO> getIssuesByStatus(String status, Pageable pageable) {
        String tenantId = TenantContext.getCurrentTenantId();
        return issueRepository.findByTenantIdAndStatus(tenantId, status, pageable)
                .map(issueMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public Page<IssueDTO> getIssuesByCustomer(String customerId, Pageable pageable) {
        String tenantId = TenantContext.getCurrentTenantId();
        return issueRepository.findByTenantIdAndCustomerId(tenantId, customerId, pageable)
                .map(issueMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public Page<IssueDTO> searchIssues(String query, Pageable pageable) {
        String tenantId = TenantContext.getCurrentTenantId();
        return issueRepository.search(tenantId, query, pageable)
                .map(issueMapper::toDTO);
    }

    @Transactional
    public IssueDTO createIssue(CreateIssueRequest request) {
        String tenantId = TenantContext.getCurrentTenantId();
        
        Issue issue = issueMapper.toEntity(request);
        issue.setTenantId(tenantId);
        issue.setStatus("todo");
        issue.setProvider("internal");
        issue.setPriority(request.getPriority() != null ? request.getPriority() : "medium");
        
        if (issue.getLabels() == null) {
            issue.setLabels(new ArrayList<>());
        }
        
        // Generate internal key
        long count = issueRepository.findByTenantId(tenantId, Pageable.unpaged()).getTotalElements();
        issue.setExternalKey("INT-" + (count + 1));
        
        Issue savedIssue = issueRepository.save(issue);
        log.info("Created issue: {} for tenant: {}", savedIssue.getId(), tenantId);
        
        return issueMapper.toDTO(savedIssue);
    }

    @Transactional
    public IssueDTO updateIssue(String id, CreateIssueRequest request) {
        String tenantId = TenantContext.getCurrentTenantId();
        
        Issue issue = issueRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found: " + id));
        
        issueMapper.updateEntity(request, issue);
        
        Issue updatedIssue = issueRepository.save(issue);
        log.info("Updated issue: {} for tenant: {}", updatedIssue.getId(), tenantId);
        
        return issueMapper.toDTO(updatedIssue);
    }

    @Transactional
    public IssueDTO updateIssueStatus(String id, String status) {
        String tenantId = TenantContext.getCurrentTenantId();
        
        Issue issue = issueRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found: " + id));
        
        issue.setStatus(status);
        
        if ("done".equalsIgnoreCase(status) || "closed".equalsIgnoreCase(status)) {
            issue.setResolvedAt(LocalDateTime.now());
        }
        
        Issue updatedIssue = issueRepository.save(issue);
        log.info("Updated issue status: {} to {} for tenant: {}", id, status, tenantId);
        
        return issueMapper.toDTO(updatedIssue);
    }

    @Transactional
    public void deleteIssue(String id) {
        String tenantId = TenantContext.getCurrentTenantId();
        
        Issue issue = issueRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found: " + id));
        
        issueRepository.delete(issue);
        log.info("Deleted issue: {} for tenant: {}", id, tenantId);
    }

    /**
     * Sync issues from Jira
     * Note: Jira integration requires Kotlin compilation - currently disabled
     */
    @Transactional
    public int syncFromJira() {
        String tenantId = TenantContext.getCurrentTenantId();
        log.warn("Jira sync not available - Kotlin integration not compiled for tenant: {}", tenantId);
        throw new UnsupportedOperationException("Jira integration is not currently available");
    }

    /**
     * Sync issues from Linear
     * Note: Linear integration requires Kotlin compilation - currently disabled
     */
    @Transactional
    public int syncFromLinear() {
        String tenantId = TenantContext.getCurrentTenantId();
        log.warn("Linear sync not available - Kotlin integration not compiled for tenant: {}", tenantId);
        throw new UnsupportedOperationException("Linear integration is not currently available");
    }

    /**
     * Get sync status for integrations
     */
    @Transactional(readOnly = true)
    public IssuesSyncStatus getSyncStatus() {
        String tenantId = TenantContext.getCurrentTenantId();
        
        long totalIssues = issueRepository.findByTenantId(tenantId, Pageable.unpaged()).getTotalElements();
        long jiraIssues = issueRepository.findByTenantIdAndProvider(tenantId, "jira", Pageable.unpaged()).getTotalElements();
        long linearIssues = issueRepository.findByTenantIdAndProvider(tenantId, "linear", Pageable.unpaged()).getTotalElements();
        long internalIssues = issueRepository.findByTenantIdAndProvider(tenantId, "internal", Pageable.unpaged()).getTotalElements();
        
        // Jira and Linear integrations are disabled (require Kotlin compilation)
        boolean jiraConfigured = false;
        boolean linearConfigured = false;
        
        return new IssuesSyncStatus(
            totalIssues,
            jiraIssues,
            linearIssues,
            internalIssues,
            jiraConfigured,
            linearConfigured
        );
    }

    /**
     * DTO for sync status
     */
    public record IssuesSyncStatus(
        long totalIssues,
        long jiraIssues,
        long linearIssues,
        long internalIssues,
        boolean jiraConfigured,
        boolean linearConfigured
    ) {}
}

package com.neobit.crm.service;

import com.neobit.crm.dto.issue.CreateIssueRequest;
import com.neobit.crm.dto.issue.IssueDTO;
import com.neobit.crm.entity.Issue;
import com.neobit.crm.exception.ResourceNotFoundException;
import com.neobit.crm.integration.jira.JiraIssue;
import com.neobit.crm.integration.jira.JiraService;
import com.neobit.crm.integration.linear.LinearIssue;
import com.neobit.crm.integration.linear.LinearService;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class IssueService {

    private final IssueRepository issueRepository;
    private final IssueMapper issueMapper;
    private final JiraService jiraService;
    private final LinearService linearService;

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
     * Fetches all issues from connected Jira project and syncs them to local database
     */
    @Transactional
    public int syncFromJira() {
        String tenantId = TenantContext.getCurrentTenantId();
        log.info("Starting Jira sync for tenant: {}", tenantId);
        
        try {
            UUID tenantUuid = UUID.fromString(tenantId);
            
            // Search for all issues in project (you can customize the JQL)
            List<JiraIssue> jiraIssues = jiraService.searchIssues(
                tenantUuid, 
                "project IS NOT EMPTY ORDER BY updated DESC",
                100
            );
            
            int syncedCount = 0;
            for (JiraIssue jiraIssue : jiraIssues) {
                syncedCount += syncJiraIssue(tenantId, jiraIssue) ? 1 : 0;
            }
            
            log.info("Jira sync completed for tenant: {}. Synced {} issues", tenantId, syncedCount);
            return syncedCount;
            
        } catch (Exception e) {
            log.error("Jira sync failed for tenant: {}", tenantId, e);
            throw new RuntimeException("Failed to sync from Jira: " + e.getMessage());
        }
    }

    /**
     * Sync a single Jira issue to local database
     */
    private boolean syncJiraIssue(String tenantId, JiraIssue jiraIssue) {
        try {
            // Check if issue already exists
            Optional<Issue> existingIssue = issueRepository.findByTenantIdAndExternalId(
                tenantId, jiraIssue.getId()
            );
            
            Issue issue;
            if (existingIssue.isPresent()) {
                issue = existingIssue.get();
            } else {
                issue = new Issue();
                issue.setTenantId(tenantId);
                issue.setExternalId(jiraIssue.getId());
                issue.setProvider("jira");
            }
            
            // Update issue fields
            issue.setExternalKey(jiraIssue.getKey());
            issue.setTitle(jiraIssue.getSummary());
            issue.setDescription(jiraIssue.getDescription());
            issue.setStatus(mapJiraStatus(jiraIssue.getStatus()));
            issue.setPriority(mapJiraPriority(jiraIssue.getPriority()));
            issue.setAssignee(jiraIssue.getAssignee());
            issue.setLabels(jiraIssue.getLabels());
            issue.setUrl(buildJiraUrl(tenantId, jiraIssue.getKey()));
            
            issueRepository.save(issue);
            return true;
            
        } catch (Exception e) {
            log.error("Failed to sync Jira issue: {}", jiraIssue.getKey(), e);
            return false;
        }
    }

    /**
     * Sync issues from Linear
     * Fetches all issues from connected Linear workspace and syncs them to local database
     */
    @Transactional
    public int syncFromLinear() {
        String tenantId = TenantContext.getCurrentTenantId();
        log.info("Starting Linear sync for tenant: {}", tenantId);
        
        try {
            UUID tenantUuid = UUID.fromString(tenantId);
            
            // Get all issues from Linear
            List<LinearIssue> linearIssues = linearService.getIssues(tenantUuid, 100);
            
            int syncedCount = 0;
            for (LinearIssue linearIssue : linearIssues) {
                syncedCount += syncLinearIssue(tenantId, linearIssue) ? 1 : 0;
            }
            
            log.info("Linear sync completed for tenant: {}. Synced {} issues", tenantId, syncedCount);
            return syncedCount;
            
        } catch (Exception e) {
            log.error("Linear sync failed for tenant: {}", tenantId, e);
            throw new RuntimeException("Failed to sync from Linear: " + e.getMessage());
        }
    }

    /**
     * Sync a single Linear issue to local database
     */
    private boolean syncLinearIssue(String tenantId, LinearIssue linearIssue) {
        try {
            // Check if issue already exists
            Optional<Issue> existingIssue = issueRepository.findByTenantIdAndExternalId(
                tenantId, linearIssue.getId()
            );
            
            Issue issue;
            if (existingIssue.isPresent()) {
                issue = existingIssue.get();
            } else {
                issue = new Issue();
                issue.setTenantId(tenantId);
                issue.setExternalId(linearIssue.getId());
                issue.setProvider("linear");
            }
            
            // Update issue fields
            issue.setExternalKey(linearIssue.getIdentifier());
            issue.setTitle(linearIssue.getTitle());
            issue.setDescription(linearIssue.getDescription());
            issue.setStatus(mapLinearStatus(linearIssue.getState()));
            issue.setPriority(LinearService.Companion.priorityToString(linearIssue.getPriority()));
            issue.setAssignee(linearIssue.getAssignee());
            issue.setLabels(linearIssue.getLabels());
            issue.setUrl(linearIssue.getUrl());
            
            issueRepository.save(issue);
            return true;
            
        } catch (Exception e) {
            log.error("Failed to sync Linear issue: {}", linearIssue.getIdentifier(), e);
            return false;
        }
    }

    /**
     * Map Jira status to internal status
     */
    private String mapJiraStatus(String jiraStatus) {
        if (jiraStatus == null) return "todo";
        
        String status = jiraStatus.toLowerCase();
        if (status.contains("done") || status.contains("closed") || status.contains("resolved")) {
            return "done";
        } else if (status.contains("progress") || status.contains("review") || status.contains("development")) {
            return "in_progress";
        } else if (status.contains("cancel")) {
            return "cancelled";
        }
        return "todo";
    }

    /**
     * Map Jira priority to internal priority
     */
    private String mapJiraPriority(String jiraPriority) {
        if (jiraPriority == null) return "medium";
        
        String priority = jiraPriority.toLowerCase();
        if (priority.contains("highest") || priority.contains("blocker") || priority.contains("critical")) {
            return "highest";
        } else if (priority.contains("high") || priority.contains("major")) {
            return "high";
        } else if (priority.contains("medium") || priority.contains("normal")) {
            return "medium";
        } else if (priority.contains("low") || priority.contains("minor")) {
            return "low";
        } else if (priority.contains("lowest") || priority.contains("trivial")) {
            return "lowest";
        }
        return "medium";
    }

    /**
     * Map Linear status to internal status
     */
    private String mapLinearStatus(String linearState) {
        if (linearState == null) return "todo";
        
        String state = linearState.toLowerCase();
        if (state.contains("done") || state.contains("completed") || state.contains("closed")) {
            return "done";
        } else if (state.contains("progress") || state.contains("started") || state.contains("review")) {
            return "in_progress";
        } else if (state.contains("cancel") || state.contains("duplicate")) {
            return "cancelled";
        }
        return "todo";
    }

    /**
     * Build Jira issue URL
     */
    private String buildJiraUrl(String tenantId, String issueKey) {
        try {
            UUID tenantUuid = UUID.fromString(tenantId);
            var config = jiraService.getJiraConfig(tenantUuid);
            if (config != null) {
                return config.getBaseUrl() + "/browse/" + issueKey;
            }
        } catch (Exception e) {
            log.debug("Could not build Jira URL", e);
        }
        return null;
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
        
        // Check if integrations are configured
        UUID tenantUuid = UUID.fromString(tenantId);
        boolean jiraConfigured = jiraService.getJiraConfig(tenantUuid) != null;
        boolean linearConfigured = linearService.getLinearConfig(tenantUuid) != null;
        
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

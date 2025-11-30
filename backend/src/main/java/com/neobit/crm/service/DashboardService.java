package com.neobit.crm.service;

import com.neobit.crm.repository.*;
import com.neobit.crm.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardService {
    
    private final CustomerRepository customerRepository;
    private final AccountRepository accountRepository;
    private final InteractionRepository interactionRepository;
    private final TaskRepository taskRepository;
    
    public Map<String, Object> getDashboardStats() {
        UUID tenantId = TenantContext.getCurrentTenant();
        Instant last30Days = Instant.now().minus(30, ChronoUnit.DAYS);
        Instant last7Days = Instant.now().minus(7, ChronoUnit.DAYS);
        
        Map<String, Object> stats = new HashMap<>();
        
        // Customer stats
        stats.put("totalCustomers", customerRepository.countByTenantId(tenantId));
        stats.put("totalLeads", customerRepository.countLeadsByTenantId(tenantId));
        
        // Account stats
        stats.put("totalAccounts", accountRepository.countByTenantId(tenantId));
        
        // Interaction stats
        stats.put("totalInteractions", interactionRepository.countByTenantId(tenantId));
        stats.put("recentInteractions", interactionRepository.countRecentByTenantId(tenantId, last7Days));
        
        // Task stats
        stats.put("totalTasks", taskRepository.countByTenantId(tenantId));
        stats.put("pendingTasks", taskRepository.countPendingByTenantId(tenantId));
        
        // Interaction breakdown by type
        Map<String, Long> interactionsByType = new HashMap<>();
        interactionRepository.countByType(tenantId).forEach(row -> {
            interactionsByType.put(row[0].toString(), (Long) row[1]);
        });
        stats.put("interactionsByType", interactionsByType);
        
        return stats;
    }
}


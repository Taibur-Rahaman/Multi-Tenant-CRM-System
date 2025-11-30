package com.neobit.crm.repository;

import com.neobit.crm.entity.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {
    
    Page<Task> findByTenantId(UUID tenantId, Pageable pageable);
    
    Optional<Task> findByIdAndTenantId(UUID id, UUID tenantId);
    
    @Query("SELECT t FROM Task t WHERE t.tenant.id = :tenantId AND t.assignedTo.id = :userId")
    Page<Task> findByTenantIdAndAssignedTo(@Param("tenantId") UUID tenantId, 
                                            @Param("userId") UUID userId, 
                                            Pageable pageable);
    
    @Query("SELECT t FROM Task t WHERE t.tenant.id = :tenantId AND t.status = :status")
    Page<Task> findByTenantIdAndStatus(@Param("tenantId") UUID tenantId, 
                                        @Param("status") String status, 
                                        Pageable pageable);
    
    @Query("SELECT t FROM Task t WHERE t.tenant.id = :tenantId AND t.dueDate < :now AND t.status != 'completed'")
    List<Task> findOverdueTasks(@Param("tenantId") UUID tenantId, @Param("now") Instant now);
    
    @Query("SELECT t FROM Task t WHERE t.tenant.id = :tenantId AND t.customer.id = :customerId")
    List<Task> findByTenantIdAndCustomerId(@Param("tenantId") UUID tenantId, 
                                            @Param("customerId") UUID customerId);
    
    long countByTenantId(UUID tenantId);
    
    @Query("SELECT COUNT(t) FROM Task t WHERE t.tenant.id = :tenantId AND t.status = 'pending'")
    long countPendingByTenantId(@Param("tenantId") UUID tenantId);
}


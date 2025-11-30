package com.neobit.crm.repository;

import com.neobit.crm.entity.Interaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InteractionRepository extends JpaRepository<Interaction, UUID>, JpaSpecificationExecutor<Interaction> {
    
    Page<Interaction> findByTenantId(UUID tenantId, Pageable pageable);
    
    Optional<Interaction> findByIdAndTenantId(UUID id, UUID tenantId);
    
    Page<Interaction> findByTenantIdAndCustomerId(UUID tenantId, UUID customerId, Pageable pageable);
    
    Page<Interaction> findByTenantIdAndAccountId(UUID tenantId, UUID accountId, Pageable pageable);
    
    @Query("SELECT i FROM Interaction i WHERE i.tenant.id = :tenantId AND i.user.id = :userId")
    Page<Interaction> findByTenantIdAndUserId(@Param("tenantId") UUID tenantId, 
                                               @Param("userId") UUID userId, 
                                               Pageable pageable);
    
    @Query("SELECT i FROM Interaction i WHERE i.tenant.id = :tenantId AND i.type = :type")
    Page<Interaction> findByTenantIdAndType(@Param("tenantId") UUID tenantId, 
                                             @Param("type") Interaction.InteractionType type, 
                                             Pageable pageable);
    
    @Query("SELECT i FROM Interaction i WHERE i.tenant.id = :tenantId AND " +
           "i.createdAt BETWEEN :startDate AND :endDate")
    Page<Interaction> findByTenantIdAndDateRange(@Param("tenantId") UUID tenantId,
                                                  @Param("startDate") Instant startDate,
                                                  @Param("endDate") Instant endDate,
                                                  Pageable pageable);
    
    @Query("SELECT i FROM Interaction i WHERE i.tenant.id = :tenantId AND i.scheduledAt > :now " +
           "ORDER BY i.scheduledAt ASC")
    List<Interaction> findUpcomingScheduled(@Param("tenantId") UUID tenantId, 
                                             @Param("now") Instant now, 
                                             Pageable pageable);
    
    @Query("SELECT i.type, COUNT(i) FROM Interaction i WHERE i.tenant.id = :tenantId " +
           "GROUP BY i.type")
    List<Object[]> countByType(@Param("tenantId") UUID tenantId);
    
    long countByTenantId(UUID tenantId);
    
    @Query("SELECT COUNT(i) FROM Interaction i WHERE i.tenant.id = :tenantId AND " +
           "i.createdAt > :since")
    long countRecentByTenantId(@Param("tenantId") UUID tenantId, @Param("since") Instant since);
}


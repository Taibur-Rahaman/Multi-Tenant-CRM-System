package com.neobit.crm.repository;

import com.neobit.crm.entity.Issue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IssueRepository extends JpaRepository<Issue, String> {
    
    Page<Issue> findByTenantId(String tenantId, Pageable pageable);
    
    Page<Issue> findByTenantIdAndStatus(String tenantId, String status, Pageable pageable);
    
    Page<Issue> findByTenantIdAndCustomerId(String tenantId, String customerId, Pageable pageable);
    
    Page<Issue> findByTenantIdAndProvider(String tenantId, String provider, Pageable pageable);
    
    Optional<Issue> findByTenantIdAndExternalId(String tenantId, String externalId);
    
    Optional<Issue> findByIdAndTenantId(String id, String tenantId);
    
    @Query("SELECT i FROM Issue i WHERE i.tenantId = :tenantId AND " +
           "(LOWER(i.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(i.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Issue> search(@Param("tenantId") String tenantId, @Param("query") String query, Pageable pageable);
    
    long countByTenantIdAndStatus(String tenantId, String status);
    
    List<Issue> findByTenantIdAndStatusIn(String tenantId, List<String> statuses);
}


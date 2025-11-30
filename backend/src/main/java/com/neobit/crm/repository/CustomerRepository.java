package com.neobit.crm.repository;

import com.neobit.crm.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID>, JpaSpecificationExecutor<Customer> {
    
    Page<Customer> findByTenantId(UUID tenantId, Pageable pageable);
    
    Optional<Customer> findByIdAndTenantId(UUID id, UUID tenantId);
    
    Page<Customer> findByTenantIdAndAccountId(UUID tenantId, UUID accountId, Pageable pageable);
    
    @Query("SELECT c FROM Customer c WHERE c.tenant.id = :tenantId AND c.owner.id = :ownerId")
    Page<Customer> findByTenantIdAndOwnerId(@Param("tenantId") UUID tenantId, 
                                             @Param("ownerId") UUID ownerId, 
                                             Pageable pageable);
    
    @Query("SELECT c FROM Customer c WHERE c.tenant.id = :tenantId AND " +
           "(LOWER(c.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Customer> search(@Param("tenantId") UUID tenantId, 
                          @Param("search") String search, 
                          Pageable pageable);
    
    @Query("SELECT c FROM Customer c WHERE c.tenant.id = :tenantId AND c.isLead = true")
    Page<Customer> findLeads(@Param("tenantId") UUID tenantId, Pageable pageable);
    
    @Query("SELECT c FROM Customer c WHERE c.tenant.id = :tenantId AND c.leadStatus = :status")
    Page<Customer> findByLeadStatus(@Param("tenantId") UUID tenantId, 
                                    @Param("status") String status, 
                                    Pageable pageable);
    
    Optional<Customer> findByEmailAndTenantId(String email, UUID tenantId);
    
    @Query(value = "SELECT * FROM customers c WHERE c.tenant_id = :tenantId AND :tag = ANY(c.tags)", nativeQuery = true)
    List<Customer> findByTenantIdAndTag(@Param("tenantId") UUID tenantId, @Param("tag") String tag);
    
    long countByTenantId(UUID tenantId);
    
    @Query("SELECT COUNT(c) FROM Customer c WHERE c.tenant.id = :tenantId AND c.isLead = true")
    long countLeadsByTenantId(@Param("tenantId") UUID tenantId);
}


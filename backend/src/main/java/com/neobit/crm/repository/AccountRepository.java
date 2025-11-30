package com.neobit.crm.repository;

import com.neobit.crm.entity.Account;
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
public interface AccountRepository extends JpaRepository<Account, UUID>, JpaSpecificationExecutor<Account> {
    
    Page<Account> findByTenantId(UUID tenantId, Pageable pageable);
    
    Optional<Account> findByIdAndTenantId(UUID id, UUID tenantId);
    
    @Query("SELECT a FROM Account a WHERE a.tenant.id = :tenantId AND a.owner.id = :ownerId")
    Page<Account> findByTenantIdAndOwnerId(@Param("tenantId") UUID tenantId, 
                                            @Param("ownerId") UUID ownerId, 
                                            Pageable pageable);
    
    @Query("SELECT a FROM Account a WHERE a.tenant.id = :tenantId AND " +
           "LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Account> searchByName(@Param("tenantId") UUID tenantId, 
                               @Param("search") String search, 
                               Pageable pageable);
    
    @Query(value = "SELECT * FROM accounts a WHERE a.tenant_id = :tenantId AND :tag = ANY(a.tags)", nativeQuery = true)
    List<Account> findByTenantIdAndTag(@Param("tenantId") UUID tenantId, @Param("tag") String tag);
    
    long countByTenantId(UUID tenantId);
}


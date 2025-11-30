package com.neobit.crm.repository;

import com.neobit.crm.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    
    Optional<User> findByEmailAndTenantId(String email, UUID tenantId);
    
    Optional<User> findByEmail(String email);
    
    Page<User> findByTenantId(UUID tenantId, Pageable pageable);
    
    List<User> findByTenantIdAndIsActiveTrue(UUID tenantId);
    
    @Query("SELECT u FROM User u WHERE u.tenant.id = :tenantId AND u.role = :role")
    List<User> findByTenantIdAndRole(@Param("tenantId") UUID tenantId, @Param("role") User.UserRole role);
    
    long countByTenantId(UUID tenantId);
    
    boolean existsByEmailAndTenantId(String email, UUID tenantId);
}


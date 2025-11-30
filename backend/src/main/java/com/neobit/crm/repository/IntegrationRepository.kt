package com.neobit.crm.repository

import com.neobit.crm.entity.IntegrationConfig
import com.neobit.crm.entity.OAuthConnection
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface IntegrationConfigRepository : JpaRepository<IntegrationConfig, UUID> {
    
    fun findByTenantId(tenantId: UUID): List<IntegrationConfig>
    
    fun findByTenantIdAndIntegrationType(tenantId: UUID, integrationType: String): IntegrationConfig?
    
    fun findByTenantIdAndIsEnabledTrue(tenantId: UUID): List<IntegrationConfig>
    
    fun existsByTenantIdAndIntegrationType(tenantId: UUID, integrationType: String): Boolean
    
    @Query("SELECT ic FROM IntegrationConfig ic WHERE ic.tenantId = :tenantId AND ic.integrationType IN :types")
    fun findByTenantIdAndIntegrationTypeIn(tenantId: UUID, types: List<String>): List<IntegrationConfig>
}

@Repository
interface OAuthConnectionRepository : JpaRepository<OAuthConnection, UUID> {
    
    fun findByTenantIdAndUserId(tenantId: UUID, userId: UUID): List<OAuthConnection>
    
    fun findByTenantIdAndUserIdAndProvider(tenantId: UUID, userId: UUID, provider: String): OAuthConnection?
    
    fun findByTenantIdAndProvider(tenantId: UUID, provider: String): List<OAuthConnection>
    
    fun existsByTenantIdAndUserIdAndProvider(tenantId: UUID, userId: UUID, provider: String): Boolean
    
    fun deleteByTenantIdAndUserIdAndProvider(tenantId: UUID, userId: UUID, provider: String)
    
    @Query("SELECT oc FROM OAuthConnection oc WHERE oc.expiresAt < CURRENT_TIMESTAMP")
    fun findExpiredConnections(): List<OAuthConnection>
}


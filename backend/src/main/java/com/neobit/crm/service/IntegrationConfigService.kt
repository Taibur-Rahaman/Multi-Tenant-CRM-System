package com.neobit.crm.service

import com.neobit.crm.entity.IntegrationConfig
import com.neobit.crm.entity.Tenant
import com.neobit.crm.repository.IntegrationConfigRepository
import com.neobit.crm.repository.TenantRepository
import com.neobit.crm.security.TenantContext
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.*

data class IntegrationStatus(
    val integrationType: String,
    val isEnabled: Boolean,
    val isConfigured: Boolean,
    val lastSyncAt: Instant?,
    val syncStatus: String?,
    val config: Map<String, Any>? = null // excludes sensitive credentials
)

data class JiraConfigRequest(
    val baseUrl: String,
    val email: String,
    val apiToken: String,
    val defaultProjectKey: String? = null
)

data class SaveIntegrationConfigRequest(
    val integrationType: String,
    val config: Map<String, Any>,
    val credentials: Map<String, Any>,
    val isEnabled: Boolean = true
)

@Service
class IntegrationConfigService(
    private val integrationConfigRepository: IntegrationConfigRepository,
    private val tenantRepository: TenantRepository
) {
    private val logger = LoggerFactory.getLogger(IntegrationConfigService::class.java)
    
    @Transactional(readOnly = true)
    fun getAllIntegrations(): List<IntegrationStatus> {
        val tenantId = UUID.fromString(TenantContext.getCurrentTenantId())
        val configs = integrationConfigRepository.findByTenantId(tenantId)
        
        val configMap = configs.associateBy { it.integrationType }
        
        // Return status for all supported integrations
        val supportedIntegrations = listOf("jira", "linear", "gmail", "calendar", "telegram", "twilio")
        
        return supportedIntegrations.map { type ->
            val config = configMap[type]
            IntegrationStatus(
                integrationType = type,
                isEnabled = config?.isEnabled ?: false,
                isConfigured = config != null && !config.credentials.isNullOrEmpty(),
                lastSyncAt = config?.lastSyncAt,
                syncStatus = config?.syncStatus,
                config = config?.config?.filterKeys { it != "apiToken" && it != "password" && it != "secret" }
            )
        }
    }
    
    @Transactional(readOnly = true)
    fun getIntegration(integrationType: String): IntegrationStatus? {
        val tenantId = UUID.fromString(TenantContext.getCurrentTenantId())
        val config = integrationConfigRepository.findByTenantIdAndIntegrationType(tenantId, integrationType)
            .orElse(null) ?: return null
        
        return IntegrationStatus(
            integrationType = config.integrationType,
            isEnabled = config.isEnabled ?: false,
            isConfigured = !config.credentials.isNullOrEmpty(),
            lastSyncAt = config.lastSyncAt,
            syncStatus = config.syncStatus,
            config = config.config?.filterKeys { it != "apiToken" && it != "password" && it != "secret" }
        )
    }
    
    @Transactional
    fun saveJiraConfig(request: JiraConfigRequest): IntegrationStatus {
        val tenantId = UUID.fromString(TenantContext.getCurrentTenantId())
        val tenant = tenantRepository.findById(tenantId)
            .orElseThrow { RuntimeException("Tenant not found") }
        
        val config = integrationConfigRepository.findByTenantIdAndIntegrationType(tenantId, "jira")
            .orElse(null) ?: IntegrationConfig.builder()
                .tenant(tenant)
                .integrationType("jira")
                .build()
        
        config.isEnabled = true
        config.config = mutableMapOf<String, Any>(
            "baseUrl" to request.baseUrl.trimEnd('/'),
            "defaultProjectKey" to (request.defaultProjectKey ?: "")
        )
        config.credentials = mutableMapOf<String, Any>(
            "email" to request.email,
            "apiToken" to request.apiToken
        )
        
        val savedConfig = integrationConfigRepository.save(config)
        logger.info("Saved Jira config for tenant: {}", tenantId)
        
        return IntegrationStatus(
            integrationType = savedConfig.integrationType,
            isEnabled = savedConfig.isEnabled ?: false,
            isConfigured = true,
            lastSyncAt = savedConfig.lastSyncAt,
            syncStatus = savedConfig.syncStatus,
            config = savedConfig.config?.filterKeys { it != "apiToken" }
        )
    }
    
    @Transactional
    fun saveIntegrationConfig(request: SaveIntegrationConfigRequest): IntegrationStatus {
        val tenantId = UUID.fromString(TenantContext.getCurrentTenantId())
        val tenant = tenantRepository.findById(tenantId)
            .orElseThrow { RuntimeException("Tenant not found") }
        
        val config = integrationConfigRepository.findByTenantIdAndIntegrationType(tenantId, request.integrationType)
            .orElse(null) ?: IntegrationConfig.builder()
                .tenant(tenant)
                .integrationType(request.integrationType)
                .build()
        
        config.isEnabled = request.isEnabled
        config.config = request.config.toMutableMap()
        config.credentials = request.credentials.toMutableMap()
        
        val savedConfig = integrationConfigRepository.save(config)
        logger.info("Saved {} config for tenant: {}", request.integrationType, tenantId)
        
        return IntegrationStatus(
            integrationType = savedConfig.integrationType,
            isEnabled = savedConfig.isEnabled ?: false,
            isConfigured = !savedConfig.credentials.isNullOrEmpty(),
            lastSyncAt = savedConfig.lastSyncAt,
            syncStatus = savedConfig.syncStatus,
            config = savedConfig.config?.filterKeys { it != "apiToken" && it != "password" && it != "secret" }
        )
    }
    
    @Transactional
    fun enableIntegration(integrationType: String): IntegrationStatus? {
        val tenantId = UUID.fromString(TenantContext.getCurrentTenantId())
        val config = integrationConfigRepository.findByTenantIdAndIntegrationType(tenantId, integrationType)
            .orElse(null) ?: return null
        
        config.isEnabled = true
        val savedConfig = integrationConfigRepository.save(config)
        
        return IntegrationStatus(
            integrationType = savedConfig.integrationType,
            isEnabled = true,
            isConfigured = !savedConfig.credentials.isNullOrEmpty(),
            lastSyncAt = savedConfig.lastSyncAt,
            syncStatus = savedConfig.syncStatus
        )
    }
    
    @Transactional
    fun disableIntegration(integrationType: String): IntegrationStatus? {
        val tenantId = UUID.fromString(TenantContext.getCurrentTenantId())
        val config = integrationConfigRepository.findByTenantIdAndIntegrationType(tenantId, integrationType)
            .orElse(null) ?: return null
        
        config.isEnabled = false
        val savedConfig = integrationConfigRepository.save(config)
        
        return IntegrationStatus(
            integrationType = savedConfig.integrationType,
            isEnabled = false,
            isConfigured = !savedConfig.credentials.isNullOrEmpty(),
            lastSyncAt = savedConfig.lastSyncAt,
            syncStatus = savedConfig.syncStatus
        )
    }
    
    @Transactional
    fun deleteIntegration(integrationType: String): Boolean {
        val tenantId = UUID.fromString(TenantContext.getCurrentTenantId())
        val config = integrationConfigRepository.findByTenantIdAndIntegrationType(tenantId, integrationType)
            .orElse(null) ?: return false
        
        integrationConfigRepository.delete(config)
        logger.info("Deleted {} integration for tenant: {}", integrationType, tenantId)
        return true
    }
    
    @Transactional
    fun updateSyncStatus(integrationType: String, status: String) {
        val tenantId = UUID.fromString(TenantContext.getCurrentTenantId())
        val config = integrationConfigRepository.findByTenantIdAndIntegrationType(tenantId, integrationType)
            .orElse(null) ?: return
        
        config.syncStatus = status
        config.lastSyncAt = Instant.now()
        integrationConfigRepository.save(config)
    }
    
    @Transactional
    fun saveTelegramChatIds(tenantId: UUID, chatIds: List<Long>): IntegrationStatus {
        val tenant = tenantRepository.findById(tenantId)
            .orElseThrow { RuntimeException("Tenant not found") }
        
        val config = integrationConfigRepository.findByTenantIdAndIntegrationType(tenantId, "telegram")
            .orElse(null) ?: IntegrationConfig.builder()
                .tenant(tenant)
                .integrationType("telegram")
                .build()
        
        // Update config with chat IDs (not credentials)
        val currentConfig = config.config?.toMutableMap() ?: mutableMapOf<String, Any>()
        currentConfig["chatIds"] = chatIds
        config.config = currentConfig
        
        // Enable if not already enabled
        if (config.isEnabled == null || !config.isEnabled) {
            config.isEnabled = true
        }
        
        val savedConfig = integrationConfigRepository.save(config)
        logger.info("Saved Telegram chat IDs for tenant: {}", tenantId)
        
        return IntegrationStatus(
            integrationType = savedConfig.integrationType,
            isEnabled = savedConfig.isEnabled ?: false,
            isConfigured = !savedConfig.credentials.isNullOrEmpty(),
            lastSyncAt = savedConfig.lastSyncAt,
            syncStatus = savedConfig.syncStatus,
            config = savedConfig.config
        )
    }
}


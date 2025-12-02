package com.neobit.crm.service

import com.neobit.crm.entity.*
import com.neobit.crm.integration.telegram.TelegramService
import com.neobit.crm.repository.IntegrationConfigRepository
import com.neobit.crm.repository.TenantRepository
import com.neobit.crm.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.util.*

@Service
class TelegramNotificationService(
    private val telegramService: TelegramService,
    private val integrationConfigRepository: IntegrationConfigRepository,
    private val tenantRepository: TenantRepository,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(TelegramNotificationService::class.java)
    
    /**
     * Get Telegram chat IDs for a tenant
     */
    fun getTelegramChatIds(tenantId: UUID): List<Long> {
        val config = integrationConfigRepository.findByTenantIdAndIntegrationType(
            tenantId, "telegram"
        ).orElse(null) ?: return emptyList()
        
        if (!config.isEnabled) return emptyList()
        
        val chatIds = config.config["chatIds"] as? List<*>
        return chatIds?.mapNotNull { 
            when (it) {
                is Number -> it.toLong()
                is String -> it.toLongOrNull()
                else -> null
            }
        } ?: emptyList()
    }
    
    /**
     * Send notification to all configured Telegram chats for a tenant
     */
    fun sendNotificationToTenant(tenantId: UUID, message: String, parseMode: String = "HTML"): Boolean {
        val chatIds = getTelegramChatIds(tenantId)
        if (chatIds.isEmpty()) {
            logger.debug("No Telegram chat IDs configured for tenant: $tenantId")
            return false
        }
        
        val botToken = telegramService.getBotToken(tenantId) ?: return false
        
        var success = true
        for (chatId in chatIds) {
            val sent = telegramService.sendMessageWithToken(botToken, chatId, message, parseMode)
            if (!sent) {
                logger.warn("Failed to send Telegram notification to chat $chatId for tenant $tenantId")
                success = false
            }
        }
        
        return success
    }
    
    /**
     * Notify about customer created
     */
    fun notifyCustomerCreated(tenantId: UUID, customer: Customer) {
        val message = buildString {
            append("🆕 <b>New Customer Created</b>\n\n")
            append("👤 <b>Name:</b> ${customer.firstName} ${customer.lastName ?: ""}\n")
            customer.email?.let { append("📧 <b>Email:</b> $it\n") }
            customer.phone?.let { append("📞 <b>Phone:</b> $it\n") }
            customer.leadStatus?.let { append("📊 <b>Status:</b> $it\n") }
            customer.leadSource?.let { append("🔗 <b>Source:</b> $it\n") }
            append("\n<i>Created at: ${customer.createdAt}</i>")
        }
        
        sendNotificationToTenant(tenantId, message)
    }
    
    /**
     * Notify about customer updated
     */
    fun notifyCustomerUpdated(tenantId: UUID, customer: Customer) {
        val message = buildString {
            append("✏️ <b>Customer Updated</b>\n\n")
            append("👤 <b>Name:</b> ${customer.firstName} ${customer.lastName ?: ""}\n")
            customer.email?.let { append("📧 <b>Email:</b> $it\n") }
            customer.leadStatus?.let { append("📊 <b>Status:</b> $it\n") }
            append("\n<i>Updated at: ${customer.updatedAt}</i>")
        }
        
        sendNotificationToTenant(tenantId, message)
    }
    
    /**
     * Notify about customer deleted
     */
    fun notifyCustomerDeleted(tenantId: UUID, customerName: String, customerEmail: String?) {
        val message = buildString {
            append("🗑️ <b>Customer Deleted</b>\n\n")
            append("👤 <b>Name:</b> $customerName\n")
            customerEmail?.let { append("📧 <b>Email:</b> $it\n") }
            append("\n<i>Deleted at: ${java.time.Instant.now()}</i>")
        }
        
        sendNotificationToTenant(tenantId, message)
    }
    
    /**
     * Notify about task created
     */
    fun notifyTaskCreated(tenantId: UUID, task: Task) {
        val message = buildString {
            append("✅ <b>New Task Created</b>\n\n")
            append("📝 <b>Title:</b> ${task.title}\n")
            task.description?.let { append("📄 <b>Description:</b> ${it.take(100)}${if (it.length > 100) "..." else ""}\n") }
            append("📊 <b>Status:</b> ${task.status}\n")
            append("⚡ <b>Priority:</b> ${task.priority}\n")
            task.dueDate?.let { append("📅 <b>Due Date:</b> ${it}\n") }
            task.assignedTo?.let { append("👤 <b>Assigned To:</b> ${it.firstName} ${it.lastName ?: ""}\n") }
            append("\n<i>Created at: ${task.createdAt}</i>")
        }
        
        sendNotificationToTenant(tenantId, message)
    }
    
    /**
     * Notify about task updated
     */
    fun notifyTaskUpdated(tenantId: UUID, task: Task) {
        val message = buildString {
            append("✏️ <b>Task Updated</b>\n\n")
            append("📝 <b>Title:</b> ${task.title}\n")
            append("📊 <b>Status:</b> ${task.status}\n")
            task.dueDate?.let { append("📅 <b>Due Date:</b> ${it}\n") }
            append("\n<i>Updated at: ${task.updatedAt}</i>")
        }
        
        sendNotificationToTenant(tenantId, message)
    }
    
    /**
     * Notify about task completed
     */
    fun notifyTaskCompleted(tenantId: UUID, task: Task) {
        val message = buildString {
            append("🎉 <b>Task Completed</b>\n\n")
            append("📝 <b>Title:</b> ${task.title}\n")
            task.assignedTo?.let { append("👤 <b>Completed By:</b> ${it.firstName} ${it.lastName ?: ""}\n") }
            task.completedAt?.let { append("✅ <b>Completed At:</b> ${it}\n") }
        }
        
        sendNotificationToTenant(tenantId, message)
    }
    
    /**
     * Notify about task deleted
     */
    fun notifyTaskDeleted(tenantId: UUID, taskTitle: String) {
        val message = buildString {
            append("🗑️ <b>Task Deleted</b>\n\n")
            append("📝 <b>Title:</b> $taskTitle\n")
            append("\n<i>Deleted at: ${java.time.Instant.now()}</i>")
        }
        
        sendNotificationToTenant(tenantId, message)
    }
    
    /**
     * Notify about interaction created
     */
    fun notifyInteractionCreated(tenantId: UUID, interaction: Interaction) {
        val message = buildString {
            append("💬 <b>New Interaction</b>\n\n")
            append("📋 <b>Type:</b> ${interaction.type}\n")
            append("📊 <b>Direction:</b> ${interaction.direction}\n")
            interaction.subject?.let { append("📝 <b>Subject:</b> $it\n") }
            interaction.customer?.let { append("👤 <b>Customer:</b> ${it.firstName} ${it.lastName ?: ""}\n") }
            append("\n<i>Created at: ${interaction.createdAt}</i>")
        }
        
        sendNotificationToTenant(tenantId, message)
    }
    
    /**
     * Notify about account created
     */
    fun notifyAccountCreated(tenantId: UUID, account: Account) {
        val message = buildString {
            append("🏢 <b>New Account Created</b>\n\n")
            append("📛 <b>Name:</b> ${account.name}\n")
            account.website?.let { append("🌐 <b>Website:</b> $it\n") }
            account.industry?.let { append("🏭 <b>Industry:</b> $it\n") }
            append("\n<i>Created at: ${account.createdAt}</i>")
        }
        
        sendNotificationToTenant(tenantId, message)
    }
    
    /**
     * Notify about account updated
     */
    fun notifyAccountUpdated(tenantId: UUID, account: Account) {
        val message = buildString {
            append("✏️ <b>Account Updated</b>\n\n")
            append("📛 <b>Name:</b> ${account.name}\n")
            append("\n<i>Updated at: ${account.updatedAt}</i>")
        }
        
        sendNotificationToTenant(tenantId, message)
    }
    
    /**
     * Notify about account deleted
     */
    fun notifyAccountDeleted(tenantId: UUID, accountName: String) {
        val message = buildString {
            append("🗑️ <b>Account Deleted</b>\n\n")
            append("📛 <b>Name:</b> $accountName\n")
            append("\n<i>Deleted at: ${java.time.Instant.now()}</i>")
        }
        
        sendNotificationToTenant(tenantId, message)
    }
    
    /**
     * Generic notification method
     */
    fun sendGenericNotification(tenantId: UUID, title: String, details: Map<String, String>) {
        val message = buildString {
            append("<b>$title</b>\n\n")
            details.forEach { (key, value) ->
                append("<b>$key:</b> $value\n")
            }
            append("\n<i>${java.time.Instant.now()}</i>")
        }
        
        sendNotificationToTenant(tenantId, message)
    }
}



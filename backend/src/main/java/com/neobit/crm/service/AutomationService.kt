package com.neobit.crm.service

import com.neobit.crm.entity.*
import com.neobit.crm.integration.telegram.TelegramMessage
import com.neobit.crm.repository.*
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.*

@Service
class AutomationService(
    private val customerRepository: CustomerRepository,
    private val interactionRepository: InteractionRepository,
    private val taskRepository: TaskRepository,
    private val userRepository: UserRepository,
    private val tenantRepository: TenantRepository
) {
    private val logger = LoggerFactory.getLogger(AutomationService::class.java)
    
    /**
     * Process incoming Telegram messages
     * - Auto-sync messages as interactions
     * - Auto-detect customer by phone/username
     * - Auto-detect complaints
     */
    fun processTelegramMessage(tenantId: UUID, message: TelegramMessage) {
        logger.info("Processing Telegram message from ${message.fromUsername ?: message.fromId}")
        
        val tenant = tenantRepository.findById(tenantId).orElse(null) ?: return
        
        // Try to find customer by Telegram username or chat ID
        val customer = findCustomerByTelegram(tenantId, message)
        
        // Create interaction using builder
        val interaction = Interaction.builder()
            .tenant(tenant)
            .customer(customer)
            .account(customer?.account)
            .type(Interaction.InteractionType.MESSAGE)
            .direction(Interaction.InteractionDirection.INBOUND)
            .status(Interaction.InteractionStatus.COMPLETED)
            .subject("Telegram Message")
            .description(message.text)
            .externalId(message.messageId.toString())
            .externalSource("telegram")
            .build()
        
        interactionRepository.save(interaction)
        
        // Check for complaint keywords
        if (isComplaint(message.text)) {
            createComplaintTask(tenantId, tenant, customer, message)
        }
    }
    
    /**
     * Process Jira webhook events
     * - Sync issue status changes back to CRM
     */
    fun processJiraWebhook(tenantId: UUID, webhookEvent: String, issue: Map<*, *>) {
        logger.info("Processing Jira webhook: $webhookEvent")
        
        val issueKey = issue["key"] as? String ?: return
        val fields = issue["fields"] as? Map<*, *> ?: return
        
        when {
            webhookEvent.contains("issue_created") -> {
                logger.info("Jira issue created: $issueKey")
            }
            webhookEvent.contains("issue_updated") -> {
                logger.info("Jira issue updated: $issueKey")
                // Could update related CRM tasks here
            }
            webhookEvent.contains("issue_deleted") -> {
                logger.info("Jira issue deleted: $issueKey")
            }
        }
    }
    
    /**
     * Process Gmail push notifications
     * - Auto-create leads from emails
     * - Auto-sync important emails
     */
    fun processGmailNotification(tenantId: UUID, data: String) {
        logger.info("Processing Gmail notification for tenant: $tenantId")
        
        // The data contains historyId - would need to fetch new messages
        // This is a placeholder for full implementation
    }
    
    /**
     * Process Calendar push notifications
     * - Sync calendar events to CRM
     */
    fun processCalendarNotification(tenantId: UUID, resourceId: String?, resourceState: String?) {
        logger.info("Processing Calendar notification: $resourceState for resource: $resourceId")
        
        // Placeholder for full implementation
        // Would fetch updated calendar events and sync to CRM
    }
    
    /**
     * Auto-create lead from email
     */
    fun autoCreateLeadFromEmail(
        tenantId: UUID,
        fromEmail: String,
        fromName: String?,
        subject: String,
        body: String
    ): Customer? {
        // Check if customer already exists
        val existingCustomer = customerRepository.findByEmailAndTenantId(fromEmail, tenantId).orElse(null)
        if (existingCustomer != null) {
            return existingCustomer
        }
        
        val tenant = tenantRepository.findById(tenantId).orElse(null) ?: return null
        
        // Parse name from email or from field
        val nameParts = (fromName ?: fromEmail.substringBefore("@")).split(" ", limit = 2)
        val firstName = nameParts.getOrNull(0) ?: "Unknown"
        val lastName = nameParts.getOrNull(1)
        
        val customer = Customer.builder()
            .tenant(tenant)
            .firstName(firstName)
            .lastName(lastName)
            .email(fromEmail)
            .leadSource("email")
            .leadStatus("new")
            .isLead(true)
            .build()
        
        return customerRepository.save(customer)
    }
    
    /**
     * Detect complaints in message text
     */
    private fun isComplaint(text: String?): Boolean {
        if (text.isNullOrBlank()) return false
        
        val complaintKeywords = listOf(
            "complaint", "complain", "unhappy", "disappointed", "angry",
            "frustrated", "terrible", "awful", "worst", "never again",
            "refund", "cancel", "sue", "lawyer", "unacceptable",
            "problem", "issue", "broken", "not working", "failed"
        )
        
        val lowerText = text.lowercase()
        return complaintKeywords.any { keyword -> lowerText.contains(keyword) }
    }
    
    /**
     * Create a task for complaint handling
     */
    private fun createComplaintTask(tenantId: UUID, tenant: Tenant, customer: Customer?, message: TelegramMessage) {
        // Find admin user to assign task
        val adminUser = userRepository.findByTenantIdAndRole(tenantId, User.UserRole.ADMIN).firstOrNull()
        
        val task = Task.builder()
            .tenant(tenant)
            .title("Handle Customer Complaint")
            .description("""
                Complaint received via Telegram:
                From: ${message.fromUsername ?: message.fromFirstName ?: "Unknown"}
                Message: ${message.text}
                
                Please review and respond promptly.
            """.trimIndent())
            .status("pending")
            .priority("high")
            .customer(customer)
            .assignedTo(adminUser)
            .dueDate(Instant.now().plusSeconds(24 * 60 * 60)) // Due in 24 hours
            .build()
        
        taskRepository.save(task)
        logger.info("Created complaint task for tenant: $tenantId")
    }
    
    /**
     * Find customer by Telegram information
     */
    private fun findCustomerByTelegram(tenantId: UUID, message: TelegramMessage): Customer? {
        // Try to find by stored Telegram chat ID or username in custom fields
        // For now, return null - can be extended to search custom_fields
        return null
    }
    
    /**
     * Auto-update CRM fields based on interaction analysis
     */
    fun autoUpdateLeadStatus(tenantId: UUID, customerId: UUID) {
        val customer = customerRepository.findByIdAndTenantId(customerId, tenantId).orElse(null) ?: return
        
        val interactionCount = interactionRepository.countByTenantId(tenantId)
        
        // Auto-update lead status based on interaction count
        val newStatus = when {
            interactionCount >= 10 -> "qualified"
            interactionCount >= 5 -> "nurturing"
            interactionCount >= 1 -> "contacted"
            else -> "new"
        }
        
        if (customer.leadStatus != newStatus && customer.isLead == true) {
            customer.leadStatus = newStatus
            customer.updatedAt = Instant.now()
            customerRepository.save(customer)
            logger.info("Auto-updated lead status for customer $customerId to $newStatus")
        }
    }
    
    /**
     * Calculate and update lead score
     */
    fun updateLeadScore(tenantId: UUID, customerId: UUID) {
        val customer = customerRepository.findByIdAndTenantId(customerId, tenantId).orElse(null) ?: return
        
        var score = 0
        
        // Points for profile completeness
        if (customer.email != null) score += 10
        if (customer.phone != null) score += 10
        if (customer.jobTitle != null) score += 5
        if (customer.account != null) score += 15
        
        // Points for interactions
        val interactionCount = interactionRepository.countByTenantId(tenantId)
        score += (interactionCount * 5).coerceAtMost(50).toInt()
        
        customer.leadScore = score
        customer.updatedAt = Instant.now()
        customerRepository.save(customer)
    }
}

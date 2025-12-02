package com.neobit.crm.controller

import com.neobit.crm.dto.ApiResponse
import com.neobit.crm.integration.gmail.*
import com.neobit.crm.integration.calendar.*
import com.neobit.crm.integration.telegram.*
import com.neobit.crm.integration.jira.*
import com.neobit.crm.integration.telephony.*
import com.neobit.crm.security.TenantContext
import com.neobit.crm.security.UserPrincipal
import com.neobit.crm.service.*
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.time.ZonedDateTime
import java.util.*

@RestController
@RequestMapping("/api/integrations")
class IntegrationController(
    private val gmailService: GmailService,
    private val calendarService: CalendarService,
    private val telegramService: TelegramService,
    private val jiraService: JiraService,
    private val telephonyService: TelephonyService,
    private val integrationConfigService: IntegrationConfigService
) {
    
    // ============ Integration Config Management ============
    
    @GetMapping("/status")
    fun getAllIntegrationStatus(): ResponseEntity<ApiResponse<List<IntegrationStatus>>> {
        val statuses = integrationConfigService.getAllIntegrations()
        return ResponseEntity.ok(ApiResponse.success(statuses))
    }
    
    @GetMapping("/status/{integrationType}")
    fun getIntegrationStatus(
        @PathVariable integrationType: String
    ): ResponseEntity<ApiResponse<IntegrationStatus>> {
        val status = integrationConfigService.getIntegration(integrationType)
        return if (status != null) {
            ResponseEntity.ok(ApiResponse.success(status))
        } else {
            ResponseEntity.ok(ApiResponse.success(IntegrationStatus(
                integrationType = integrationType,
                isEnabled = false,
                isConfigured = false,
                lastSyncAt = null,
                syncStatus = null
            )))
        }
    }
    
    @PostMapping("/config/jira")
    fun saveJiraConfig(
        @RequestBody request: JiraConfigRequest
    ): ResponseEntity<ApiResponse<IntegrationStatus>> {
        val status = integrationConfigService.saveJiraConfig(request)
        return ResponseEntity.ok(ApiResponse.success(status, "Jira configuration saved"))
    }
    
    @PostMapping("/config")
    fun saveIntegrationConfig(
        @RequestBody request: SaveIntegrationConfigRequest
    ): ResponseEntity<ApiResponse<IntegrationStatus>> {
        val status = integrationConfigService.saveIntegrationConfig(request)
        return ResponseEntity.ok(ApiResponse.success(status, "Integration configuration saved"))
    }
    
    @PostMapping("/{integrationType}/enable")
    fun enableIntegration(
        @PathVariable integrationType: String
    ): ResponseEntity<ApiResponse<IntegrationStatus>> {
        val status = integrationConfigService.enableIntegration(integrationType)
        return if (status != null) {
            ResponseEntity.ok(ApiResponse.success(status, "Integration enabled"))
        } else {
            ResponseEntity.badRequest().body(ApiResponse.error("Integration not configured"))
        }
    }
    
    @PostMapping("/{integrationType}/disable")
    fun disableIntegration(
        @PathVariable integrationType: String
    ): ResponseEntity<ApiResponse<IntegrationStatus>> {
        val status = integrationConfigService.disableIntegration(integrationType)
        return if (status != null) {
            ResponseEntity.ok(ApiResponse.success(status, "Integration disabled"))
        } else {
            ResponseEntity.badRequest().body(ApiResponse.error("Integration not found"))
        }
    }
    
    @DeleteMapping("/{integrationType}")
    fun deleteIntegration(
        @PathVariable integrationType: String
    ): ResponseEntity<ApiResponse<Unit>> {
        val deleted = integrationConfigService.deleteIntegration(integrationType)
        return if (deleted) {
            ResponseEntity.ok(ApiResponse.success(Unit, "Integration deleted"))
        } else {
            ResponseEntity.badRequest().body(ApiResponse.error("Integration not found"))
        }
    }
    
    @PostMapping("/jira/test")
    fun testJiraConnection(): ResponseEntity<ApiResponse<Map<String, Any>>> {
        return try {
            val tenantId = TenantContext.getCurrentTenant()
            val config = jiraService.getJiraConfig(tenantId)
            if (config != null) {
                // Try to fetch a single issue to test connection
                val issues = jiraService.searchIssues(tenantId, "project IS NOT EMPTY", 1)
                ResponseEntity.ok(ApiResponse.success(mapOf(
                    "connected" to true,
                    "baseUrl" to config.baseUrl,
                    "issueCount" to issues.size
                ), "Jira connection successful"))
            } else {
                ResponseEntity.ok(ApiResponse.success(mapOf(
                    "connected" to false,
                    "message" to "Jira not configured"
                )))
            }
        } catch (e: Exception) {
            ResponseEntity.ok(ApiResponse.success(mapOf(
                "connected" to false,
                "error" to (e.message ?: "Connection failed")
            )))
        }
    }
    
    @GetMapping("/jira/projects")
    fun getJiraProjects(): ResponseEntity<ApiResponse<List<Map<String, String>>>> {
        val tenantId = TenantContext.getCurrentTenant()
        val config = jiraService.getJiraConfig(tenantId)
        
        if (config == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Jira not configured"))
        }
        
        // Get projects from Jira - simplified, would need to implement in JiraService
        // For now return empty list, the actual project list would be fetched
        return ResponseEntity.ok(ApiResponse.success(emptyList()))
    }
    
    // ============ Gmail Endpoints ============
    
    @GetMapping("/gmail/messages")
    fun listEmails(
        @AuthenticationPrincipal user: UserPrincipal,
        @RequestParam(defaultValue = "20") maxResults: Int,
        @RequestParam(required = false) query: String?
    ): ResponseEntity<ApiResponse<List<EmailMessage>>> {
        val emails = gmailService.listMessages(
            TenantContext.getCurrentTenant(),
            user.id,
            maxResults,
            query
        )
        return ResponseEntity.ok(ApiResponse.success(emails))
    }
    
    @PostMapping("/gmail/send")
    fun sendEmail(
        @AuthenticationPrincipal user: UserPrincipal,
        @RequestBody request: SendEmailRequest
    ): ResponseEntity<ApiResponse<Map<String, String>>> {
        val messageId = gmailService.sendEmail(
            TenantContext.getCurrentTenant(),
            user.id,
            request
        )
        return if (messageId != null) {
            ResponseEntity.ok(ApiResponse.success(mapOf("messageId" to messageId)))
        } else {
            ResponseEntity.badRequest().body(ApiResponse.error("Failed to send email"))
        }
    }
    
    @PostMapping("/gmail/sync")
    fun syncEmails(
        @AuthenticationPrincipal user: UserPrincipal,
        @RequestParam(defaultValue = "newer_than:7d") query: String
    ): ResponseEntity<ApiResponse<List<EmailMessage>>> {
        val emails = gmailService.syncEmails(
            TenantContext.getCurrentTenant(),
            user.id,
            query
        )
        return ResponseEntity.ok(ApiResponse.success(emails, "Synced ${emails.size} emails"))
    }
    
    // ============ Calendar Endpoints ============
    
    @GetMapping("/calendar/events")
    fun listCalendarEvents(
        @AuthenticationPrincipal user: UserPrincipal,
        @RequestParam(required = false) maxResults: Int?
    ): ResponseEntity<ApiResponse<List<CalendarEvent>>> {
        val events = calendarService.listEvents(
            TenantContext.getCurrentTenant(),
            user.id,
            maxResults = maxResults ?: 50
        )
        return ResponseEntity.ok(ApiResponse.success(events))
    }
    
    @GetMapping("/calendar/events/{eventId}")
    fun getCalendarEvent(
        @AuthenticationPrincipal user: UserPrincipal,
        @PathVariable eventId: String
    ): ResponseEntity<ApiResponse<CalendarEvent>> {
        val event = calendarService.getEvent(
            TenantContext.getCurrentTenant(),
            user.id,
            eventId
        )
        return if (event != null) {
            ResponseEntity.ok(ApiResponse.success(event))
        } else {
            ResponseEntity.notFound().build()
        }
    }
    
    @PostMapping("/calendar/events")
    fun createCalendarEvent(
        @AuthenticationPrincipal user: UserPrincipal,
        @RequestBody request: CreateEventRequest
    ): ResponseEntity<ApiResponse<CalendarEvent>> {
        val event = calendarService.createEvent(
            TenantContext.getCurrentTenant(),
            user.id,
            request
        )
        return if (event != null) {
            ResponseEntity.ok(ApiResponse.success(event, "Event created"))
        } else {
            ResponseEntity.badRequest().body(ApiResponse.error("Failed to create event"))
        }
    }
    
    @PutMapping("/calendar/events/{eventId}")
    fun updateCalendarEvent(
        @AuthenticationPrincipal user: UserPrincipal,
        @PathVariable eventId: String,
        @RequestBody request: CreateEventRequest
    ): ResponseEntity<ApiResponse<CalendarEvent>> {
        val event = calendarService.updateEvent(
            TenantContext.getCurrentTenant(),
            user.id,
            eventId,
            request
        )
        return if (event != null) {
            ResponseEntity.ok(ApiResponse.success(event, "Event updated"))
        } else {
            ResponseEntity.badRequest().body(ApiResponse.error("Failed to update event"))
        }
    }
    
    @DeleteMapping("/calendar/events/{eventId}")
    fun deleteCalendarEvent(
        @AuthenticationPrincipal user: UserPrincipal,
        @PathVariable eventId: String
    ): ResponseEntity<ApiResponse<Unit>> {
        val deleted = calendarService.deleteEvent(
            TenantContext.getCurrentTenant(),
            user.id,
            eventId
        )
        return if (deleted) {
            ResponseEntity.ok(ApiResponse.success(Unit, "Event deleted"))
        } else {
            ResponseEntity.badRequest().body(ApiResponse.error("Failed to delete event"))
        }
    }
    
    @PostMapping("/calendar/sync")
    fun syncCalendar(
        @AuthenticationPrincipal user: UserPrincipal
    ): ResponseEntity<ApiResponse<List<CalendarEvent>>> {
        val events = calendarService.syncEvents(
            TenantContext.getCurrentTenant(),
            user.id
        )
        return ResponseEntity.ok(ApiResponse.success(events, "Synced ${events.size} events"))
    }
    
    // ============ Telegram Endpoints ============
    
    @PostMapping("/telegram/send")
    fun sendTelegramMessage(
        @RequestBody request: SendMessageRequest
    ): ResponseEntity<ApiResponse<Unit>> {
        val sent = telegramService.sendMessage(TenantContext.getCurrentTenant(), request)
        return if (sent) {
            ResponseEntity.ok(ApiResponse.success(Unit, "Message sent"))
        } else {
            ResponseEntity.badRequest().body(ApiResponse.error("Failed to send message"))
        }
    }
    
    @GetMapping("/telegram/updates")
    fun getTelegramUpdates(
        @RequestParam(required = false) offset: Long?,
        @RequestParam(defaultValue = "100") limit: Int
    ): ResponseEntity<ApiResponse<List<TelegramUpdate>>> {
        val updates = telegramService.getUpdates(TenantContext.getCurrentTenant(), offset, limit)
        return ResponseEntity.ok(ApiResponse.success(updates))
    }
    
    @PostMapping("/telegram/webhook")
    fun setTelegramWebhook(
        @RequestBody body: Map<String, String>
    ): ResponseEntity<ApiResponse<Unit>> {
        val webhookUrl = body["webhookUrl"] ?: return ResponseEntity.badRequest()
            .body(ApiResponse.error("webhookUrl is required"))
        
        val success = telegramService.setWebhook(TenantContext.getCurrentTenant(), webhookUrl)
        return if (success) {
            ResponseEntity.ok(ApiResponse.success(Unit, "Webhook set"))
        } else {
            ResponseEntity.badRequest().body(ApiResponse.error("Failed to set webhook"))
        }
    }
    
    @DeleteMapping("/telegram/webhook")
    fun deleteTelegramWebhook(): ResponseEntity<ApiResponse<Unit>> {
        val success = telegramService.deleteWebhook(TenantContext.getCurrentTenant())
        return if (success) {
            ResponseEntity.ok(ApiResponse.success(Unit, "Webhook deleted"))
        } else {
            ResponseEntity.badRequest().body(ApiResponse.error("Failed to delete webhook"))
        }
    }
    
    @GetMapping("/telegram/bot-info")
    fun getTelegramBotInfo(): ResponseEntity<ApiResponse<Map<String, Any>>> {
        val botInfo = telegramService.getBotInfo(TenantContext.getCurrentTenant())
        return if (botInfo != null) {
            ResponseEntity.ok(ApiResponse.success(botInfo))
        } else {
            ResponseEntity.badRequest().body(ApiResponse.error("Failed to get bot info or bot not configured"))
        }
    }
    
    @PostMapping("/telegram/chat-ids")
    fun configureTelegramChatIds(
        @RequestBody body: Map<String, Any>
    ): ResponseEntity<ApiResponse<IntegrationStatus>> {
        val chatIds = body["chatIds"] as? List<*>
        if (chatIds == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("chatIds is required"))
        }
        
        val tenantId = TenantContext.getCurrentTenant()
        val status = integrationConfigService.saveTelegramChatIds(tenantId, chatIds.mapNotNull { 
            when (it) {
                is Number -> it.toLong()
                is String -> it.toLongOrNull()
                else -> null
            }
        })
        
        return ResponseEntity.ok(ApiResponse.success(status, "Telegram chat IDs configured"))
    }
    
    @PostMapping("/telegram/test")
    fun sendTestTelegramMessage(
        @RequestBody body: Map<String, Any>
    ): ResponseEntity<ApiResponse<Unit>> {
        val chatId = (body["chatId"] as? Number)?.toLong()
        val message = body["message"] as? String
        
        if (chatId == null || message == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("chatId and message are required"))
        }
        
        val tenantId = TenantContext.getCurrentTenant()
        val botToken = telegramService.getBotToken(tenantId)
        
        if (botToken == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Telegram bot not configured"))
        }
        
        val sent = telegramService.sendMessageWithToken(botToken, chatId, message)
        return if (sent) {
            ResponseEntity.ok(ApiResponse.success(Unit, "Test message sent"))
        } else {
            ResponseEntity.badRequest().body(ApiResponse.error("Failed to send test message"))
        }
    }
    
    // ============ Jira Endpoints ============
    
    @PostMapping("/jira/issues")
    fun createJiraIssue(
        @RequestBody request: CreateJiraIssueRequest
    ): ResponseEntity<ApiResponse<JiraIssue>> {
        val issue = jiraService.createIssue(TenantContext.getCurrentTenant(), request)
        return if (issue != null) {
            ResponseEntity.ok(ApiResponse.success(issue, "Issue created"))
        } else {
            ResponseEntity.badRequest().body(ApiResponse.error("Failed to create issue"))
        }
    }
    
    @GetMapping("/jira/issues/{issueKey}")
    fun getJiraIssue(
        @PathVariable issueKey: String
    ): ResponseEntity<ApiResponse<JiraIssue>> {
        val issue = jiraService.getIssue(TenantContext.getCurrentTenant(), issueKey)
        return if (issue != null) {
            ResponseEntity.ok(ApiResponse.success(issue))
        } else {
            ResponseEntity.notFound().build()
        }
    }
    
    @GetMapping("/jira/search")
    fun searchJiraIssues(
        @RequestParam jql: String,
        @RequestParam(defaultValue = "50") maxResults: Int
    ): ResponseEntity<ApiResponse<List<JiraIssue>>> {
        val issues = jiraService.searchIssues(TenantContext.getCurrentTenant(), jql, maxResults)
        return ResponseEntity.ok(ApiResponse.success(issues))
    }
    
    @PutMapping("/jira/issues/{issueKey}")
    fun updateJiraIssue(
        @PathVariable issueKey: String,
        @RequestBody request: UpdateJiraIssueRequest
    ): ResponseEntity<ApiResponse<JiraIssue>> {
        val issue = jiraService.updateIssue(TenantContext.getCurrentTenant(), issueKey, request)
        return if (issue != null) {
            ResponseEntity.ok(ApiResponse.success(issue, "Issue updated"))
        } else {
            ResponseEntity.badRequest().body(ApiResponse.error("Failed to update issue"))
        }
    }
    
    @PostMapping("/jira/issues/{issueKey}/transition")
    fun transitionJiraIssue(
        @PathVariable issueKey: String,
        @RequestBody body: Map<String, String>
    ): ResponseEntity<ApiResponse<Unit>> {
        val status = body["status"] ?: return ResponseEntity.badRequest()
            .body(ApiResponse.error("status is required"))
        
        val success = jiraService.transitionIssue(TenantContext.getCurrentTenant(), issueKey, status)
        return if (success) {
            ResponseEntity.ok(ApiResponse.success(Unit, "Issue transitioned"))
        } else {
            ResponseEntity.badRequest().body(ApiResponse.error("Failed to transition issue"))
        }
    }
    
    @PostMapping("/jira/issues/{issueKey}/comment")
    fun addJiraComment(
        @PathVariable issueKey: String,
        @RequestBody body: Map<String, String>
    ): ResponseEntity<ApiResponse<Unit>> {
        val comment = body["comment"] ?: return ResponseEntity.badRequest()
            .body(ApiResponse.error("comment is required"))
        
        val success = jiraService.addComment(TenantContext.getCurrentTenant(), issueKey, comment)
        return if (success) {
            ResponseEntity.ok(ApiResponse.success(Unit, "Comment added"))
        } else {
            ResponseEntity.badRequest().body(ApiResponse.error("Failed to add comment"))
        }
    }
    
    // ============ Telephony Endpoints ============
    
    @PostMapping("/telephony/call")
    fun initiateCall(
        @AuthenticationPrincipal user: UserPrincipal,
        @RequestBody request: CallRequest
    ): ResponseEntity<ApiResponse<CallResult>> {
        val result = telephonyService.initiateCall(
            TenantContext.getCurrentTenant(),
            user.id,
            request
        )
        return if (result != null) {
            ResponseEntity.ok(ApiResponse.success(result, "Call initiated"))
        } else {
            ResponseEntity.badRequest().body(ApiResponse.error("Failed to initiate call"))
        }
    }
    
    @GetMapping("/telephony/calls/{callId}")
    fun getCallStatus(
        @PathVariable callId: String
    ): ResponseEntity<ApiResponse<CallResult>> {
        val result = telephonyService.getCallStatus(TenantContext.getCurrentTenant(), callId)
        return if (result != null) {
            ResponseEntity.ok(ApiResponse.success(result))
        } else {
            ResponseEntity.notFound().build()
        }
    }
    
    @GetMapping("/telephony/calls")
    fun listRecentCalls(
        @RequestParam(defaultValue = "50") limit: Int
    ): ResponseEntity<ApiResponse<List<CallResult>>> {
        val calls = telephonyService.listRecentCalls(TenantContext.getCurrentTenant(), limit)
        return ResponseEntity.ok(ApiResponse.success(calls))
    }
}


package com.neobit.crm.controller

import com.neobit.crm.dto.ApiResponse
import com.neobit.crm.integration.telegram.TelegramService
import com.neobit.crm.integration.telephony.CallWebhookEvent
import com.neobit.crm.integration.telephony.TelephonyService
import com.neobit.crm.service.AutomationService
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/webhooks")
class WebhookController(
    private val telegramService: TelegramService,
    private val telephonyService: TelephonyService,
    private val automationService: AutomationService
) {
    private val logger = LoggerFactory.getLogger(WebhookController::class.java)
    
    /**
     * Telegram Bot Webhook
     * Receives messages from Telegram and processes them
     */
    @PostMapping("/telegram/{tenantId}")
    fun handleTelegramWebhook(
        @PathVariable tenantId: UUID,
        @RequestBody payload: Map<String, Any>
    ): ResponseEntity<Any> {
        logger.info("Received Telegram webhook for tenant: $tenantId")
        
        val update = telegramService.parseWebhookUpdate(payload)
        
        if (update?.message != null) {
            // Process the message through automation service
            automationService.processTelegramMessage(tenantId, update.message)
        }
        
        // Telegram expects 200 OK response
        return ResponseEntity.ok().build()
    }
    
    /**
     * Twilio Voice Webhook
     * Receives call status updates
     */
    @PostMapping("/telephony/twilio/{tenantId}")
    fun handleTwilioWebhook(
        @PathVariable tenantId: UUID,
        @RequestParam("CallSid") callSid: String,
        @RequestParam("CallStatus") callStatus: String,
        @RequestParam("From") from: String,
        @RequestParam("To") to: String,
        @RequestParam(value = "CallDuration", required = false) duration: Int?,
        @RequestParam(value = "RecordingUrl", required = false) recordingUrl: String?
    ): ResponseEntity<String> {
        logger.info("Received Twilio webhook for tenant: $tenantId, call: $callSid, status: $callStatus")
        
        val event = CallWebhookEvent(
            eventType = callStatus,
            callId = callSid,
            status = callStatus,
            fromNumber = from,
            toNumber = to,
            timestamp = System.currentTimeMillis(),
            durationSeconds = duration,
            recordingUrl = recordingUrl
        )
        
        telephonyService.processWebhookEvent(tenantId, event)
        
        // Return TwiML response
        return ResponseEntity.ok("""
            <?xml version="1.0" encoding="UTF-8"?>
            <Response></Response>
        """.trimIndent())
    }
    
    /**
     * Vonage Voice Webhook
     */
    @PostMapping("/telephony/vonage/{tenantId}")
    fun handleVonageWebhook(
        @PathVariable tenantId: UUID,
        @RequestBody payload: Map<String, Any>
    ): ResponseEntity<Any> {
        logger.info("Received Vonage webhook for tenant: $tenantId")
        
        val event = CallWebhookEvent(
            eventType = payload["status"] as? String ?: "unknown",
            callId = payload["uuid"] as? String ?: "",
            status = payload["status"] as? String ?: "unknown",
            fromNumber = (payload["from"] as? Map<*, *>)?.get("number") as? String ?: "",
            toNumber = (payload["to"] as? Map<*, *>)?.get("number") as? String ?: "",
            timestamp = System.currentTimeMillis(),
            durationSeconds = (payload["duration"] as? Number)?.toInt()
        )
        
        telephonyService.processWebhookEvent(tenantId, event)
        
        return ResponseEntity.ok().build()
    }
    
    /**
     * Jira Webhook
     * Receives issue updates from Jira
     */
    @PostMapping("/jira/{tenantId}")
    fun handleJiraWebhook(
        @PathVariable tenantId: UUID,
        @RequestBody payload: Map<String, Any>
    ): ResponseEntity<Any> {
        logger.info("Received Jira webhook for tenant: $tenantId")
        
        val webhookEvent = payload["webhookEvent"] as? String
        val issue = payload["issue"] as? Map<*, *>
        
        if (issue != null && webhookEvent != null) {
            automationService.processJiraWebhook(tenantId, webhookEvent, issue)
        }
        
        return ResponseEntity.ok().build()
    }
    
    /**
     * Gmail Push Notification Webhook
     */
    @PostMapping("/gmail/{tenantId}")
    fun handleGmailWebhook(
        @PathVariable tenantId: UUID,
        @RequestBody payload: Map<String, Any>
    ): ResponseEntity<Any> {
        logger.info("Received Gmail webhook for tenant: $tenantId")
        
        val message = payload["message"] as? Map<*, *>
        val data = message?.get("data") as? String
        
        if (data != null) {
            // Decode base64 data and process
            val decodedData = String(Base64.getDecoder().decode(data))
            automationService.processGmailNotification(tenantId, decodedData)
        }
        
        return ResponseEntity.ok().build()
    }
    
    /**
     * Google Calendar Push Notification Webhook
     */
    @PostMapping("/calendar/{tenantId}")
    fun handleCalendarWebhook(
        @PathVariable tenantId: UUID,
        @RequestHeader("X-Goog-Resource-ID", required = false) resourceId: String?,
        @RequestHeader("X-Goog-Resource-State", required = false) resourceState: String?
    ): ResponseEntity<Any> {
        logger.info("Received Calendar webhook for tenant: $tenantId, state: $resourceState")
        
        if (resourceState == "sync" || resourceState == "exists") {
            automationService.processCalendarNotification(tenantId, resourceId, resourceState)
        }
        
        return ResponseEntity.ok().build()
    }
}


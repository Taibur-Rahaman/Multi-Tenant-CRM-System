package com.neobit.crm.integration.telephony

import com.fasterxml.jackson.databind.ObjectMapper
import com.neobit.crm.entity.Interaction
import com.neobit.crm.entity.InteractionType
import com.neobit.crm.entity.InteractionDirection
import com.neobit.crm.entity.InteractionStatus
import com.neobit.crm.repository.CustomerRepository
import com.neobit.crm.repository.IntegrationConfigRepository
import com.neobit.crm.repository.InteractionRepository
import com.neobit.crm.security.TenantContext
import org.slf4j.LoggerFactory
import org.springframework.http.*
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate
import java.time.Instant
import java.util.*

data class CallRequest(
    val toNumber: String,
    val fromNumber: String? = null,
    val customerId: UUID? = null,
    val recordCall: Boolean = false
)

data class CallResult(
    val callId: String,
    val status: String,
    val fromNumber: String,
    val toNumber: String,
    val startTime: Instant,
    val endTime: Instant? = null,
    val durationSeconds: Int? = null,
    val recordingUrl: String? = null
)

data class CallWebhookEvent(
    val eventType: String,
    val callId: String,
    val status: String,
    val fromNumber: String,
    val toNumber: String,
    val timestamp: Long,
    val durationSeconds: Int? = null,
    val recordingUrl: String? = null
)

@Service
class TelephonyService(
    private val integrationConfigRepository: IntegrationConfigRepository,
    private val interactionRepository: InteractionRepository,
    private val customerRepository: CustomerRepository,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(TelephonyService::class.java)
    private val restTemplate = RestTemplate()
    
    data class TelephonyConfig(
        val provider: String,
        val apiKey: String,
        val apiSecret: String?,
        val accountSid: String?,
        val baseUrl: String,
        val defaultFromNumber: String?
    )
    
    fun getTelephonyConfig(tenantId: UUID): TelephonyConfig? {
        val config = integrationConfigRepository.findByTenantIdAndIntegrationType(
            tenantId, "telephony"
        ) ?: return null
        
        val configMap = objectMapper.readValue(config.configData, Map::class.java)
        
        return TelephonyConfig(
            provider = configMap["provider"] as? String ?: "twilio",
            apiKey = configMap["apiKey"] as? String ?: return null,
            apiSecret = configMap["apiSecret"] as? String,
            accountSid = configMap["accountSid"] as? String,
            baseUrl = configMap["baseUrl"] as? String ?: "https://api.twilio.com",
            defaultFromNumber = configMap["defaultFromNumber"] as? String
        )
    }
    
    fun initiateCall(tenantId: UUID, userId: UUID, request: CallRequest): CallResult? {
        val config = getTelephonyConfig(tenantId) ?: return null
        
        return when (config.provider.lowercase()) {
            "twilio" -> initiateTwilioCall(config, request)
            "vonage" -> initiateVonageCall(config, request)
            else -> {
                logger.error("Unsupported telephony provider: ${config.provider}")
                null
            }
        }?.also { result ->
            // Auto-log the call as an interaction
            logCallInteraction(tenantId, userId, request, result)
        }
    }
    
    private fun initiateTwilioCall(config: TelephonyConfig, request: CallRequest): CallResult? {
        val accountSid = config.accountSid ?: return null
        val url = "${config.baseUrl}/2010-04-01/Accounts/$accountSid/Calls.json"
        
        val fromNumber = request.fromNumber ?: config.defaultFromNumber ?: return null
        
        val formData = LinkedHashMap<String, String>()
        formData["To"] = request.toNumber
        formData["From"] = fromNumber
        formData["Twiml"] = "<Response><Say>Connecting your call</Say></Response>"
        
        if (request.recordCall) {
            formData["Record"] = "true"
        }
        
        return try {
            val headers = HttpHeaders().apply {
                contentType = MediaType.APPLICATION_FORM_URLENCODED
                setBasicAuth(accountSid, config.apiSecret ?: config.apiKey)
            }
            
            val body = formData.entries.joinToString("&") { 
                "${it.key}=${java.net.URLEncoder.encode(it.value, "UTF-8")}" 
            }
            
            val entity = HttpEntity(body, headers)
            val response = restTemplate.postForEntity(url, entity, Map::class.java)
            
            val responseBody = response.body ?: return null
            
            CallResult(
                callId = responseBody["sid"] as? String ?: "",
                status = responseBody["status"] as? String ?: "initiated",
                fromNumber = fromNumber,
                toNumber = request.toNumber,
                startTime = Instant.now()
            )
        } catch (e: Exception) {
            logger.error("Failed to initiate Twilio call", e)
            null
        }
    }
    
    private fun initiateVonageCall(config: TelephonyConfig, request: CallRequest): CallResult? {
        val url = "${config.baseUrl}/v1/calls"
        val fromNumber = request.fromNumber ?: config.defaultFromNumber ?: return null
        
        val body = mapOf(
            "to" to listOf(mapOf("type" to "phone", "number" to request.toNumber)),
            "from" to mapOf("type" to "phone", "number" to fromNumber),
            "ncco" to listOf(
                mapOf(
                    "action" to "talk",
                    "text" to "Connecting your call"
                )
            )
        )
        
        return try {
            val headers = HttpHeaders().apply {
                contentType = MediaType.APPLICATION_JSON
                setBearerAuth(config.apiKey)
            }
            
            val entity = HttpEntity(body, headers)
            val response = restTemplate.postForEntity(url, entity, Map::class.java)
            
            val responseBody = response.body ?: return null
            
            CallResult(
                callId = responseBody["uuid"] as? String ?: "",
                status = responseBody["status"] as? String ?: "initiated",
                fromNumber = fromNumber,
                toNumber = request.toNumber,
                startTime = Instant.now()
            )
        } catch (e: Exception) {
            logger.error("Failed to initiate Vonage call", e)
            null
        }
    }
    
    fun getCallStatus(tenantId: UUID, callId: String): CallResult? {
        val config = getTelephonyConfig(tenantId) ?: return null
        
        return when (config.provider.lowercase()) {
            "twilio" -> getTwilioCallStatus(config, callId)
            else -> null
        }
    }
    
    private fun getTwilioCallStatus(config: TelephonyConfig, callId: String): CallResult? {
        val accountSid = config.accountSid ?: return null
        val url = "${config.baseUrl}/2010-04-01/Accounts/$accountSid/Calls/$callId.json"
        
        return try {
            val headers = HttpHeaders().apply {
                setBasicAuth(accountSid, config.apiSecret ?: config.apiKey)
            }
            
            val entity = HttpEntity<Any>(headers)
            val response = restTemplate.exchange(url, HttpMethod.GET, entity, Map::class.java)
            
            val responseBody = response.body ?: return null
            
            CallResult(
                callId = responseBody["sid"] as? String ?: "",
                status = responseBody["status"] as? String ?: "unknown",
                fromNumber = responseBody["from"] as? String ?: "",
                toNumber = responseBody["to"] as? String ?: "",
                startTime = Instant.parse(responseBody["start_time"] as? String ?: Instant.now().toString()),
                endTime = (responseBody["end_time"] as? String)?.let { Instant.parse(it) },
                durationSeconds = (responseBody["duration"] as? String)?.toIntOrNull()
            )
        } catch (e: Exception) {
            logger.error("Failed to get Twilio call status", e)
            null
        }
    }
    
    fun processWebhookEvent(tenantId: UUID, event: CallWebhookEvent) {
        logger.info("Processing telephony webhook event: ${event.eventType} for call ${event.callId}")
        
        when (event.eventType.lowercase()) {
            "completed", "ended" -> {
                // Update the interaction with call details
                updateCallInteraction(tenantId, event)
            }
            "recording.completed" -> {
                // Update interaction with recording URL
                updateCallRecording(tenantId, event.callId, event.recordingUrl)
            }
        }
    }
    
    private fun logCallInteraction(
        tenantId: UUID, 
        userId: UUID, 
        request: CallRequest, 
        result: CallResult
    ) {
        val customer = request.customerId?.let { 
            customerRepository.findByIdAndTenantId(it, tenantId) 
        }
        
        val interaction = Interaction(
            tenantId = tenantId,
            customerId = customer?.id,
            accountId = customer?.account?.id,
            userId = userId,
            type = InteractionType.CALL,
            direction = InteractionDirection.OUTBOUND,
            status = InteractionStatus.IN_PROGRESS,
            subject = "Call to ${result.toNumber}",
            description = "Outbound call initiated via CRM",
            externalId = result.callId,
            integrationType = "telephony"
        )
        
        interactionRepository.save(interaction)
    }
    
    private fun updateCallInteraction(tenantId: UUID, event: CallWebhookEvent) {
        val interaction = interactionRepository.findByTenantIdAndExternalId(tenantId, event.callId)
        
        if (interaction != null) {
            interaction.status = InteractionStatus.COMPLETED
            interaction.durationSeconds = event.durationSeconds
            interaction.updatedAt = Instant.now()
            interactionRepository.save(interaction)
        }
    }
    
    private fun updateCallRecording(tenantId: UUID, callId: String, recordingUrl: String?) {
        if (recordingUrl == null) return
        
        val interaction = interactionRepository.findByTenantIdAndExternalId(tenantId, callId)
        
        if (interaction != null) {
            interaction.description = "${interaction.description}\n\nRecording: $recordingUrl"
            interaction.updatedAt = Instant.now()
            interactionRepository.save(interaction)
        }
    }
    
    fun listRecentCalls(tenantId: UUID, limit: Int = 50): List<CallResult> {
        val config = getTelephonyConfig(tenantId) ?: return emptyList()
        
        return when (config.provider.lowercase()) {
            "twilio" -> listTwilioCalls(config, limit)
            else -> emptyList()
        }
    }
    
    private fun listTwilioCalls(config: TelephonyConfig, limit: Int): List<CallResult> {
        val accountSid = config.accountSid ?: return emptyList()
        val url = "${config.baseUrl}/2010-04-01/Accounts/$accountSid/Calls.json?PageSize=$limit"
        
        return try {
            val headers = HttpHeaders().apply {
                setBasicAuth(accountSid, config.apiSecret ?: config.apiKey)
            }
            
            val entity = HttpEntity<Any>(headers)
            val response = restTemplate.exchange(url, HttpMethod.GET, entity, Map::class.java)
            
            val calls = response.body?.get("calls") as? List<*> ?: return emptyList()
            
            calls.mapNotNull { call ->
                val callMap = call as? Map<*, *> ?: return@mapNotNull null
                CallResult(
                    callId = callMap["sid"] as? String ?: "",
                    status = callMap["status"] as? String ?: "",
                    fromNumber = callMap["from"] as? String ?: "",
                    toNumber = callMap["to"] as? String ?: "",
                    startTime = (callMap["start_time"] as? String)?.let { 
                        try { Instant.parse(it) } catch (e: Exception) { Instant.now() }
                    } ?: Instant.now(),
                    durationSeconds = (callMap["duration"] as? String)?.toIntOrNull()
                )
            }
        } catch (e: Exception) {
            logger.error("Failed to list Twilio calls", e)
            emptyList()
        }
    }
}


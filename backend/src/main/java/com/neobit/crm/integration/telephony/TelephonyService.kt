package com.neobit.crm.integration.telephony

import com.fasterxml.jackson.databind.ObjectMapper
import com.neobit.crm.entity.Interaction
import com.neobit.crm.repository.CustomerRepository
import com.neobit.crm.repository.IntegrationConfigRepository
import com.neobit.crm.repository.InteractionRepository
import com.neobit.crm.repository.TenantRepository
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
    private val tenantRepository: TenantRepository,
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
        ).orElse(null) ?: return null
        
        val credentials = config.credentials
        
        return TelephonyConfig(
            provider = credentials["provider"] as? String ?: "twilio",
            apiKey = credentials["apiKey"] as? String ?: return null,
            apiSecret = credentials["apiSecret"] as? String,
            accountSid = credentials["accountSid"] as? String,
            baseUrl = credentials["baseUrl"] as? String ?: "https://api.twilio.com",
            defaultFromNumber = credentials["defaultFromNumber"] as? String
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
                startTime = (responseBody["start_time"] as? String)?.let { 
                    try { Instant.parse(it) } catch (e: Exception) { Instant.now() }
                } ?: Instant.now(),
                endTime = (responseBody["end_time"] as? String)?.let { 
                    try { Instant.parse(it) } catch (e: Exception) { null }
                },
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
        val tenant = tenantRepository.findById(tenantId).orElse(null) ?: return
        
        val customer = request.customerId?.let { 
            customerRepository.findByIdAndTenantId(it, tenantId).orElse(null)
        }
        
        val interaction = Interaction.builder()
            .tenant(tenant)
            .customer(customer)
            .account(customer?.account)
            .type(Interaction.InteractionType.CALL)
            .direction(Interaction.InteractionDirection.OUTBOUND)
            .status(Interaction.InteractionStatus.IN_PROGRESS)
            .subject("Call to ${result.toNumber}")
            .description("Outbound call initiated via CRM")
            .externalId(result.callId)
            .externalSource("telephony")
            .build()
        
        interactionRepository.save(interaction)
    }
    
    private fun updateCallInteraction(tenantId: UUID, event: CallWebhookEvent) {
        // Find by external ID
        val interactions = interactionRepository.findByTenantId(tenantId, org.springframework.data.domain.PageRequest.of(0, 100))
        val interaction = interactions.content.find { it.externalId == event.callId }
        
        if (interaction != null) {
            interaction.status = Interaction.InteractionStatus.COMPLETED
            interaction.durationSeconds = event.durationSeconds
            interaction.updatedAt = Instant.now()
            interactionRepository.save(interaction)
        }
    }
    
    private fun updateCallRecording(tenantId: UUID, callId: String, recordingUrl: String?) {
        if (recordingUrl == null) return
        
        val interactions = interactionRepository.findByTenantId(tenantId, org.springframework.data.domain.PageRequest.of(0, 100))
        val interaction = interactions.content.find { it.externalId == callId }
        
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

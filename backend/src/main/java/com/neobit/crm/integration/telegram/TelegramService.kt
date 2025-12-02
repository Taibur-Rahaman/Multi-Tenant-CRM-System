package com.neobit.crm.integration.telegram

import com.fasterxml.jackson.databind.ObjectMapper
import com.neobit.crm.repository.IntegrationConfigRepository
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate
import java.util.*

data class TelegramMessage(
    val messageId: Long,
    val chatId: Long,
    val fromId: Long?,
    val fromUsername: String?,
    val fromFirstName: String?,
    val text: String?,
    val date: Long,
    val replyToMessageId: Long?
)

data class TelegramUpdate(
    val updateId: Long,
    val message: TelegramMessage?
)

data class SendMessageRequest(
    val chatId: Long,
    val text: String,
    val parseMode: String = "HTML",
    val replyToMessageId: Long? = null
)

@Service
class TelegramService(
    private val integrationConfigRepository: IntegrationConfigRepository,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(TelegramService::class.java)
    private val restTemplate = RestTemplate()
    private val telegramApiUrl = "https://api.telegram.org/bot"
    
    @Value("\${integrations.telegram.bot-token:}")
    private lateinit var defaultBotToken: String
    
    fun getBotToken(tenantId: UUID): String? {
        // First try to get from integration config
        val config = integrationConfigRepository.findByTenantIdAndIntegrationType(
            tenantId, "telegram"
        ).orElse(null)
        
        if (config != null) {
            val credentials = config.credentials
            val botToken = credentials["botToken"] as? String
            if (!botToken.isNullOrBlank()) {
                return botToken
            }
        }
        
        // Fallback to application config
        return if (defaultBotToken.isNotBlank()) defaultBotToken else null
    }
    
    fun sendMessage(tenantId: UUID, request: SendMessageRequest): Boolean {
        val botToken = getBotToken(tenantId) ?: return false
        
        val url = "${telegramApiUrl}${botToken}/sendMessage"
        
        val body = mapOf(
            "chat_id" to request.chatId,
            "text" to request.text,
            "parse_mode" to request.parseMode,
            "reply_to_message_id" to request.replyToMessageId
        ).filterValues { it != null }
        
        return try {
            val headers = HttpHeaders().apply {
                contentType = MediaType.APPLICATION_JSON
            }
            val entity = HttpEntity(body, headers)
            val response = restTemplate.postForEntity(url, entity, Map::class.java)
            response.body?.get("ok") == true
        } catch (e: Exception) {
            logger.error("Failed to send Telegram message", e)
            false
        }
    }
    
    /**
     * Send message using bot token directly (for notifications)
     */
    fun sendMessageWithToken(botToken: String, chatId: Long, text: String, parseMode: String = "HTML"): Boolean {
        val url = "${telegramApiUrl}${botToken}/sendMessage"
        
        val body = mapOf(
            "chat_id" to chatId,
            "text" to text,
            "parse_mode" to parseMode
        )
        
        return try {
            val headers = HttpHeaders().apply {
                contentType = MediaType.APPLICATION_JSON
            }
            val entity = HttpEntity(body, headers)
            val response = restTemplate.postForEntity(url, entity, Map::class.java)
            response.body?.get("ok") == true
        } catch (e: Exception) {
            logger.error("Failed to send Telegram message", e)
            false
        }
    }
    
    fun getUpdates(tenantId: UUID, offset: Long? = null, limit: Int = 100): List<TelegramUpdate> {
        val botToken = getBotToken(tenantId) ?: return emptyList()
        
        val url = buildString {
            append("${telegramApiUrl}${botToken}/getUpdates?limit=$limit")
            if (offset != null) {
                append("&offset=$offset")
            }
        }
        
        return try {
            val response = restTemplate.getForEntity(url, Map::class.java)
            val result = response.body?.get("result") as? List<*> ?: return emptyList()
            
            result.mapNotNull { update ->
                parseUpdate(update as? Map<*, *>)
            }
        } catch (e: Exception) {
            logger.error("Failed to get Telegram updates", e)
            emptyList()
        }
    }
    
    fun setWebhook(tenantId: UUID, webhookUrl: String): Boolean {
        val botToken = getBotToken(tenantId) ?: return false
        
        val url = "${telegramApiUrl}${botToken}/setWebhook"
        
        val body = mapOf(
            "url" to webhookUrl,
            "allowed_updates" to listOf("message", "callback_query")
        )
        
        return try {
            val headers = HttpHeaders().apply {
                contentType = MediaType.APPLICATION_JSON
            }
            val entity = HttpEntity(body, headers)
            val response = restTemplate.postForEntity(url, entity, Map::class.java)
            response.body?.get("ok") == true
        } catch (e: Exception) {
            logger.error("Failed to set Telegram webhook", e)
            false
        }
    }
    
    fun deleteWebhook(tenantId: UUID): Boolean {
        val botToken = getBotToken(tenantId) ?: return false
        
        val url = "${telegramApiUrl}${botToken}/deleteWebhook"
        
        return try {
            val response = restTemplate.getForEntity(url, Map::class.java)
            response.body?.get("ok") == true
        } catch (e: Exception) {
            logger.error("Failed to delete Telegram webhook", e)
            false
        }
    }
    
    fun parseWebhookUpdate(payload: Map<String, Any>): TelegramUpdate? {
        return parseUpdate(payload)
    }
    
    private fun parseUpdate(data: Map<*, *>?): TelegramUpdate? {
        if (data == null) return null
        
        val updateId = (data["update_id"] as? Number)?.toLong() ?: return null
        val messageData = data["message"] as? Map<*, *>
        
        val message = messageData?.let { msg ->
            val chat = msg["chat"] as? Map<*, *>
            val from = msg["from"] as? Map<*, *>
            
            TelegramMessage(
                messageId = (msg["message_id"] as? Number)?.toLong() ?: 0L,
                chatId = (chat?.get("id") as? Number)?.toLong() ?: 0L,
                fromId = (from?.get("id") as? Number)?.toLong(),
                fromUsername = from?.get("username") as? String,
                fromFirstName = from?.get("first_name") as? String,
                text = msg["text"] as? String,
                date = (msg["date"] as? Number)?.toLong() ?: 0L,
                replyToMessageId = (msg["reply_to_message"] as? Map<*, *>)
                    ?.let { (it["message_id"] as? Number)?.toLong() }
            )
        }
        
        return TelegramUpdate(updateId = updateId, message = message)
    }
    
    fun getBotInfo(tenantId: UUID): Map<String, Any>? {
        val botToken = getBotToken(tenantId) ?: return null
        
        val url = "${telegramApiUrl}${botToken}/getMe"
        
        return try {
            val response = restTemplate.getForEntity(url, Map::class.java)
            @Suppress("UNCHECKED_CAST")
            response.body?.get("result") as? Map<String, Any>
        } catch (e: Exception) {
            logger.error("Failed to get bot info", e)
            null
        }
    }
}

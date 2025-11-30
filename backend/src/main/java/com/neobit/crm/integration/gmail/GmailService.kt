package com.neobit.crm.integration.gmail

import com.google.api.client.auth.oauth2.Credential
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport
import com.google.api.client.json.gson.GsonFactory
import com.google.api.services.gmail.Gmail
import com.google.api.services.gmail.model.Message
import com.neobit.crm.entity.OAuthConnection
import com.neobit.crm.repository.OAuthConnectionRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.util.*
import javax.mail.Session
import javax.mail.internet.InternetAddress
import javax.mail.internet.MimeMessage

data class EmailMessage(
    val id: String,
    val threadId: String,
    val from: String,
    val to: List<String>,
    val subject: String,
    val snippet: String,
    val body: String?,
    val date: Long,
    val labels: List<String>
)

data class SendEmailRequest(
    val to: String,
    val subject: String,
    val body: String,
    val isHtml: Boolean = false
)

@Service
class GmailService(
    private val oauthConnectionRepository: OAuthConnectionRepository,
    @Value("\${integrations.google.client-id:}") private val clientId: String,
    @Value("\${integrations.google.client-secret:}") private val clientSecret: String
) {
    private val jsonFactory = GsonFactory.getDefaultInstance()
    private val httpTransport = GoogleNetHttpTransport.newTrustedTransport()
    
    fun getGmailService(tenantId: UUID, userId: UUID): Gmail? {
        val connection = oauthConnectionRepository.findByTenantIdAndUserIdAndProvider(
            tenantId, userId, "google"
        ) ?: return null
        
        val credential = GoogleCredential.Builder()
            .setTransport(httpTransport)
            .setJsonFactory(jsonFactory)
            .setClientSecrets(clientId, clientSecret)
            .build()
            .setAccessToken(connection.accessToken)
            .setRefreshToken(connection.refreshToken)
        
        return Gmail.Builder(httpTransport, jsonFactory, credential)
            .setApplicationName("CRM Pro")
            .build()
    }
    
    fun listMessages(tenantId: UUID, userId: UUID, maxResults: Int = 20, query: String? = null): List<EmailMessage> {
        val gmail = getGmailService(tenantId, userId) ?: return emptyList()
        
        val request = gmail.users().messages().list("me")
            .setMaxResults(maxResults.toLong())
        
        if (!query.isNullOrBlank()) {
            request.q = query
        }
        
        val response = request.execute()
        val messages = response.messages ?: return emptyList()
        
        return messages.mapNotNull { msg ->
            try {
                getMessage(gmail, msg.id)
            } catch (e: Exception) {
                null
            }
        }
    }
    
    private fun getMessage(gmail: Gmail, messageId: String): EmailMessage {
        val message = gmail.users().messages().get("me", messageId)
            .setFormat("full")
            .execute()
        
        val headers = message.payload.headers.associateBy { it.name }
        
        return EmailMessage(
            id = message.id,
            threadId = message.threadId,
            from = headers["From"]?.value ?: "",
            to = headers["To"]?.value?.split(",")?.map { it.trim() } ?: emptyList(),
            subject = headers["Subject"]?.value ?: "(No Subject)",
            snippet = message.snippet ?: "",
            body = extractBody(message),
            date = message.internalDate,
            labels = message.labelIds ?: emptyList()
        )
    }
    
    private fun extractBody(message: Message): String? {
        val payload = message.payload
        
        // Check for plain text body
        if (payload.mimeType == "text/plain") {
            return payload.body?.data?.let { 
                String(Base64.getUrlDecoder().decode(it)) 
            }
        }
        
        // Check parts for multipart messages
        payload.parts?.forEach { part ->
            if (part.mimeType == "text/plain") {
                return part.body?.data?.let { 
                    String(Base64.getUrlDecoder().decode(it)) 
                }
            }
        }
        
        return null
    }
    
    fun sendEmail(tenantId: UUID, userId: UUID, request: SendEmailRequest): String? {
        val gmail = getGmailService(tenantId, userId) ?: return null
        
        val props = System.getProperties()
        val session = Session.getDefaultInstance(props, null)
        
        val email = MimeMessage(session).apply {
            setFrom(InternetAddress("me"))
            addRecipient(javax.mail.Message.RecipientType.TO, InternetAddress(request.to))
            subject = request.subject
            if (request.isHtml) {
                setContent(request.body, "text/html; charset=utf-8")
            } else {
                setText(request.body)
            }
        }
        
        val buffer = java.io.ByteArrayOutputStream()
        email.writeTo(buffer)
        val rawMessage = Base64.getUrlEncoder().encodeToString(buffer.toByteArray())
        
        val message = Message().apply {
            raw = rawMessage
        }
        
        val sentMessage = gmail.users().messages().send("me", message).execute()
        return sentMessage.id
    }
    
    fun syncEmails(tenantId: UUID, userId: UUID, query: String = "newer_than:7d"): List<EmailMessage> {
        return listMessages(tenantId, userId, 50, query)
    }
}


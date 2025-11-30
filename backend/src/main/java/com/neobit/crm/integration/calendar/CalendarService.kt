package com.neobit.crm.integration.calendar

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport
import com.google.api.client.json.gson.GsonFactory
import com.google.api.client.util.DateTime
import com.google.api.services.calendar.Calendar
import com.google.api.services.calendar.model.Event
import com.google.api.services.calendar.model.EventDateTime
import com.google.api.services.calendar.model.EventAttendee
import com.neobit.crm.repository.OAuthConnectionRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.time.Instant
import java.time.ZonedDateTime
import java.util.*

data class CalendarEvent(
    val id: String,
    val summary: String,
    val description: String?,
    val location: String?,
    val start: Instant,
    val end: Instant,
    val attendees: List<String>,
    val meetingLink: String?,
    val status: String
)

data class CreateEventRequest(
    val summary: String,
    val description: String? = null,
    val location: String? = null,
    val start: ZonedDateTime,
    val end: ZonedDateTime,
    val attendees: List<String> = emptyList(),
    val sendNotifications: Boolean = true
)

@Service
class CalendarService(
    private val oauthConnectionRepository: OAuthConnectionRepository,
    @Value("\${integrations.google.client-id:}") private val clientId: String,
    @Value("\${integrations.google.client-secret:}") private val clientSecret: String
) {
    private val jsonFactory = GsonFactory.getDefaultInstance()
    private val httpTransport = GoogleNetHttpTransport.newTrustedTransport()
    
    fun getCalendarService(tenantId: UUID, userId: UUID): Calendar? {
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
        
        return Calendar.Builder(httpTransport, jsonFactory, credential)
            .setApplicationName("CRM Pro")
            .build()
    }
    
    fun listEvents(
        tenantId: UUID, 
        userId: UUID, 
        timeMin: Instant = Instant.now(),
        timeMax: Instant = Instant.now().plusSeconds(30 * 24 * 60 * 60), // 30 days
        maxResults: Int = 50
    ): List<CalendarEvent> {
        val calendar = getCalendarService(tenantId, userId) ?: return emptyList()
        
        val events = calendar.events().list("primary")
            .setTimeMin(DateTime(timeMin.toEpochMilli()))
            .setTimeMax(DateTime(timeMax.toEpochMilli()))
            .setMaxResults(maxResults)
            .setSingleEvents(true)
            .setOrderBy("startTime")
            .execute()
        
        return events.items?.map { event -> mapEvent(event) } ?: emptyList()
    }
    
    fun getEvent(tenantId: UUID, userId: UUID, eventId: String): CalendarEvent? {
        val calendar = getCalendarService(tenantId, userId) ?: return null
        
        return try {
            val event = calendar.events().get("primary", eventId).execute()
            mapEvent(event)
        } catch (e: Exception) {
            null
        }
    }
    
    fun createEvent(tenantId: UUID, userId: UUID, request: CreateEventRequest): CalendarEvent? {
        val calendar = getCalendarService(tenantId, userId) ?: return null
        
        val event = Event().apply {
            summary = request.summary
            description = request.description
            location = request.location
            
            start = EventDateTime()
                .setDateTime(DateTime(request.start.toInstant().toEpochMilli()))
                .setTimeZone(request.start.zone.id)
            
            end = EventDateTime()
                .setDateTime(DateTime(request.end.toInstant().toEpochMilli()))
                .setTimeZone(request.end.zone.id)
            
            if (request.attendees.isNotEmpty()) {
                attendees = request.attendees.map { email ->
                    EventAttendee().setEmail(email)
                }
            }
        }
        
        val createdEvent = calendar.events().insert("primary", event)
            .setSendNotifications(request.sendNotifications)
            .execute()
        
        return mapEvent(createdEvent)
    }
    
    fun updateEvent(tenantId: UUID, userId: UUID, eventId: String, request: CreateEventRequest): CalendarEvent? {
        val calendar = getCalendarService(tenantId, userId) ?: return null
        
        val event = calendar.events().get("primary", eventId).execute()
        
        event.summary = request.summary
        event.description = request.description
        event.location = request.location
        
        event.start = EventDateTime()
            .setDateTime(DateTime(request.start.toInstant().toEpochMilli()))
        
        event.end = EventDateTime()
            .setDateTime(DateTime(request.end.toInstant().toEpochMilli()))
        
        if (request.attendees.isNotEmpty()) {
            event.attendees = request.attendees.map { email ->
                EventAttendee().setEmail(email)
            }
        }
        
        val updatedEvent = calendar.events().update("primary", eventId, event)
            .setSendNotifications(request.sendNotifications)
            .execute()
        
        return mapEvent(updatedEvent)
    }
    
    fun deleteEvent(tenantId: UUID, userId: UUID, eventId: String): Boolean {
        val calendar = getCalendarService(tenantId, userId) ?: return false
        
        return try {
            calendar.events().delete("primary", eventId).execute()
            true
        } catch (e: Exception) {
            false
        }
    }
    
    fun syncEvents(tenantId: UUID, userId: UUID): List<CalendarEvent> {
        val now = Instant.now()
        val futureWindow = now.plusSeconds(90 * 24 * 60 * 60) // 90 days
        return listEvents(tenantId, userId, now, futureWindow, 100)
    }
    
    private fun mapEvent(event: Event): CalendarEvent {
        val startTime = event.start?.dateTime?.value ?: event.start?.date?.value ?: 0L
        val endTime = event.end?.dateTime?.value ?: event.end?.date?.value ?: 0L
        
        return CalendarEvent(
            id = event.id,
            summary = event.summary ?: "(No title)",
            description = event.description,
            location = event.location,
            start = Instant.ofEpochMilli(startTime),
            end = Instant.ofEpochMilli(endTime),
            attendees = event.attendees?.map { it.email } ?: emptyList(),
            meetingLink = event.hangoutLink,
            status = event.status ?: "confirmed"
        )
    }
}


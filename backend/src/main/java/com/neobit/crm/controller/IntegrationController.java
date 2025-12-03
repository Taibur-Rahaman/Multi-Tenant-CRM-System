package com.neobit.crm.controller;

import com.neobit.crm.dto.request.*;
import com.neobit.crm.dto.response.*;
import com.neobit.crm.security.TenantContext;
import com.neobit.crm.security.UserPrincipal;
import com.neobit.crm.service.integration.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Integration Controller
 * 
 * Handles third-party integrations:
 * - Gmail (email sync)
 * - Google Calendar (event sync)
 * - Telegram Bot (messaging)
 * - ClickUp (task management)
 * - ZegoCloud (voice/video)
 */
@RestController
@RequestMapping("/api/integrations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Integrations", description = "Third-party integration endpoints")
public class IntegrationController {

    private final GmailService gmailService;
    private final CalendarService calendarService;
    private final TelegramService telegramService;
    private final ClickUpService clickUpService;
    private final ZegoService zegoService;
    private final IntegrationConfigService configService;

    // ============================================================
    // GENERAL INTEGRATION MANAGEMENT
    // ============================================================

    /**
     * List all configured integrations
     * 
     * GET /api/integrations
     * 
     * Response:
     * {
     *   "integrations": [
     *     { "type": "GMAIL", "status": "CONNECTED", "connectedEmail": "..." },
     *     { "type": "TELEGRAM", "status": "CONNECTED", "botUsername": "@bot" }
     *   ]
     * }
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('VENDOR_ADMIN', 'PLATFORM_ADMIN')")
    @Operation(summary = "List configured integrations")
    public ResponseEntity<IntegrationsListResponse> listIntegrations() {
        
        UUID tenantId = TenantContext.getTenantId();
        
        IntegrationsListResponse response = configService.listIntegrations(tenantId);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get integration status
     * 
     * GET /api/integrations/{type}
     */
    @GetMapping("/{type}")
    @PreAuthorize("hasAnyRole('VENDOR_ADMIN', 'PLATFORM_ADMIN')")
    @Operation(summary = "Get integration status")
    public ResponseEntity<IntegrationStatusResponse> getIntegrationStatus(
            @PathVariable String type) {
        
        UUID tenantId = TenantContext.getTenantId();
        
        IntegrationStatusResponse status = configService.getIntegrationStatus(
            tenantId, type.toUpperCase()
        );
        
        return ResponseEntity.ok(status);
    }

    /**
     * Connect integration (initiate OAuth)
     * 
     * POST /api/integrations/{type}/connect
     */
    @PostMapping("/{type}/connect")
    @PreAuthorize("hasAnyRole('VENDOR_ADMIN', 'PLATFORM_ADMIN')")
    @Operation(summary = "Initiate integration connection")
    public ResponseEntity<OAuthUrlResponse> connectIntegration(
            @PathVariable String type,
            @RequestBody(required = false) ConnectIntegrationRequest request) {
        
        log.info("Initiating connection for integration: {}", type);
        
        UUID tenantId = TenantContext.getTenantId();
        String redirectUri = request != null ? request.getRedirectUri() : null;
        
        String authUrl = configService.getOAuthUrl(tenantId, type.toUpperCase(), redirectUri);
        
        return ResponseEntity.ok(new OAuthUrlResponse(authUrl));
    }

    /**
     * OAuth callback for integration
     * 
     * POST /api/integrations/{type}/callback
     */
    @PostMapping("/{type}/callback")
    @PreAuthorize("hasAnyRole('VENDOR_ADMIN', 'PLATFORM_ADMIN')")
    @Operation(summary = "Handle OAuth callback")
    public ResponseEntity<IntegrationStatusResponse> handleCallback(
            @PathVariable String type,
            @Valid @RequestBody OAuthCallbackRequest request) {
        
        log.info("Processing OAuth callback for: {}", type);
        
        UUID tenantId = TenantContext.getTenantId();
        
        IntegrationStatusResponse status = configService.handleOAuthCallback(
            tenantId, type.toUpperCase(), request.getCode(), request.getState()
        );
        
        return ResponseEntity.ok(status);
    }

    /**
     * Disconnect integration
     * 
     * DELETE /api/integrations/{type}/disconnect
     */
    @DeleteMapping("/{type}/disconnect")
    @PreAuthorize("hasAnyRole('VENDOR_ADMIN', 'PLATFORM_ADMIN')")
    @Operation(summary = "Disconnect integration")
    public ResponseEntity<IntegrationStatusResponse> disconnectIntegration(
            @PathVariable String type) {
        
        log.warn("Disconnecting integration: {}", type);
        
        UUID tenantId = TenantContext.getTenantId();
        
        IntegrationStatusResponse status = configService.disconnect(
            tenantId, type.toUpperCase()
        );
        
        return ResponseEntity.ok(status);
    }

    /**
     * Update integration settings
     * 
     * PUT /api/integrations/{type}/settings
     */
    @PutMapping("/{type}/settings")
    @PreAuthorize("hasAnyRole('VENDOR_ADMIN', 'PLATFORM_ADMIN')")
    @Operation(summary = "Update integration settings")
    public ResponseEntity<IntegrationStatusResponse> updateSettings(
            @PathVariable String type,
            @Valid @RequestBody UpdateIntegrationSettingsRequest request) {
        
        UUID tenantId = TenantContext.getTenantId();
        
        IntegrationStatusResponse status = configService.updateSettings(
            tenantId, type.toUpperCase(), request.getSettings()
        );
        
        return ResponseEntity.ok(status);
    }

    // ============================================================
    // GMAIL INTEGRATION
    // ============================================================

    /**
     * Trigger Gmail sync
     * 
     * POST /api/integrations/gmail/sync
     */
    @PostMapping("/gmail/sync")
    @PreAuthorize("hasAnyRole('VENDOR_ADMIN', 'PLATFORM_ADMIN')")
    @Operation(summary = "Trigger Gmail sync")
    public ResponseEntity<SyncStatusResponse> syncGmail() {
        
        log.info("Starting Gmail sync");
        
        UUID tenantId = TenantContext.getTenantId();
        
        SyncStatusResponse response = gmailService.triggerSync(tenantId);
        
        return ResponseEntity.accepted().body(response);
    }

    /**
     * Get synced emails
     * 
     * GET /api/integrations/gmail/emails
     */
    @GetMapping("/gmail/emails")
    @Operation(summary = "Get synced emails")
    public ResponseEntity<Page<EmailResponse>> getEmails(
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) String label,
            Pageable pageable) {
        
        UUID tenantId = TenantContext.getTenantId();
        
        Page<EmailResponse> emails = gmailService.getEmails(tenantId, customerId, label, pageable);
        
        return ResponseEntity.ok(emails);
    }

    /**
     * Send email via Gmail
     * 
     * POST /api/integrations/gmail/send
     */
    @PostMapping("/gmail/send")
    @Operation(summary = "Send email via Gmail")
    public ResponseEntity<EmailResponse> sendEmail(
            @Valid @RequestBody SendEmailRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Sending email to: {} by user: {}", request.getTo(), principal.getEmail());
        
        UUID tenantId = TenantContext.getTenantId();
        
        EmailResponse response = gmailService.sendEmail(tenantId, principal.getId(), request);
        
        return ResponseEntity.ok(response);
    }

    // ============================================================
    // GOOGLE CALENDAR INTEGRATION
    // ============================================================

    /**
     * Get calendar events
     * 
     * GET /api/integrations/calendar/events
     */
    @GetMapping("/calendar/events")
    @Operation(summary = "Get calendar events")
    public ResponseEntity<List<CalendarEventResponse>> getCalendarEvents(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) UUID customerId) {
        
        UUID tenantId = TenantContext.getTenantId();
        
        List<CalendarEventResponse> events = calendarService.getEvents(
            tenantId, startDate, endDate, customerId
        );
        
        return ResponseEntity.ok(events);
    }

    /**
     * Create calendar event
     * 
     * POST /api/integrations/calendar/events
     */
    @PostMapping("/calendar/events")
    @Operation(summary = "Create calendar event")
    public ResponseEntity<CalendarEventResponse> createCalendarEvent(
            @Valid @RequestBody CreateCalendarEventRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Creating calendar event: {} by user: {}", 
            request.getTitle(), principal.getEmail());
        
        UUID tenantId = TenantContext.getTenantId();
        
        CalendarEventResponse event = calendarService.createEvent(
            tenantId, principal.getId(), request
        );
        
        return ResponseEntity.ok(event);
    }

    /**
     * Update calendar event
     * 
     * PUT /api/integrations/calendar/events/{eventId}
     */
    @PutMapping("/calendar/events/{eventId}")
    @Operation(summary = "Update calendar event")
    public ResponseEntity<CalendarEventResponse> updateCalendarEvent(
            @PathVariable String eventId,
            @Valid @RequestBody UpdateCalendarEventRequest request) {
        
        UUID tenantId = TenantContext.getTenantId();
        
        CalendarEventResponse event = calendarService.updateEvent(tenantId, eventId, request);
        
        return ResponseEntity.ok(event);
    }

    /**
     * Delete calendar event
     * 
     * DELETE /api/integrations/calendar/events/{eventId}
     */
    @DeleteMapping("/calendar/events/{eventId}")
    @Operation(summary = "Delete calendar event")
    public ResponseEntity<Void> deleteCalendarEvent(@PathVariable String eventId) {
        
        UUID tenantId = TenantContext.getTenantId();
        
        calendarService.deleteEvent(tenantId, eventId);
        
        return ResponseEntity.noContent().build();
    }

    // ============================================================
    // TELEGRAM INTEGRATION
    // ============================================================

    /**
     * Configure Telegram bot
     * 
     * POST /api/integrations/telegram/configure
     */
    @PostMapping("/telegram/configure")
    @PreAuthorize("hasAnyRole('VENDOR_ADMIN', 'PLATFORM_ADMIN')")
    @Operation(summary = "Configure Telegram bot")
    public ResponseEntity<TelegramConfigResponse> configureTelegram(
            @Valid @RequestBody ConfigureTelegramRequest request) {
        
        log.info("Configuring Telegram bot");
        
        UUID tenantId = TenantContext.getTenantId();
        
        TelegramConfigResponse response = telegramService.configure(tenantId, request);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Link Telegram chat to customer
     * 
     * POST /api/integrations/telegram/link
     */
    @PostMapping("/telegram/link")
    @Operation(summary = "Link Telegram chat to customer")
    public ResponseEntity<TelegramLinkResponse> linkTelegramChat(
            @Valid @RequestBody LinkTelegramChatRequest request) {
        
        UUID tenantId = TenantContext.getTenantId();
        
        TelegramLinkResponse response = telegramService.linkChatToCustomer(
            tenantId, request.getChatId(), request.getCustomerId()
        );
        
        return ResponseEntity.ok(response);
    }

    /**
     * Send Telegram message
     * 
     * POST /api/integrations/telegram/send
     */
    @PostMapping("/telegram/send")
    @Operation(summary = "Send Telegram message")
    public ResponseEntity<TelegramMessageResponse> sendTelegramMessage(
            @Valid @RequestBody SendTelegramMessageRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        UUID tenantId = TenantContext.getTenantId();
        
        TelegramMessageResponse response = telegramService.sendMessage(
            tenantId, principal.getId(), request
        );
        
        return ResponseEntity.ok(response);
    }

    // ============================================================
    // CLICKUP INTEGRATION
    // ============================================================

    /**
     * Get ClickUp workspaces
     * 
     * GET /api/integrations/clickup/workspaces
     */
    @GetMapping("/clickup/workspaces")
    @Operation(summary = "Get ClickUp workspaces")
    public ResponseEntity<List<ClickUpWorkspaceResponse>> getClickUpWorkspaces() {
        
        UUID tenantId = TenantContext.getTenantId();
        
        List<ClickUpWorkspaceResponse> workspaces = clickUpService.getWorkspaces(tenantId);
        
        return ResponseEntity.ok(workspaces);
    }

    /**
     * Create ClickUp task
     * 
     * POST /api/integrations/clickup/tasks
     */
    @PostMapping("/clickup/tasks")
    @Operation(summary = "Create ClickUp task")
    public ResponseEntity<ClickUpTaskResponse> createClickUpTask(
            @Valid @RequestBody CreateClickUpTaskRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Creating ClickUp task: {} by user: {}", 
            request.getName(), principal.getEmail());
        
        UUID tenantId = TenantContext.getTenantId();
        
        ClickUpTaskResponse task = clickUpService.createTask(tenantId, request);
        
        return ResponseEntity.ok(task);
    }

    /**
     * Update ClickUp task
     * 
     * PUT /api/integrations/clickup/tasks/{taskId}
     */
    @PutMapping("/clickup/tasks/{taskId}")
    @Operation(summary = "Update ClickUp task")
    public ResponseEntity<ClickUpTaskResponse> updateClickUpTask(
            @PathVariable String taskId,
            @Valid @RequestBody UpdateClickUpTaskRequest request) {
        
        UUID tenantId = TenantContext.getTenantId();
        
        ClickUpTaskResponse task = clickUpService.updateTask(tenantId, taskId, request);
        
        return ResponseEntity.ok(task);
    }

    /**
     * Get tasks linked to customer
     * 
     * GET /api/integrations/clickup/tasks?customerId=...
     */
    @GetMapping("/clickup/tasks")
    @Operation(summary = "Get ClickUp tasks")
    public ResponseEntity<List<ClickUpTaskResponse>> getClickUpTasks(
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) String status) {
        
        UUID tenantId = TenantContext.getTenantId();
        
        List<ClickUpTaskResponse> tasks = clickUpService.getTasks(tenantId, customerId, status);
        
        return ResponseEntity.ok(tasks);
    }

    // ============================================================
    // ZEGOCLOUD INTEGRATION
    // ============================================================

    /**
     * Generate ZegoCloud token
     * 
     * POST /api/integrations/zego/token
     */
    @PostMapping("/zego/token")
    @Operation(summary = "Generate ZegoCloud token")
    public ResponseEntity<ZegoTokenResponse> generateZegoToken(
            @Valid @RequestBody GenerateZegoTokenRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        ZegoTokenResponse response = zegoService.generateToken(
            request.getUserId() != null ? request.getUserId() : principal.getId().toString(),
            request.getUserName() != null ? request.getUserName() : principal.getName(),
            request.getRoomId()
        );
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get ZegoCloud configuration
     * 
     * GET /api/integrations/zego/config
     */
    @GetMapping("/zego/config")
    @Operation(summary = "Get ZegoCloud configuration")
    public ResponseEntity<ZegoConfigResponse> getZegoConfig() {
        
        ZegoConfigResponse config = zegoService.getPublicConfig();
        
        return ResponseEntity.ok(config);
    }

    /**
     * Get call history
     * 
     * GET /api/integrations/zego/calls
     */
    @GetMapping("/zego/calls")
    @Operation(summary = "Get call history")
    public ResponseEntity<Page<CallSessionResponse>> getCallHistory(
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            Pageable pageable) {
        
        UUID tenantId = TenantContext.getTenantId();
        
        Page<CallSessionResponse> calls = zegoService.getCallHistory(
            tenantId, customerId, startDate, endDate, pageable
        );
        
        return ResponseEntity.ok(calls);
    }
}

// ============================================================
// Request/Response DTOs (would be in separate files)
// ============================================================

/*
// IntegrationsListResponse.java
@Data
@Builder
public class IntegrationsListResponse {
    private List<IntegrationStatusResponse> integrations;
}

// IntegrationStatusResponse.java
@Data
@Builder
public class IntegrationStatusResponse {
    private String type;
    private String status; // CONNECTED, DISCONNECTED, ERROR
    private String connectedAccount;
    private Map<String, Object> settings;
    private LocalDateTime lastSyncAt;
    private String error;
}

// CreateClickUpTaskRequest.java
@Data
public class CreateClickUpTaskRequest {
    @NotBlank
    private String name;
    
    private String description;
    private UUID customerId;
    private UUID interactionId;
    private String listId;
    private LocalDate dueDate;
    private Integer priority; // 1=urgent, 2=high, 3=normal, 4=low
}

// ClickUpTaskResponse.java
@Data
@Builder
public class ClickUpTaskResponse {
    private String taskId;
    private String name;
    private String description;
    private String url;
    private String status;
    private Integer priority;
    private UUID linkedCustomerId;
    private UUID linkedInteractionId;
    private LocalDate dueDate;
    private LocalDateTime createdAt;
}

// ZegoTokenResponse.java
@Data
@Builder
public class ZegoTokenResponse {
    private String token;
    private long appID;
    private String serverWSS;
    private String serverWSSBackup;
    private LocalDateTime expiresAt;
}

// ConfigureTelegramRequest.java
@Data
public class ConfigureTelegramRequest {
    @NotBlank
    private String botToken;
    
    private String welcomeMessage;
    private boolean autoReplyEnabled = true;
}

// TelegramConfigResponse.java
@Data
@Builder
public class TelegramConfigResponse {
    private String botUsername;
    private String webhookUrl;
    private String welcomeMessage;
    private boolean autoReplyEnabled;
}
*/


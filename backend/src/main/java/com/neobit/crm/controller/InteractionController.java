package com.neobit.crm.controller;

import com.neobit.crm.dto.request.*;
import com.neobit.crm.dto.response.*;
import com.neobit.crm.security.TenantContext;
import com.neobit.crm.security.UserPrincipal;
import com.neobit.crm.service.InteractionService;
import com.neobit.crm.service.integration.ZegoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Interaction Controller
 * 
 * Handles interaction logging:
 * - List and filter interactions
 * - Create interactions (email, call, chat, note)
 * - Initiate voice/video calls
 * - Get interaction statistics
 */
@RestController
@RequestMapping("/api/interactions")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Interactions", description = "Customer interaction endpoints")
public class InteractionController {

    private final InteractionService interactionService;
    private final ZegoService zegoService;

    /**
     * List interactions with filtering
     * 
     * GET /api/interactions?customerId=...&type=EMAIL&startDate=2024-01-01
     * 
     * Response:
     * {
     *   "content": [{
     *     "id": "...",
     *     "type": "EMAIL",
     *     "channel": "GMAIL",
     *     "subject": "Product Inquiry",
     *     "content": "Hi, I'm interested...",
     *     "customer": { "id": "...", "name": "John Doe" },
     *     "createdAt": "2024-01-15T10:30:00Z"
     *   }],
     *   "page": 0,
     *   "totalElements": 500
     * }
     */
    @GetMapping
    @Operation(summary = "List interactions with filtering")
    public ResponseEntity<Page<InteractionResponse>> listInteractions(
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String channel,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            Pageable pageable) {
        
        log.debug("Listing interactions - customerId: {}, type: {}, channel: {}", 
            customerId, type, channel);
        
        UUID tenantId = TenantContext.getTenantId();
        
        InteractionFilterRequest filter = InteractionFilterRequest.builder()
            .customerId(customerId)
            .type(type)
            .channel(channel)
            .direction(direction)
            .startDate(startDate)
            .endDate(endDate)
            .build();
        
        Page<InteractionResponse> interactions = interactionService.listInteractions(
            tenantId, filter, pageable
        );
        
        return ResponseEntity.ok(interactions);
    }

    /**
     * Get interaction by ID
     * 
     * GET /api/interactions/{id}
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get interaction details")
    public ResponseEntity<InteractionDetailResponse> getInteraction(@PathVariable UUID id) {
        
        log.debug("Getting interaction: {}", id);
        
        UUID tenantId = TenantContext.getTenantId();
        
        InteractionDetailResponse interaction = interactionService.getInteractionById(
            tenantId, id
        );
        
        return ResponseEntity.ok(interaction);
    }

    /**
     * Create new interaction
     * 
     * POST /api/interactions
     * 
     * Request:
     * {
     *   "type": "NOTE",
     *   "customerId": "880e8400-...",
     *   "subject": "Meeting Notes",
     *   "content": "Discussed Q2 requirements...",
     *   "metadata": { "meetingDate": "2024-01-15" }
     * }
     */
    @PostMapping
    @Operation(summary = "Create new interaction")
    public ResponseEntity<InteractionResponse> createInteraction(
            @Valid @RequestBody CreateInteractionRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Creating interaction type: {} for customer: {} by user: {}", 
            request.getType(), request.getCustomerId(), principal.getEmail());
        
        UUID tenantId = TenantContext.getTenantId();
        
        InteractionResponse interaction = interactionService.createInteraction(
            tenantId, principal.getId(), request
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(interaction);
    }

    /**
     * Update interaction
     * 
     * PUT /api/interactions/{id}
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update interaction")
    public ResponseEntity<InteractionResponse> updateInteraction(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateInteractionRequest request) {
        
        log.info("Updating interaction: {}", id);
        
        UUID tenantId = TenantContext.getTenantId();
        
        InteractionResponse interaction = interactionService.updateInteraction(
            tenantId, id, request
        );
        
        return ResponseEntity.ok(interaction);
    }

    /**
     * Delete interaction
     * 
     * DELETE /api/interactions/{id}
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete interaction")
    public ResponseEntity<Void> deleteInteraction(@PathVariable UUID id) {
        
        log.warn("Deleting interaction: {}", id);
        
        UUID tenantId = TenantContext.getTenantId();
        
        interactionService.deleteInteraction(tenantId, id);
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Initiate voice/video call via ZegoCloud
     * 
     * POST /api/interactions/call
     * 
     * Request:
     * {
     *   "customerId": "880e8400-...",
     *   "type": "VOICE",
     *   "subject": "Sales Call"
     * }
     * 
     * Response:
     * {
     *   "interactionId": "...",
     *   "roomId": "room_neobit_...",
     *   "token": "04AAAAA...",
     *   "zegoConfig": { "appID": 1934093598, "serverWSS": "wss://..." }
     * }
     */
    @PostMapping("/call")
    @Operation(summary = "Initiate voice/video call")
    public ResponseEntity<CallInitResponse> initiateCall(
            @Valid @RequestBody InitiateCallRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Initiating {} call to customer: {} by user: {}", 
            request.getType(), request.getCustomerId(), principal.getEmail());
        
        UUID tenantId = TenantContext.getTenantId();
        
        CallInitResponse response = zegoService.initiateCall(
            tenantId,
            principal.getId(),
            principal.getName(),
            request.getCustomerId(),
            request.getType(),
            request.getSubject()
        );
        
        return ResponseEntity.ok(response);
    }

    /**
     * End call session
     * 
     * POST /api/interactions/call/{roomId}/end
     */
    @PostMapping("/call/{roomId}/end")
    @Operation(summary = "End call session")
    public ResponseEntity<InteractionResponse> endCall(
            @PathVariable String roomId,
            @RequestBody(required = false) EndCallRequest request) {
        
        log.info("Ending call: {}", roomId);
        
        UUID tenantId = TenantContext.getTenantId();
        
        InteractionResponse interaction = zegoService.endCall(
            tenantId, 
            roomId, 
            request != null ? request.getNotes() : null
        );
        
        return ResponseEntity.ok(interaction);
    }

    /**
     * Get call token (for joining existing room)
     * 
     * POST /api/interactions/call/{roomId}/token
     */
    @PostMapping("/call/{roomId}/token")
    @Operation(summary = "Get call token for room")
    public ResponseEntity<CallTokenResponse> getCallToken(
            @PathVariable String roomId,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        CallTokenResponse response = zegoService.generateToken(
            principal.getId().toString(),
            principal.getName(),
            roomId
        );
        
        return ResponseEntity.ok(response);
    }

    /**
     * Add attachment to interaction
     * 
     * POST /api/interactions/{id}/attachments
     */
    @PostMapping("/{id}/attachments")
    @Operation(summary = "Add attachment to interaction")
    public ResponseEntity<InteractionResponse> addAttachment(
            @PathVariable UUID id,
            @Valid @RequestBody AddAttachmentRequest request) {
        
        UUID tenantId = TenantContext.getTenantId();
        
        InteractionResponse interaction = interactionService.addAttachment(
            tenantId, id, request
        );
        
        return ResponseEntity.ok(interaction);
    }

    /**
     * Get interaction statistics
     * 
     * GET /api/interactions/stats?startDate=2024-01-01&endDate=2024-01-31
     */
    @GetMapping("/stats")
    @Operation(summary = "Get interaction statistics")
    public ResponseEntity<InteractionStatsResponse> getStats(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) UUID customerId) {
        
        UUID tenantId = TenantContext.getTenantId();
        
        InteractionStatsResponse stats = interactionService.getStats(
            tenantId, startDate, endDate, customerId
        );
        
        return ResponseEntity.ok(stats);
    }

    /**
     * Get interaction timeline for customer
     * 
     * GET /api/interactions/timeline/{customerId}
     */
    @GetMapping("/timeline/{customerId}")
    @Operation(summary = "Get customer interaction timeline")
    public ResponseEntity<List<InteractionTimelineItem>> getTimeline(
            @PathVariable UUID customerId,
            @RequestParam(required = false, defaultValue = "30") int days) {
        
        UUID tenantId = TenantContext.getTenantId();
        
        List<InteractionTimelineItem> timeline = interactionService.getTimeline(
            tenantId, customerId, days
        );
        
        return ResponseEntity.ok(timeline);
    }
}

// ============================================================
// Request/Response DTOs (would be in separate files)
// ============================================================

/*
// CreateInteractionRequest.java
@Data
public class CreateInteractionRequest {
    @NotNull
    private InteractionType type; // EMAIL, CALL, CHAT, NOTE, MEETING, TASK
    
    @NotNull
    private UUID customerId;
    
    private String subject;
    
    private String content;
    
    private InteractionChannel channel;
    
    private InteractionDirection direction;
    
    private Map<String, Object> metadata;
}

// InteractionResponse.java
@Data
@Builder
public class InteractionResponse {
    private UUID id;
    private InteractionType type;
    private InteractionChannel channel;
    private InteractionDirection direction;
    private String subject;
    private String content;
    private CustomerSummary customer;
    private UserSummary user;
    private Map<String, Object> metadata;
    private List<AttachmentDto> attachments;
    private LocalDateTime createdAt;
}

// InteractionDetailResponse.java
@Data
@Builder
public class InteractionDetailResponse {
    private UUID id;
    private InteractionType type;
    private InteractionChannel channel;
    private InteractionDirection direction;
    private String subject;
    private String content;
    private CustomerSummary customer;
    private UserSummary user;
    private Map<String, Object> metadata;
    private List<AttachmentDto> attachments;
    
    // Call-specific
    private Integer durationSeconds;
    private String recordingUrl;
    
    // AI-generated (Phase 2)
    private String transcription;
    private String summary;
    private String sentiment;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

// InitiateCallRequest.java
@Data
public class InitiateCallRequest {
    @NotNull
    private UUID customerId;
    
    @NotNull
    private String type; // VOICE, VIDEO
    
    private String subject;
}

// CallInitResponse.java
@Data
@Builder
public class CallInitResponse {
    private UUID interactionId;
    private String roomId;
    private String token;
    private ZegoConfig zegoConfig;
    private String customerInviteLink;
}

// ZegoConfig.java
@Data
@Builder
public class ZegoConfig {
    private long appID;
    private String serverWSS;
    private String serverWSSBackup;
    private String userID;
    private String userName;
}

// InteractionStatsResponse.java
@Data
@Builder
public class InteractionStatsResponse {
    private int total;
    private Map<String, Integer> byType;
    private Map<String, Integer> byChannel;
    private Map<String, Integer> byDay;
    private double avgResponseTimeMinutes;
}
*/


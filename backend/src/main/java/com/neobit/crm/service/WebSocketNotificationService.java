package com.neobit.crm.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketNotificationService {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;
    
    /**
     * Send update to all clients of a tenant
     */
    public void notifyTenant(UUID tenantId, String eventType, Object data) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("eventType", eventType);
            message.put("tenantId", tenantId.toString());
            message.put("data", data);
            message.put("timestamp", System.currentTimeMillis());
            
            String payload = objectMapper.writeValueAsString(message);
            messagingTemplate.convertAndSend("/topic/tenant/" + tenantId, payload);
            log.debug("Sent WebSocket notification for tenant {}: {}", tenantId, eventType);
        } catch (JsonProcessingException e) {
            log.error("Failed to send WebSocket notification", e);
        }
    }
    
    /**
     * Send update to specific user
     */
    public void notifyUser(String username, String eventType, Object data) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("eventType", eventType);
            message.put("data", data);
            message.put("timestamp", System.currentTimeMillis());
            
            String payload = objectMapper.writeValueAsString(message);
            messagingTemplate.convertAndSendToUser(username, "/queue/notifications", payload);
            log.debug("Sent WebSocket notification to user {}: {}", username, eventType);
        } catch (JsonProcessingException e) {
            log.error("Failed to send WebSocket notification to user", e);
        }
    }
    
    /**
     * Send customer update
     */
    public void notifyCustomerUpdate(UUID tenantId, String operation, Object customer) {
        notifyTenant(tenantId, "customer." + operation, customer);
    }
    
    /**
     * Send task update
     */
    public void notifyTaskUpdate(UUID tenantId, String operation, Object task) {
        notifyTenant(tenantId, "task." + operation, task);
    }
    
    /**
     * Send interaction update
     */
    public void notifyInteractionUpdate(UUID tenantId, String operation, Object interaction) {
        notifyTenant(tenantId, "interaction." + operation, interaction);
    }
    
    /**
     * Send account update
     */
    public void notifyAccountUpdate(UUID tenantId, String operation, Object account) {
        notifyTenant(tenantId, "account." + operation, account);
    }
}



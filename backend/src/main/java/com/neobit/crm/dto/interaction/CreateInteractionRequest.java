package com.neobit.crm.dto.interaction;

import com.neobit.crm.entity.Interaction;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
public class CreateInteractionRequest {
    
    private UUID customerId;
    private UUID accountId;
    
    @NotNull(message = "Interaction type is required")
    private Interaction.InteractionType type;
    
    private Interaction.InteractionDirection direction;
    private Interaction.InteractionStatus status;
    private String subject;
    private String description;
    private Instant startedAt;
    private Instant endedAt;
    private Integer durationSeconds;
    private Instant scheduledAt;
    private String location;
    private String externalId;
    private String externalSource;
    private Map<String, Object> metadata;
    private List<String> tags;
}


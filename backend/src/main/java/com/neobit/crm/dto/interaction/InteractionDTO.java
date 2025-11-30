package com.neobit.crm.dto.interaction;

import com.neobit.crm.entity.Interaction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InteractionDTO {
    
    private UUID id;
    private UUID customerId;
    private String customerName;
    private UUID accountId;
    private String accountName;
    private UUID userId;
    private String userName;
    private Interaction.InteractionType type;
    private Interaction.InteractionDirection direction;
    private Interaction.InteractionStatus status;
    private String subject;
    private String description;
    private String summary;
    private String sentiment;
    private BigDecimal sentimentScore;
    private Instant startedAt;
    private Instant endedAt;
    private Integer durationSeconds;
    private Instant scheduledAt;
    private String location;
    private String externalId;
    private String externalSource;
    private Map<String, Object> metadata;
    private List<String> tags;
    private List<AttachmentDTO> attachments;
    private Instant createdAt;
    private Instant updatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttachmentDTO {
        private UUID id;
        private String fileName;
        private String fileType;
        private Long fileSize;
        private String fileUrl;
    }
}


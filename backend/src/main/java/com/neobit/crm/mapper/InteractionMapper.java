package com.neobit.crm.mapper;

import com.neobit.crm.dto.interaction.InteractionDTO;
import com.neobit.crm.entity.Interaction;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class InteractionMapper {
    
    public InteractionDTO toDTO(Interaction interaction) {
        if (interaction == null) return null;
        
        return InteractionDTO.builder()
                .id(interaction.getId())
                .customerId(interaction.getCustomer() != null ? interaction.getCustomer().getId() : null)
                .customerName(interaction.getCustomer() != null ? interaction.getCustomer().getFullName() : null)
                .accountId(interaction.getAccount() != null ? interaction.getAccount().getId() : null)
                .accountName(interaction.getAccount() != null ? interaction.getAccount().getName() : null)
                .userId(interaction.getUser() != null ? interaction.getUser().getId() : null)
                .userName(interaction.getUser() != null ? interaction.getUser().getFullName() : null)
                .type(interaction.getType())
                .direction(interaction.getDirection())
                .status(interaction.getStatus())
                .subject(interaction.getSubject())
                .description(interaction.getDescription())
                .summary(interaction.getSummary())
                .sentiment(interaction.getSentiment())
                .sentimentScore(interaction.getSentimentScore())
                .startedAt(interaction.getStartedAt())
                .endedAt(interaction.getEndedAt())
                .durationSeconds(interaction.getDurationSeconds())
                .scheduledAt(interaction.getScheduledAt())
                .location(interaction.getLocation())
                .externalId(interaction.getExternalId())
                .externalSource(interaction.getExternalSource())
                .metadata(interaction.getMetadata())
                .tags(interaction.getTags())
                .attachments(interaction.getAttachments() != null ? 
                    interaction.getAttachments().stream()
                        .map(a -> InteractionDTO.AttachmentDTO.builder()
                                .id(a.getId())
                                .fileName(a.getFileName())
                                .fileType(a.getFileType())
                                .fileSize(a.getFileSize())
                                .fileUrl(a.getFileUrl())
                                .build())
                        .collect(Collectors.toList()) : null)
                .createdAt(interaction.getCreatedAt())
                .updatedAt(interaction.getUpdatedAt())
                .build();
    }
}


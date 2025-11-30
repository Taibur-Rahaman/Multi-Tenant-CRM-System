package com.neobit.crm.dto.task;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDTO {
    
    private UUID id;
    private String title;
    private String description;
    private String status;
    private String priority;
    private Instant dueDate;
    private Instant completedAt;
    private UUID customerId;
    private String customerName;
    private UUID accountId;
    private String accountName;
    private UUID interactionId;
    private UUID assignedToId;
    private String assignedToName;
    private UUID createdById;
    private String createdByName;
    private List<String> tags;
    private Instant createdAt;
    private Instant updatedAt;
}


package com.neobit.crm.dto.task;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
public class CreateTaskRequest {
    
    @NotBlank(message = "Task title is required")
    private String title;
    
    private String description;
    private String priority;
    private Instant dueDate;
    private UUID customerId;
    private UUID accountId;
    private UUID interactionId;
    private UUID assignedToId;
    private List<String> tags;
}


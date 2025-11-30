package com.neobit.crm.mapper;

import com.neobit.crm.dto.task.TaskDTO;
import com.neobit.crm.entity.Task;
import org.springframework.stereotype.Component;

@Component
public class TaskMapper {
    
    public TaskDTO toDTO(Task task) {
        if (task == null) return null;
        
        return TaskDTO.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .dueDate(task.getDueDate())
                .completedAt(task.getCompletedAt())
                .customerId(task.getCustomer() != null ? task.getCustomer().getId() : null)
                .customerName(task.getCustomer() != null ? task.getCustomer().getFullName() : null)
                .accountId(task.getAccount() != null ? task.getAccount().getId() : null)
                .accountName(task.getAccount() != null ? task.getAccount().getName() : null)
                .interactionId(task.getInteraction() != null ? task.getInteraction().getId() : null)
                .assignedToId(task.getAssignedTo() != null ? task.getAssignedTo().getId() : null)
                .assignedToName(task.getAssignedTo() != null ? task.getAssignedTo().getFullName() : null)
                .createdById(task.getCreatedBy() != null ? task.getCreatedBy().getId() : null)
                .createdByName(task.getCreatedBy() != null ? task.getCreatedBy().getFullName() : null)
                .tags(task.getTags())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}


package com.neobit.crm.dto.issue;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssueDTO {
    private String id;
    private String externalId;
    private String externalKey;
    private String title;
    private String description;
    private String status;
    private String priority;
    private String assignee;
    private String provider;
    private String url;
    private String customerId;
    private String customerName;
    private List<String> labels;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}


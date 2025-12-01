package com.neobit.crm.dto.issue;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateIssueRequest {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    private String description;
    
    private String priority;
    
    private String assignee;
    
    private String customerId;
    
    private String customerName;
    
    private List<String> labels;
}


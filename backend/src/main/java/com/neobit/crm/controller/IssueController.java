package com.neobit.crm.controller;

import com.neobit.crm.dto.common.ApiResponse;
import com.neobit.crm.dto.common.PageResponse;
import com.neobit.crm.dto.issue.CreateIssueRequest;
import com.neobit.crm.dto.issue.IssueDTO;
import com.neobit.crm.service.IssueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/issues")
@RequiredArgsConstructor
@Tag(name = "Issues", description = "Issue tracking integration (Jira/Linear)")
public class IssueController {

    private final IssueService issueService;

    @GetMapping
    @Operation(summary = "Get all issues")
    public ResponseEntity<ApiResponse<PageResponse<IssueDTO>>> getAllIssues(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("asc") 
            ? Sort.by(sortBy).ascending() 
            : Sort.by(sortBy).descending();
        
        Page<IssueDTO> issues = issueService.getAllIssues(PageRequest.of(page, size, sort));
        PageResponse<IssueDTO> pageResponse = PageResponse.of(issues);
        
        return ResponseEntity.ok(ApiResponse.success("Issues retrieved successfully", pageResponse));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get issue by ID")
    public ResponseEntity<ApiResponse<IssueDTO>> getIssueById(@PathVariable String id) {
        IssueDTO issue = issueService.getIssueById(id);
        return ResponseEntity.ok(ApiResponse.success("Issue retrieved successfully", issue));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Get issues by status")
    public ResponseEntity<ApiResponse<PageResponse<IssueDTO>>> getIssuesByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Page<IssueDTO> issues = issueService.getIssuesByStatus(status, PageRequest.of(page, size));
        PageResponse<IssueDTO> pageResponse = PageResponse.of(issues);
        
        return ResponseEntity.ok(ApiResponse.success("Issues retrieved successfully", pageResponse));
    }

    @GetMapping("/customer/{customerId}")
    @Operation(summary = "Get issues by customer")
    public ResponseEntity<ApiResponse<PageResponse<IssueDTO>>> getIssuesByCustomer(
            @PathVariable String customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Page<IssueDTO> issues = issueService.getIssuesByCustomer(customerId, PageRequest.of(page, size));
        PageResponse<IssueDTO> pageResponse = PageResponse.of(issues);
        
        return ResponseEntity.ok(ApiResponse.success("Issues retrieved successfully", pageResponse));
    }

    @GetMapping("/search")
    @Operation(summary = "Search issues")
    public ResponseEntity<ApiResponse<PageResponse<IssueDTO>>> searchIssues(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Page<IssueDTO> issues = issueService.searchIssues(q, PageRequest.of(page, size));
        PageResponse<IssueDTO> pageResponse = PageResponse.of(issues);
        
        return ResponseEntity.ok(ApiResponse.success("Issues retrieved successfully", pageResponse));
    }

    @PostMapping
    @Operation(summary = "Create a new issue")
    public ResponseEntity<ApiResponse<IssueDTO>> createIssue(@Valid @RequestBody CreateIssueRequest request) {
        IssueDTO issue = issueService.createIssue(request);
        return ResponseEntity.ok(ApiResponse.success("Issue created successfully", issue));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an issue")
    public ResponseEntity<ApiResponse<IssueDTO>> updateIssue(
            @PathVariable String id,
            @Valid @RequestBody CreateIssueRequest request) {
        IssueDTO issue = issueService.updateIssue(id, request);
        return ResponseEntity.ok(ApiResponse.success("Issue updated successfully", issue));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update issue status")
    public ResponseEntity<ApiResponse<IssueDTO>> updateIssueStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        IssueDTO issue = issueService.updateIssueStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Issue status updated successfully", issue));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an issue")
    public ResponseEntity<ApiResponse<Void>> deleteIssue(@PathVariable String id) {
        issueService.deleteIssue(id);
        return ResponseEntity.ok(ApiResponse.success("Issue deleted successfully", null));
    }

    @PostMapping("/sync/jira")
    @Operation(summary = "Sync issues from Jira")
    public ResponseEntity<ApiResponse<Void>> syncFromJira() {
        issueService.syncFromJira();
        return ResponseEntity.ok(ApiResponse.success("Jira sync initiated", null));
    }

    @PostMapping("/sync/linear")
    @Operation(summary = "Sync issues from Linear")
    public ResponseEntity<ApiResponse<Void>> syncFromLinear() {
        issueService.syncFromLinear();
        return ResponseEntity.ok(ApiResponse.success("Linear sync initiated", null));
    }
}


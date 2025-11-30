package com.neobit.crm.controller;

import com.neobit.crm.dto.common.ApiResponse;
import com.neobit.crm.dto.common.PageResponse;
import com.neobit.crm.dto.interaction.CreateInteractionRequest;
import com.neobit.crm.dto.interaction.InteractionDTO;
import com.neobit.crm.entity.Interaction;
import com.neobit.crm.service.InteractionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/interactions")
@RequiredArgsConstructor
@Tag(name = "Interactions", description = "Interaction management endpoints")
public class InteractionController {
    
    private final InteractionService interactionService;
    
    @GetMapping
    @Operation(summary = "Get all interactions")
    public ResponseEntity<ApiResponse<PageResponse<InteractionDTO>>> getInteractions(Pageable pageable) {
        PageResponse<InteractionDTO> interactions = interactionService.getInteractions(pageable);
        return ResponseEntity.ok(ApiResponse.success(interactions));
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get interaction by ID")
    public ResponseEntity<ApiResponse<InteractionDTO>> getInteractionById(@PathVariable UUID id) {
        InteractionDTO interaction = interactionService.getInteractionById(id);
        return ResponseEntity.ok(ApiResponse.success(interaction));
    }
    
    @GetMapping("/customer/{customerId}")
    @Operation(summary = "Get interactions by customer")
    public ResponseEntity<ApiResponse<PageResponse<InteractionDTO>>> getInteractionsByCustomer(
            @PathVariable UUID customerId,
            Pageable pageable) {
        PageResponse<InteractionDTO> interactions = interactionService.getInteractionsByCustomer(customerId, pageable);
        return ResponseEntity.ok(ApiResponse.success(interactions));
    }
    
    @GetMapping("/account/{accountId}")
    @Operation(summary = "Get interactions by account")
    public ResponseEntity<ApiResponse<PageResponse<InteractionDTO>>> getInteractionsByAccount(
            @PathVariable UUID accountId,
            Pageable pageable) {
        PageResponse<InteractionDTO> interactions = interactionService.getInteractionsByAccount(accountId, pageable);
        return ResponseEntity.ok(ApiResponse.success(interactions));
    }
    
    @GetMapping("/type/{type}")
    @Operation(summary = "Get interactions by type")
    public ResponseEntity<ApiResponse<PageResponse<InteractionDTO>>> getInteractionsByType(
            @PathVariable Interaction.InteractionType type,
            Pageable pageable) {
        PageResponse<InteractionDTO> interactions = interactionService.getInteractionsByType(type, pageable);
        return ResponseEntity.ok(ApiResponse.success(interactions));
    }
    
    @GetMapping("/date-range")
    @Operation(summary = "Get interactions by date range")
    public ResponseEntity<ApiResponse<PageResponse<InteractionDTO>>> getInteractionsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            Pageable pageable) {
        PageResponse<InteractionDTO> interactions = interactionService.getInteractionsByDateRange(startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.success(interactions));
    }
    
    @PostMapping
    @Operation(summary = "Create a new interaction")
    public ResponseEntity<ApiResponse<InteractionDTO>> createInteraction(@Valid @RequestBody CreateInteractionRequest request) {
        InteractionDTO interaction = interactionService.createInteraction(request);
        return ResponseEntity.ok(ApiResponse.success("Interaction created successfully", interaction));
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Update interaction")
    public ResponseEntity<ApiResponse<InteractionDTO>> updateInteraction(
            @PathVariable UUID id,
            @Valid @RequestBody CreateInteractionRequest request) {
        InteractionDTO interaction = interactionService.updateInteraction(id, request);
        return ResponseEntity.ok(ApiResponse.success("Interaction updated successfully", interaction));
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete interaction")
    public ResponseEntity<ApiResponse<Void>> deleteInteraction(@PathVariable UUID id) {
        interactionService.deleteInteraction(id);
        return ResponseEntity.ok(ApiResponse.success("Interaction deleted successfully", null));
    }
}


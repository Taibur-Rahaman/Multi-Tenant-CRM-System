package com.neobit.crm.controller;

import com.neobit.crm.dto.account.AccountDTO;
import com.neobit.crm.dto.account.CreateAccountRequest;
import com.neobit.crm.dto.common.ApiResponse;
import com.neobit.crm.dto.common.PageResponse;
import com.neobit.crm.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/accounts")
@RequiredArgsConstructor
@Tag(name = "Accounts", description = "Account management endpoints")
public class AccountController {
    
    private final AccountService accountService;
    
    @GetMapping
    @Operation(summary = "Get all accounts")
    public ResponseEntity<ApiResponse<PageResponse<AccountDTO>>> getAccounts(Pageable pageable) {
        PageResponse<AccountDTO> accounts = accountService.getAccounts(pageable);
        return ResponseEntity.ok(ApiResponse.success(accounts));
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get account by ID")
    public ResponseEntity<ApiResponse<AccountDTO>> getAccountById(@PathVariable UUID id) {
        AccountDTO account = accountService.getAccountById(id);
        return ResponseEntity.ok(ApiResponse.success(account));
    }
    
    @GetMapping("/search")
    @Operation(summary = "Search accounts by name")
    public ResponseEntity<ApiResponse<PageResponse<AccountDTO>>> searchAccounts(
            @RequestParam String q,
            Pageable pageable) {
        PageResponse<AccountDTO> accounts = accountService.searchAccounts(q, pageable);
        return ResponseEntity.ok(ApiResponse.success(accounts));
    }
    
    @PostMapping
    @Operation(summary = "Create a new account")
    public ResponseEntity<ApiResponse<AccountDTO>> createAccount(@Valid @RequestBody CreateAccountRequest request) {
        AccountDTO account = accountService.createAccount(request);
        return ResponseEntity.ok(ApiResponse.success("Account created successfully", account));
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Update account")
    public ResponseEntity<ApiResponse<AccountDTO>> updateAccount(
            @PathVariable UUID id,
            @Valid @RequestBody CreateAccountRequest request) {
        AccountDTO account = accountService.updateAccount(id, request);
        return ResponseEntity.ok(ApiResponse.success("Account updated successfully", account));
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete account")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(@PathVariable UUID id) {
        accountService.deleteAccount(id);
        return ResponseEntity.ok(ApiResponse.success("Account deleted successfully", null));
    }
}


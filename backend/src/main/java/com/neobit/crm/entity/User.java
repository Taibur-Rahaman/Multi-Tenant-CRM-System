package com.neobit.crm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(nullable = false)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    private String phone;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserRole role = UserRole.SALES_REP;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "email_verified")
    @Builder.Default
    private Boolean emailVerified = false;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getFullName() {
        String first = firstName != null ? firstName.trim() : "";
        String last = lastName != null ? lastName.trim() : "";
        return (first + " " + last).trim();
    }

    /**
     * Professional CRM User Roles
     * 
     * SUPER_ADMIN    - Platform owner, manages all tenants (SaaS admin)
     * TENANT_ADMIN   - Vendor admin, full control of their organization
     * SALES_MANAGER  - Manages sales team, pipelines, reports
     * SALES_REP      - Sales agent, manages leads/deals/customers
     * SUPPORT_AGENT  - Customer support, manages tickets/issues
     * MARKETING      - Marketing team, manages campaigns
     * FINANCE        - Finance access, quotes/invoices/reports
     * VIEWER         - Read-only access
     */
    public enum UserRole {
        SUPER_ADMIN,
        TENANT_ADMIN,
        SALES_MANAGER,
        SALES_REP,
        SUPPORT_AGENT,
        MARKETING,
        FINANCE,
        VIEWER;
        
        // Legacy mapping for backward compatibility
        public static UserRole fromLegacy(String legacy) {
            return switch (legacy.toUpperCase()) {
                case "ADMIN" -> TENANT_ADMIN;
                case "AGENT" -> SALES_REP;
                default -> VIEWER;
            };
        }
        
        public boolean canManageUsers() {
            return this == SUPER_ADMIN || this == TENANT_ADMIN;
        }
        
        public boolean canManagePipeline() {
            return this == SUPER_ADMIN || this == TENANT_ADMIN || this == SALES_MANAGER;
        }
        
        public boolean canAccessReports() {
            return this != VIEWER;
        }
        
        public boolean canManageDeals() {
            return this == SUPER_ADMIN || this == TENANT_ADMIN || 
                   this == SALES_MANAGER || this == SALES_REP;
        }
        
        public boolean canApproveQuotes() {
            return this == SUPER_ADMIN || this == TENANT_ADMIN || 
                   this == SALES_MANAGER || this == FINANCE;
        }
    }
}


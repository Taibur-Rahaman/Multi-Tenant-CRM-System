package com.neobit.crm.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "issues", indexes = {
    @Index(name = "idx_issue_tenant", columnList = "tenant_id"),
    @Index(name = "idx_issue_status", columnList = "status"),
    @Index(name = "idx_issue_external_id", columnList = "external_id"),
    @Index(name = "idx_issue_provider", columnList = "provider")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Issue {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "external_id")
    private String externalId;

    @Column(name = "external_key")
    private String externalKey;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String status; // todo, in_progress, done, cancelled

    @Column(nullable = false)
    private String priority; // lowest, low, medium, high, highest

    private String assignee;

    @Column(nullable = false)
    private String provider; // jira, linear, internal

    private String url;

    @Column(name = "customer_id")
    private String customerId;

    @Column(name = "customer_name")
    private String customerName;

    @ElementCollection
    @CollectionTable(name = "issue_labels", joinColumns = @JoinColumn(name = "issue_id"))
    @Column(name = "label")
    @Builder.Default
    private List<String> labels = new ArrayList<>();

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}


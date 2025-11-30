package com.neobit.crm.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "interactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Interaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InteractionType type;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private InteractionDirection direction = InteractionDirection.OUTBOUND;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private InteractionStatus status = InteractionStatus.COMPLETED;

    private String subject;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String summary;

    private String sentiment;

    @Column(name = "sentiment_score")
    private BigDecimal sentimentScore;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "scheduled_at")
    private Instant scheduledAt;

    private String location;

    @Column(name = "external_id")
    private String externalId;

    @Column(name = "external_source")
    private String externalSource;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> metadata = new HashMap<>();

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "text[]")
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @OneToMany(mappedBy = "interaction", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InteractionAttachment> attachments = new ArrayList<>();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public enum InteractionType {
        CALL, EMAIL, MEETING, MESSAGE, COMPLAINT, NOTE, TASK
    }

    public enum InteractionDirection {
        INBOUND, OUTBOUND, INTERNAL
    }

    public enum InteractionStatus {
        PENDING, IN_PROGRESS, COMPLETED, CANCELLED
    }
}


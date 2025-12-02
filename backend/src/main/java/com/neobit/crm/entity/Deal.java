package com.neobit.crm.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Entity
@Table(name = "deals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Deal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pipeline_id", nullable = false)
    private Pipeline pipeline;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stage_id", nullable = false)
    private PipelineStage stage;

    // Basic Info
    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "deal_number", length = 50)
    private String dealNumber;

    // Financial
    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(length = 3)
    @Builder.Default
    private String currency = "USD";

    @Column(name = "expected_revenue", precision = 15, scale = 2)
    private BigDecimal expectedRevenue;

    // Probability & Dates
    @Builder.Default
    private Integer probability = 0;

    @Column(name = "expected_close_date")
    private LocalDate expectedCloseDate;

    @Column(name = "actual_close_date")
    private LocalDate actualCloseDate;

    // Status
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private DealStatus status = DealStatus.OPEN;

    @Column(name = "lost_reason")
    private String lostReason;

    @Column(name = "won_reason")
    private String wonReason;

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id")
    private Customer contact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    // Source
    @Column(name = "lead_source", length = 100)
    private String leadSource;

    @Column(name = "campaign_id")
    private UUID campaignId;

    // Tracking
    @Column(name = "last_activity_at")
    private Instant lastActivityAt;

    @Column(name = "stage_entered_at")
    @Builder.Default
    private Instant stageEnteredAt = Instant.now();

    @Column(name = "days_in_stage")
    @Builder.Default
    private Integer daysInStage = 0;

    // Tags
    @Column(columnDefinition = "text[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Builder.Default
    private String[] tags = new String[]{};

    // Custom Fields
    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private Map<String, Object> customFields = new HashMap<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

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

    public void moveToStage(PipelineStage newStage) {
        this.stage = newStage;
        this.stageEnteredAt = Instant.now();
        this.daysInStage = 0;
        this.probability = newStage.getWinProbability();
        
        if (newStage.getIsWonStage()) {
            this.status = DealStatus.WON;
            this.actualCloseDate = LocalDate.now();
        } else if (newStage.getIsLostStage()) {
            this.status = DealStatus.LOST;
            this.actualCloseDate = LocalDate.now();
        }
    }

    public BigDecimal getWeightedValue() {
        if (amount == null || probability == null) {
            return BigDecimal.ZERO;
        }
        return amount.multiply(BigDecimal.valueOf(probability).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
    }

    public enum DealStatus {
        OPEN,
        WON,
        LOST,
        ABANDONED
    }
}


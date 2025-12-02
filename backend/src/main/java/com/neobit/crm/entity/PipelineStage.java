package com.neobit.crm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pipeline_stages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PipelineStage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pipeline_id", nullable = false)
    private Pipeline pipeline;

    @Column(nullable = false, length = 100)
    private String name;

    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Integer position = 0;

    @Column(name = "win_probability")
    @Builder.Default
    private Integer winProbability = 0;

    @Column(length = 7)
    @Builder.Default
    private String color = "#6366f1";

    @Column(name = "is_won_stage")
    @Builder.Default
    private Boolean isWonStage = false;

    @Column(name = "is_lost_stage")
    @Builder.Default
    private Boolean isLostStage = false;

    @Column(name = "rotting_days")
    @Builder.Default
    private Integer rottingDays = 30;

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

    public boolean isClosedStage() {
        return isWonStage || isLostStage;
    }
}


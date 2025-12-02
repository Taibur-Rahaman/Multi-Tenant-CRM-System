package com.neobit.crm.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    // Basic Info
    @Column(nullable = false)
    private String name;

    @Column(length = 100)
    private String sku;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "category_id")
    private UUID categoryId;

    // Pricing
    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "cost_price", precision = 15, scale = 2)
    private BigDecimal costPrice;

    @Column(length = 3)
    @Builder.Default
    private String currency = "USD";

    // Billing
    @Enumerated(EnumType.STRING)
    @Column(name = "billing_type", length = 20)
    @Builder.Default
    private BillingType billingType = BillingType.ONE_TIME;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_frequency", length = 20)
    private BillingFrequency billingFrequency;

    // Tax
    @Column(name = "tax_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxRate = BigDecimal.ZERO;

    @Column(name = "is_taxable")
    @Builder.Default
    private Boolean isTaxable = true;

    // Status
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_featured")
    @Builder.Default
    private Boolean isFeatured = false;

    // Stock
    @Column(name = "track_inventory")
    @Builder.Default
    private Boolean trackInventory = false;

    @Column(name = "quantity_in_stock")
    @Builder.Default
    private Integer quantityInStock = 0;

    @Column(name = "low_stock_threshold")
    @Builder.Default
    private Integer lowStockThreshold = 10;

    // Custom Fields
    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private Map<String, Object> customFields = new HashMap<>();

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

    public BigDecimal getMargin() {
        if (costPrice == null || unitPrice == null || unitPrice.equals(BigDecimal.ZERO)) {
            return BigDecimal.ZERO;
        }
        return unitPrice.subtract(costPrice).divide(unitPrice, 4, java.math.RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }

    public boolean isLowStock() {
        return trackInventory && quantityInStock != null && 
               lowStockThreshold != null && quantityInStock <= lowStockThreshold;
    }

    public enum BillingType {
        ONE_TIME,
        RECURRING,
        USAGE_BASED
    }

    public enum BillingFrequency {
        MONTHLY,
        QUARTERLY,
        YEARLY,
        CUSTOM
    }
}


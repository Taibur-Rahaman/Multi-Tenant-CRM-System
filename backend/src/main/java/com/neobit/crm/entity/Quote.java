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
@Table(name = "quotes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Quote {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    // Reference
    @Column(name = "quote_number", nullable = false, length = 50)
    private String quoteNumber;

    private String name;

    // Status
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private QuoteStatus status = QuoteStatus.DRAFT;

    // Dates
    @Column(name = "issue_date")
    @Builder.Default
    private LocalDate issueDate = LocalDate.now();

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deal_id")
    private Deal deal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id")
    private Customer contact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    // Financials
    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", length = 10)
    private DiscountType discountType;

    @Column(name = "discount_value", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal discountValue = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(length = 3)
    @Builder.Default
    private String currency = "USD";

    // Content
    @Column(columnDefinition = "text")
    private String introduction;

    @Column(name = "terms_and_conditions", columnDefinition = "text")
    private String termsAndConditions;

    @Column(columnDefinition = "text")
    private String notes;

    // Tracking
    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "viewed_at")
    private Instant viewedAt;

    @Column(name = "view_count")
    @Builder.Default
    private Integer viewCount = 0;

    // Line Items
    @OneToMany(mappedBy = "quote", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    @Builder.Default
    private List<QuoteLineItem> lineItems = new ArrayList<>();

    // Custom Fields
    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private Map<String, Object> customFields = new HashMap<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

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

    public void addLineItem(QuoteLineItem item) {
        lineItems.add(item);
        item.setQuote(this);
        recalculateTotals();
    }

    public void removeLineItem(QuoteLineItem item) {
        lineItems.remove(item);
        item.setQuote(null);
        recalculateTotals();
    }

    public void recalculateTotals() {
        this.subtotal = lineItems.stream()
                .map(QuoteLineItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal discount = BigDecimal.ZERO;
        if (discountType == DiscountType.PERCENT && discountValue != null) {
            discount = subtotal.multiply(discountValue.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        } else if (discountType == DiscountType.AMOUNT && discountValue != null) {
            discount = discountValue;
        }

        this.taxAmount = lineItems.stream()
                .map(item -> item.getTotalPrice().multiply(item.getTaxRate().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        this.totalAmount = subtotal.subtract(discount).add(taxAmount);
    }

    public boolean isExpired() {
        return expiryDate != null && LocalDate.now().isAfter(expiryDate);
    }

    public enum QuoteStatus {
        DRAFT,
        PENDING,
        SENT,
        ACCEPTED,
        REJECTED,
        EXPIRED,
        CONVERTED
    }

    public enum DiscountType {
        PERCENT,
        AMOUNT
    }
}


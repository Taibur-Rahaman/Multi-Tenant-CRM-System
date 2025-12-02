package com.neobit.crm.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "activities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    // Type & Status
    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", nullable = false, length = 50)
    private ActivityType activityType;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ActivityStatus status = ActivityStatus.SCHEDULED;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ActivityPriority priority = ActivityPriority.NORMAL;

    // Details
    @Column(nullable = false, length = 500)
    private String subject;

    @Column(columnDefinition = "text")
    private String description;

    @Column(columnDefinition = "text")
    private String outcome;

    // Timing
    @Column(name = "scheduled_start")
    private Instant scheduledStart;

    @Column(name = "scheduled_end")
    private Instant scheduledEnd;

    @Column(name = "actual_start")
    private Instant actualStart;

    @Column(name = "actual_end")
    private Instant actualEnd;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "all_day")
    @Builder.Default
    private Boolean allDay = false;

    // Location
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "location_type", length = 20)
    private LocationType locationType;

    @Column(name = "meeting_link", length = 500)
    private String meetingLink;

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id")
    private Customer contact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deal_id")
    private Deal deal;

    // Assignment
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private User assignedTo;

    // Call specific
    @Enumerated(EnumType.STRING)
    @Column(name = "call_direction", length = 10)
    private CallDirection callDirection;

    @Column(name = "call_result", length = 50)
    private String callResult;

    @Column(name = "recording_url", length = 500)
    private String recordingUrl;

    // Email specific
    @Column(name = "email_message_id")
    private String emailMessageId;

    @Column(name = "email_thread_id")
    private String emailThreadId;

    // Reminders
    @Column(name = "reminder_at")
    private Instant reminderAt;

    @Column(name = "reminder_sent")
    @Builder.Default
    private Boolean reminderSent = false;

    // Recurrence
    @Column(name = "is_recurring")
    @Builder.Default
    private Boolean isRecurring = false;

    @Column(name = "recurrence_pattern", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> recurrencePattern;

    @Column(name = "parent_activity_id")
    private UUID parentActivityId;

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

    public void complete(String outcome) {
        this.status = ActivityStatus.COMPLETED;
        this.outcome = outcome;
        this.actualEnd = Instant.now();
        if (this.actualStart == null) {
            this.actualStart = this.scheduledStart;
        }
    }

    public void cancel() {
        this.status = ActivityStatus.CANCELLED;
    }

    public boolean isOverdue() {
        return scheduledEnd != null && 
               Instant.now().isAfter(scheduledEnd) && 
               status == ActivityStatus.SCHEDULED;
    }

    public enum ActivityType {
        CALL,
        EMAIL,
        MEETING,
        TASK,
        NOTE,
        SMS,
        WHATSAPP,
        LINKEDIN,
        DEMO,
        PROPOSAL_SENT,
        CONTRACT_SENT,
        FOLLOW_UP,
        SITE_VISIT
    }

    public enum ActivityStatus {
        SCHEDULED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED,
        RESCHEDULED
    }

    public enum ActivityPriority {
        LOW,
        NORMAL,
        HIGH,
        URGENT
    }

    public enum LocationType {
        IN_PERSON,
        PHONE,
        VIDEO,
        ONLINE
    }

    public enum CallDirection {
        INBOUND,
        OUTBOUND
    }
}


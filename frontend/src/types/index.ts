// =====================================================
// Multi-Tenant CRM System - Professional Type Definitions
// =====================================================

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    details?: string;
    validationErrors?: Record<string, string>;
  };
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// =====================================================
// Authentication & Users
// =====================================================

export interface LoginRequest {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  tenantSlug: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'TENANT_ADMIN' 
  | 'SALES_MANAGER' 
  | 'SALES_REP' 
  | 'SUPPORT_AGENT' 
  | 'MARKETING' 
  | 'FINANCE' 
  | 'VIEWER';

export interface User {
  id: string;
  tenantId: string;
  tenantName: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface UserPermissions {
  canManageUsers: boolean;
  canManagePipeline: boolean;
  canAccessReports: boolean;
  canManageDeals: boolean;
  canApproveQuotes: boolean;
}

// =====================================================
// Tenant
// =====================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logoUrl?: string;
  settings: TenantSettings;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  maxUsers: number;
  isActive: boolean;
  createdAt: string;
}

export interface TenantSettings {
  currency: string;
  timezone: string;
  dateFormat: string;
  fiscalYearStart: number;
  features: string[];
}

export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trialing';

// =====================================================
// Pipeline & Stages
// =====================================================

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  currency: string;
  winProbabilityEnabled: boolean;
  stages: PipelineStage[];
  dealsCount: number;
  totalValue: number;
  createdAt: string;
}

export interface PipelineStage {
  id: string;
  pipelineId: string;
  name: string;
  description?: string;
  position: number;
  winProbability: number;
  color: string;
  isWonStage: boolean;
  isLostStage: boolean;
  rottingDays: number;
  dealsCount: number;
  totalValue: number;
}

export interface CreatePipelineRequest {
  name: string;
  description?: string;
  currency?: string;
  stages: CreateStageRequest[];
}

export interface CreateStageRequest {
  name: string;
  winProbability: number;
  color?: string;
  isWonStage?: boolean;
  isLostStage?: boolean;
}

// =====================================================
// Deals / Opportunities
// =====================================================

export type DealStatus = 'open' | 'won' | 'lost' | 'abandoned';

export interface Deal {
  id: string;
  pipelineId: string;
  pipelineName: string;
  stageId: string;
  stageName: string;
  stageColor: string;
  
  // Basic Info
  name: string;
  description?: string;
  dealNumber: string;
  
  // Financial
  amount: number;
  currency: string;
  expectedRevenue?: number;
  weightedValue: number;
  
  // Probability & Dates
  probability: number;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  
  // Status
  status: DealStatus;
  lostReason?: string;
  wonReason?: string;
  
  // Relationships
  contactId?: string;
  contactName?: string;
  accountId?: string;
  accountName?: string;
  ownerId?: string;
  ownerName?: string;
  ownerAvatarUrl?: string;
  
  // Source
  leadSource?: string;
  
  // Tracking
  lastActivityAt?: string;
  stageEnteredAt: string;
  daysInStage: number;
  isRotting: boolean;
  
  // Custom
  tags: string[];
  customFields: Record<string, unknown>;
  
  // Activities summary
  activitiesCount: number;
  notesCount: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateDealRequest {
  name: string;
  pipelineId: string;
  stageId: string;
  amount?: number;
  expectedCloseDate?: string;
  contactId?: string;
  accountId?: string;
  ownerId?: string;
  leadSource?: string;
  description?: string;
  tags?: string[];
}

export interface UpdateDealRequest extends Partial<CreateDealRequest> {
  status?: DealStatus;
  lostReason?: string;
  wonReason?: string;
}

export interface DealStageUpdate {
  dealId: string;
  newStageId: string;
  notes?: string;
}

// =====================================================
// Accounts (Companies)
// =====================================================

export type AccountStatus = 'active' | 'inactive' | 'prospect' | 'customer' | 'churned';

export interface Account {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  annualRevenue?: number;
  employeeCount?: number;
  description?: string;
  ownerId?: string;
  ownerName?: string;
  status: AccountStatus;
  tags: string[];
  customFields: Record<string, unknown>;
  
  // Metrics
  customerCount: number;
  dealsCount: number;
  totalDealsValue: number;
  openDealsValue: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountRequest {
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  annualRevenue?: number;
  employeeCount?: number;
  description?: string;
  ownerId?: string;
  tags?: string[];
}

// =====================================================
// Contacts (Customers/Leads)
// =====================================================

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';

export interface Contact {
  id: string;
  accountId?: string;
  accountName?: string;
  
  // Personal Info
  firstName: string;
  lastName?: string;
  fullName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  
  // Professional Info
  jobTitle?: string;
  department?: string;
  
  // Address
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  
  // Lead Info
  leadSource?: string;
  leadStatus: LeadStatus;
  leadScore: number;
  isLead: boolean;
  
  // Ownership
  ownerId?: string;
  ownerName?: string;
  
  // Custom
  tags: string[];
  customFields: Record<string, unknown>;
  
  // Metrics
  lastContactedAt?: string;
  interactionCount: number;
  dealsCount: number;
  totalDealsValue: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactRequest {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  accountId?: string;
  leadSource?: string;
  leadStatus?: LeadStatus;
  isLead?: boolean;
  ownerId?: string;
  tags?: string[];
}

// Alias for backward compatibility
export type Customer = Contact;
export type CreateCustomerRequest = CreateContactRequest;

// =====================================================
// Products
// =====================================================

export type BillingType = 'one_time' | 'recurring' | 'usage_based';
export type BillingFrequency = 'monthly' | 'quarterly' | 'yearly' | 'custom';

export interface Product {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  
  // Pricing
  unitPrice: number;
  costPrice?: number;
  currency: string;
  margin?: number;
  
  // Billing
  billingType: BillingType;
  billingFrequency?: BillingFrequency;
  
  // Tax
  taxRate: number;
  isTaxable: boolean;
  
  // Status
  isActive: boolean;
  isFeatured: boolean;
  
  // Stock
  trackInventory: boolean;
  quantityInStock: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  sku?: string;
  description?: string;
  unitPrice: number;
  costPrice?: number;
  billingType?: BillingType;
  billingFrequency?: BillingFrequency;
  taxRate?: number;
  isTaxable?: boolean;
  trackInventory?: boolean;
  quantityInStock?: number;
}

// =====================================================
// Quotes / Proposals
// =====================================================

export type QuoteStatus = 'draft' | 'pending' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

export interface Quote {
  id: string;
  quoteNumber: string;
  name?: string;
  status: QuoteStatus;
  
  // Dates
  issueDate: string;
  expiryDate?: string;
  acceptedAt?: string;
  
  // Relationships
  dealId?: string;
  dealName?: string;
  contactId?: string;
  contactName?: string;
  accountId?: string;
  accountName?: string;
  ownerId?: string;
  ownerName?: string;
  
  // Financials
  subtotal: number;
  discountType?: 'percent' | 'amount';
  discountValue: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  
  // Content
  introduction?: string;
  termsAndConditions?: string;
  notes?: string;
  
  // Line Items
  lineItems: QuoteLineItem[];
  
  // Tracking
  sentAt?: string;
  viewedAt?: string;
  viewCount: number;
  
  isExpired: boolean;
  
  createdBy?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteLineItem {
  id: string;
  productId?: string;
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  totalPrice: number;
  position: number;
}

export interface CreateQuoteRequest {
  name?: string;
  dealId?: string;
  contactId?: string;
  accountId?: string;
  expiryDate?: string;
  discountType?: 'percent' | 'amount';
  discountValue?: number;
  introduction?: string;
  termsAndConditions?: string;
  notes?: string;
  lineItems: CreateQuoteLineItemRequest[];
}

export interface CreateQuoteLineItemRequest {
  productId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxRate?: number;
}

// =====================================================
// Activities
// =====================================================

export type ActivityType = 
  | 'call' | 'email' | 'meeting' | 'task' | 'note' 
  | 'sms' | 'whatsapp' | 'linkedin' | 'demo' 
  | 'proposal_sent' | 'contract_sent' | 'follow_up' | 'site_visit';

export type ActivityStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
export type ActivityPriority = 'low' | 'normal' | 'high' | 'urgent';
export type LocationType = 'in_person' | 'phone' | 'video' | 'online';
export type CallDirection = 'inbound' | 'outbound';

export interface Activity {
  id: string;
  activityType: ActivityType;
  status: ActivityStatus;
  priority: ActivityPriority;
  
  subject: string;
  description?: string;
  outcome?: string;
  
  // Timing
  scheduledStart?: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  durationMinutes?: number;
  allDay: boolean;
  
  // Location
  location?: string;
  locationType?: LocationType;
  meetingLink?: string;
  
  // Relationships
  contactId?: string;
  contactName?: string;
  accountId?: string;
  accountName?: string;
  dealId?: string;
  dealName?: string;
  
  // Assignment
  ownerId: string;
  ownerName: string;
  assignedToId?: string;
  assignedToName?: string;
  
  // Call specific
  callDirection?: CallDirection;
  callResult?: string;
  recordingUrl?: string;
  
  // Reminders
  reminderAt?: string;
  reminderSent: boolean;
  
  isRecurring: boolean;
  isOverdue: boolean;
  
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityRequest {
  activityType: ActivityType;
  subject: string;
  description?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  priority?: ActivityPriority;
  locationType?: LocationType;
  location?: string;
  meetingLink?: string;
  contactId?: string;
  accountId?: string;
  dealId?: string;
  assignedToId?: string;
  reminderAt?: string;
  tags?: string[];
}

// Legacy compatibility
export type InteractionType = 'CALL' | 'EMAIL' | 'MEETING' | 'MESSAGE' | 'COMPLAINT' | 'NOTE' | 'TASK';
export type InteractionDirection = 'INBOUND' | 'OUTBOUND' | 'INTERNAL';
export type InteractionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Interaction {
  id: string;
  customerId?: string;
  customerName?: string;
  accountId?: string;
  accountName?: string;
  userId?: string;
  userName?: string;
  type: InteractionType;
  direction: InteractionDirection;
  status: InteractionStatus;
  subject?: string;
  description?: string;
  summary?: string;
  sentiment?: string;
  sentimentScore?: number;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  scheduledAt?: string;
  location?: string;
  externalId?: string;
  externalSource?: string;
  metadata: Record<string, unknown>;
  tags: string[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType?: string;
  fileSize?: number;
  fileUrl: string;
}

export interface CreateInteractionRequest {
  customerId?: string;
  accountId?: string;
  type: InteractionType;
  direction?: InteractionDirection;
  status?: InteractionStatus;
  subject?: string;
  description?: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  scheduledAt?: string;
  location?: string;
  tags?: string[];
}

// =====================================================
// Tasks
// =====================================================

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedAt?: string;
  
  contactId?: string;
  contactName?: string;
  accountId?: string;
  accountName?: string;
  dealId?: string;
  dealName?: string;
  interactionId?: string;
  
  assignedToId?: string;
  assignedToName?: string;
  createdById?: string;
  createdByName?: string;
  
  tags: string[];
  isOverdue: boolean;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  contactId?: string;
  accountId?: string;
  dealId?: string;
  assignedToId?: string;
  tags?: string[];
}

// =====================================================
// Issues / Tickets
// =====================================================

export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';
export type IssuePriority = 'lowest' | 'low' | 'medium' | 'high' | 'highest';
export type IssueProvider = 'jira' | 'linear' | 'internal';

export interface Issue {
  id: string;
  externalId?: string;
  externalKey: string;
  title: string;
  description?: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignee?: string;
  provider: IssueProvider;
  url?: string;
  contactId?: string;
  contactName?: string;
  labels: string[];
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueRequest {
  title: string;
  description?: string;
  priority?: IssuePriority;
  assignee?: string;
  contactId?: string;
  labels?: string[];
}

// =====================================================
// Dashboard & Reports
// =====================================================

export interface DashboardStats {
  // Overview
  totalContacts: number;
  totalLeads: number;
  totalAccounts: number;
  totalDeals: number;
  
  // Pipeline
  openDeals: number;
  openDealsValue: number;
  weightedPipelineValue: number;
  
  // Performance
  dealsWonThisMonth: number;
  dealsWonValue: number;
  dealsLostThisMonth: number;
  winRate: number;
  averageDealSize: number;
  averageSalesCycle: number;
  
  // Activities
  activitiesThisWeek: number;
  pendingTasks: number;
  overdueActivities: number;
  
  // By Type
  interactionsByType: Record<string, number>;
  dealsByStage: DealsByStage[];
  
  // Trends
  revenueByMonth: RevenueByMonth[];
  dealsTrend: DealsTrend[];
  
  // Legacy
  totalCustomers: number;
  totalInteractions: number;
  totalTasks: number;
  recentInteractions: number;
}

export interface DealsByStage {
  stageId: string;
  stageName: string;
  stageColor: string;
  count: number;
  value: number;
}

export interface RevenueByMonth {
  month: string;
  won: number;
  lost: number;
  pipeline: number;
}

export interface DealsTrend {
  date: string;
  created: number;
  won: number;
  lost: number;
}

export interface SalesPerformance {
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  dealsWon: number;
  revenue: number;
  activitiesCompleted: number;
  winRate: number;
  averageDealSize: number;
}

export interface PipelineReport {
  pipeline: Pipeline;
  totalDeals: number;
  totalValue: number;
  weightedValue: number;
  averageDealAge: number;
  conversionRate: number;
  stageMetrics: StageMetrics[];
}

export interface StageMetrics {
  stage: PipelineStage;
  deals: number;
  value: number;
  averageTimeInStage: number;
  conversionRate: number;
}

// =====================================================
// Integrations
// =====================================================

export type IntegrationType = 'gmail' | 'calendar' | 'jira' | 'linear' | 'telegram' | 'twilio' | 'slack' | 'zapier';

export interface IntegrationConfig {
  integrationType: IntegrationType;
  isEnabled: boolean;
  isConfigured: boolean;
  lastSyncAt?: string;
  syncStatus?: 'idle' | 'syncing' | 'error';
  config?: Record<string, unknown>;
  error?: string;
}

export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  defaultProjectKey?: string;
}

export interface IssueSyncStatus {
  totalIssues: number;
  jiraIssues: number;
  linearIssues: number;
  internalIssues: number;
  jiraConfigured: boolean;
  linearConfigured: boolean;
}

// =====================================================
// Notifications
// =====================================================

export type NotificationType = 
  | 'deal_assigned' | 'deal_won' | 'deal_lost' | 'deal_stage_changed'
  | 'task_assigned' | 'task_due' | 'task_overdue'
  | 'activity_reminder' | 'activity_assigned'
  | 'mention' | 'comment'
  | 'quote_accepted' | 'quote_rejected' | 'quote_viewed';

export interface Notification {
  id: string;
  title: string;
  message?: string;
  type: NotificationType;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// =====================================================
// Filters & Search
// =====================================================

export interface FilterConfig {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'between';
  value: unknown;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface SearchParams {
  query?: string;
  filters?: FilterConfig[];
  sort?: SortConfig;
  page?: number;
  size?: number;
}

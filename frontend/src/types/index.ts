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

// Auth Types
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

// User Types
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
  role: 'ADMIN' | 'AGENT' | 'VIEWER';
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

// Tenant Types
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logoUrl?: string;
  settings: Record<string, unknown>;
  subscriptionPlan: string;
  subscriptionStatus: string;
  maxUsers: number;
  isActive: boolean;
  createdAt: string;
}

// Account Types
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
  status: string;
  tags: string[];
  customFields: Record<string, unknown>;
  customerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountRequest {
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
  tags?: string[];
  customFields?: Record<string, unknown>;
}

// Customer Types
export interface Customer {
  id: string;
  accountId?: string;
  accountName?: string;
  firstName: string;
  lastName?: string;
  fullName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  leadSource?: string;
  leadStatus: string;
  leadScore: number;
  isLead: boolean;
  ownerId?: string;
  ownerName?: string;
  tags: string[];
  customFields: Record<string, unknown>;
  lastContactedAt?: string;
  interactionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  leadSource?: string;
  leadStatus?: string;
  accountId?: string;
  ownerId?: string;
  isLead?: boolean;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

// Interaction Types
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
  externalId?: string;
  externalSource?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

// Task Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  completedAt?: string;
  customerId?: string;
  customerName?: string;
  accountId?: string;
  accountName?: string;
  interactionId?: string;
  assignedToId?: string;
  assignedToName?: string;
  createdById?: string;
  createdByName?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  customerId?: string;
  accountId?: string;
  interactionId?: string;
  assignedToId?: string;
  tags?: string[];
}

// Dashboard Types
export interface DashboardStats {
  totalCustomers: number;
  totalLeads: number;
  totalAccounts: number;
  totalInteractions: number;
  recentInteractions: number;
  totalTasks: number;
  pendingTasks: number;
  interactionsByType: Record<string, number>;
}

// Issue Types
export type IssueStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
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
  customerId?: string;
  customerName?: string;
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
  customerId?: string;
  customerName?: string;
  labels?: string[];
}

export interface IssueSyncStatus {
  totalIssues: number;
  jiraIssues: number;
  linearIssues: number;
  internalIssues: number;
  jiraConfigured: boolean;
  linearConfigured: boolean;
}

// Integration Types
export interface IntegrationConfig {
  integrationType: string;
  isEnabled: boolean;
  isConfigured: boolean;
  lastSyncAt?: string;
  syncStatus?: string;
  config?: Record<string, unknown>;
}

export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  defaultProjectKey?: string;
}


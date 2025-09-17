export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  AGENT = 'AGENT',
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  ENGAGED = 'ENGAGED',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL_SENT = 'PROPOSAL_SENT',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
  FOLLOW_UP = 'FOLLOW_UP',
}

export enum LeadSource {
  MANUAL = 'MANUAL',
  API = 'API',
  CHATBOT = 'CHATBOT',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  WEBSITE = 'WEBSITE',
  REFERRAL = 'REFERRAL',
}

export enum InsuranceType {
  LIFE = 'LIFE',
  HEALTH = 'HEALTH',
  AUTO = 'AUTO',
  HOME = 'HOME',
  BUSINESS = 'BUSINESS',
  TRAVEL = 'TRAVEL',
  OTHER = 'OTHER',
}

export enum CommunicationChannel {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  PHONE = 'PHONE',
  SMS = 'SMS',
  IN_APP = 'IN_APP',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TaskType {
  FOLLOW_UP = 'FOLLOW_UP',
  CALL = 'CALL',
  MEETING = 'MEETING',
  EMAIL = 'EMAIL',
  PROPOSAL = 'PROPOSAL',
  OTHER = 'OTHER',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  source: LeadSource;
  status: LeadStatus;
  insuranceType: InsuranceType;
  urgency: number;
  score: number;
  manualScore?: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  preferredContact?: CommunicationChannel;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  inquiryDetails?: string;
  budget?: number;
  expectedCloseDate?: string;
  assignedUserId?: string;
  assignedUser?: User;
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string;
  communications?: Communication[];
  tasks?: Task[];
  client?: Client;
  aiConversations?: AIConversation[];
  leadProducts?: LeadProduct[];
}

export interface Communication {
  id: string;
  channel: CommunicationChannel;
  direction: string;
  subject?: string;
  content: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  sentAt: string;
  leadId: string;
  lead?: Lead;
  userId?: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  type: InsuranceType;
  basePrice?: number;
  features?: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeadProduct {
  id: string;
  leadId: string;
  lead?: Lead;
  productId: string;
  product?: Product;
  interest: number;
  notes?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  leadId?: string;
  lead?: Lead;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  companyId?: string;
  company?: Company;
  productId?: string;
  product?: Product;
  policyNumber?: string;
  premium?: number;
  commission?: number;
  startDate?: string;
  endDate?: string;
  renewalDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
  clients?: Client[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: number;
  dueDate?: string;
  completedAt?: string;
  leadId?: string;
  lead?: Lead;
  assignedUserId: string;
  assignedUser?: User;
  createdAt: string;
  updatedAt: string;
}

export interface AIConversation {
  id: string;
  type: string;
  input: string;
  output: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
  leadId?: string;
  lead?: Lead;
  userId?: string;
  user?: User;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  userId?: string;
  user?: User;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
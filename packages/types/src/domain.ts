import {
  UserRole,
  CustomerStatus,
  InvoiceStatus,
  PaymentMethod,
  TransactionType,
  CommitmentStatus,
  CommitmentSource,
  ConfidenceLevel,
  RiskLevel,
  CommunicationChannel,
  MessageSenderType,
  DocumentType,
  DocumentStatus,
  BusinessEventType,
  AIActionType,
  AIActionStatus,
  SubscriptionPlan,
  SubscriptionStatus,
} from './enums';

export interface BaseEntity {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Organization extends BaseEntity {
  name: string;
  slug: string;
  currency: string;
  country: string;
  logoUrl?: string;
  settings?: Record<string, any>;
}

export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface Membership extends BaseEntity {
  organizationId: string;
  userId: string;
  role: UserRole;
  user?: User;
  organization?: Organization;
}

export interface Customer extends BaseEntity {
  organizationId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  country: string;
  currency: string;
  status: CustomerStatus;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, any>;

  // Calculated properties (from deterministic queries)
  totalOutstanding?: number;
  totalPaid?: number;
  overdueInvoicesCount?: number;
  activeCommitmentsCount?: number;
  latestRiskAssessment?: RiskAssessment;
}

export interface InvoiceItem extends BaseEntity {
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice extends BaseEntity {
  organizationId: string;
  customerId: string;
  customer?: Customer;
  invoiceNumber: string;
  issueDate: Date | string;
  dueDate: Date | string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  balance: number;
  currency: string;
  status: InvoiceStatus;
  notes?: string;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface Payment extends BaseEntity {
  organizationId: string;
  customerId: string;
  customer?: Customer;
  invoiceId?: string;
  invoice?: Invoice;
  amount: number;
  currency: string;
  paymentDate: Date | string;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  source?: string;
}

export interface Transaction extends BaseEntity {
  organizationId: string;
  customerId: string;
  customer?: Customer;
  type: TransactionType;
  amount: number;
  currency: string;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: string;
  description: string;
  date: Date | string;
}

export interface Commitment extends BaseEntity {
  organizationId: string;
  customerId: string;
  customer?: Customer;
  invoiceId?: string;
  invoice?: Invoice;
  amount: number;
  currency: string;
  promisedDate: Date | string;
  description?: string;
  source: CommitmentSource;
  sourceReference?: string;
  confidence: ConfidenceLevel;
  status: CommitmentStatus;
  evidenceId?: string;
}

export interface Conversation extends BaseEntity {
  organizationId: string;
  customerId: string;
  customer?: Customer;
  channel: CommunicationChannel;
  title?: string;
  messages?: Message[];
}

export interface Message extends BaseEntity {
  conversationId: string;
  senderType: MessageSenderType;
  senderName: string;
  content: string;
  timestamp: Date | string;
  rawMetadata?: Record<string, any>;
}

export interface Document extends BaseEntity {
  organizationId: string;
  customerId?: string;
  customer?: Customer;
  name: string;
  type: DocumentType;
  fileUrl: string;
  fileKey: string;
  mimeType: string;
  fileSize: number;
  extractedData?: Record<string, any>;
  status: DocumentStatus;
}

export interface BusinessEvent {
  id: string;
  organizationId: string;
  customerId?: string;
  customer?: Customer;
  eventType: BusinessEventType;
  summary: string;
  payload: Record<string, any>;
  actorId?: string;
  createdAt: Date | string;
}

export interface RiskAssessment extends BaseEntity {
  organizationId: string;
  customerId: string;
  customer?: Customer;
  riskLevel: RiskLevel;
  riskScore: number;
  signals: Record<string, any>;
  aiExplanation?: string;
  evaluatedAt: Date | string;
}

export interface AIInsight extends BaseEntity {
  organizationId: string;
  customerId?: string;
  customer?: Customer;
  type: string;
  title: string;
  summary: string;
  confidence: ConfidenceLevel;
  priority: number;
  evidenceRefs?: string[];
  status: string;
}

export interface AIAction extends BaseEntity {
  organizationId: string;
  customerId?: string;
  customer?: Customer;
  type: AIActionType;
  title: string;
  description: string;
  payload?: Record<string, any>;
  status: AIActionStatus;
  executedAt?: Date | string;
}

export interface MemoryItem extends BaseEntity {
  organizationId: string;
  customerId?: string;
  customer?: Customer;
  type: string;
  source: string;
  sourceReference?: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
}

export interface Notification extends BaseEntity {
  organizationId: string;
  userId?: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  readAt?: Date | string;
}

export interface Subscription extends BaseEntity {
  organizationId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart?: Date | string;
  currentPeriodEnd?: Date | string;
  revenueCatId?: string;
}

export interface Entitlement extends BaseEntity {
  organizationId: string;
  feature: string;
  isEnabled: boolean;
  limit?: number;
  usage?: number;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date | string;
}

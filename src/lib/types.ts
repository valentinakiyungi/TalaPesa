import type {
  Frequency,
  Installment,
  InterestMethod,
  LateFeeType,
  RatePeriod,
} from './engine/loan';

export type Role = 'owner' | 'admin' | 'officer' | 'viewer';
export type PlanId = 'trial' | 'starter' | 'growth' | 'pro';
export type PlanStatus = 'trialing' | 'active' | 'past_due' | 'canceled';

/** Firestore timestamps arrive as Timestamp objects on the client; we treat them loosely. */
export type TimestampLike = { toDate(): Date } | Date | string | null | undefined;

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  orgId: string | null;
  role: Role | null;
  platformAdmin?: boolean;
  locale?: 'sw' | 'en';
  createdAt?: TimestampLike;
}

export interface OrgSettings {
  currency: string;
  timeZone: string;
  /** SMS reminders */
  smsEnabled: boolean;
  reminderDaysBefore: number;
  smsLanguage: 'sw' | 'en';
  templates: {
    disbursement: string;
    reminder: string;
    dueToday: string;
    overdue: string;
    receipt: string;
  };
  /** Prefix for loan numbers, e.g. "TP" -> TP-000123 */
  loanPrefix: string;
  requireGuarantor: boolean;
  maxActiveLoansPerCustomer: number;
}

export interface Organization {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  registrationNumber?: string;
  logoUrl?: string;
  ownerUid: string;
  plan: PlanId;
  planStatus: PlanStatus;
  trialEndsAt?: TimestampLike;
  currentPeriodEnd?: TimestampLike;
  settings: OrgSettings;
  counters?: { loans?: number; customers?: number; members?: number; activeLoans?: number };
  integrations?: { selcomConfigured?: boolean; smsConfigured?: boolean; smsProvider?: string };
  disabled?: boolean;
  createdAt?: TimestampLike;
}

export interface Member {
  uid: string;
  email: string;
  name: string;
  role: Role;
  status: 'active' | 'disabled';
  phone?: string;
  createdAt?: TimestampLike;
}

export interface Invite {
  id: string;
  email: string;
  role: Role;
  status: 'pending' | 'accepted' | 'revoked';
  invitedByName?: string;
  expiresAt?: TimestampLike;
  createdAt?: TimestampLike;
}

export interface LoanProduct {
  id: string;
  name: string;
  description?: string;
  interestRate: number;
  ratePeriod: RatePeriod;
  interestMethod: InterestMethod;
  frequency: Frequency;
  minAmount: number;
  maxAmount: number;
  minInstallments: number;
  maxInstallments: number;
  processingFeePercent: number;
  lateFeeType: LateFeeType;
  lateFeeValue: number;
  graceDays: number;
  active: boolean;
  createdAt?: TimestampLike;
}

export interface Contact {
  name: string;
  phone: string;
  relation?: string;
  nationalId?: string;
  address?: string;
}

export interface CustomerDocument {
  id: string;
  name: string;
  type: 'national_id' | 'passport' | 'photo' | 'payslip' | 'contract' | 'other';
  path: string;
  url: string;
  size?: number;
  uploadedAt: string;
}

export interface Customer {
  id: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  altPhone?: string;
  email?: string;
  nationalId?: string;
  gender?: 'male' | 'female' | 'other' | '';
  dateOfBirth?: string;
  address?: string;
  region?: string;
  occupation?: string;
  employer?: string;
  monthlyIncome?: number;
  nextOfKin?: Contact | null;
  guarantor?: Contact | null;
  notes?: string;
  status: 'active' | 'blacklisted';
  documents?: CustomerDocument[];
  stats?: { loans: number; activeLoans: number; totalBorrowed: number; totalRepaid: number };
  searchTokens?: string[];
  createdBy?: string;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
}

export type LoanStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'overdue' | 'closed' | 'written_off';

export interface Loan {
  id: string;
  loanNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  productId: string;
  productName: string;
  principal: number;
  interestRate: number;
  ratePeriod: RatePeriod;
  interestMethod: InterestMethod;
  frequency: Frequency;
  installments: number;
  processingFee: number;
  lateFeeType: LateFeeType;
  lateFeeValue: number;
  graceDays: number;
  purpose?: string;
  guarantor?: Contact | null;
  collateral?: string;
  /** Expected terms at application (for display before disbursement). */
  totalInterest: number;
  totalDue: number;
  totalPenalty: number;
  amountPaid: number;
  balance: number;
  principalOutstanding: number;
  arrears: number;
  daysOverdue: number;
  nextDueDate: string | null;
  nextDueAmount: number;
  schedule: Installment[];
  /** Schedule as created at disbursement; never mutated, used to replay payments. */
  baseSchedule: Installment[];
  status: LoanStatus;
  officerId: string;
  officerName: string;
  disbursedDate?: string | null;
  disbursementMethod?: string;
  disbursementReference?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: TimestampLike;
  rejectedReason?: string;
  closedDate?: string | null;
  writtenOffReason?: string;
  lastPaymentDate?: string | null;
  lastReminderDate?: string | null;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
}

export type PaymentMethod = 'cash' | 'mpesa' | 'tigopesa' | 'airtelmoney' | 'halopesa' | 'bank' | 'selcom' | 'other';

export interface Payment {
  id: string;
  loanId: string;
  loanNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  date: string;
  status: 'completed' | 'reversed';
  allocation?: { principal: number; interest: number; penalty: number };
  receiptNumber: string;
  note?: string;
  receivedBy: string;
  receivedByName: string;
  reversedReason?: string;
  reversedBy?: string;
  source?: 'manual' | 'selcom';
  createdAt?: TimestampLike;
}

export interface PaymentRequest {
  id: string;
  loanId: string;
  loanNumber: string;
  customerName: string;
  phone: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  testMode: boolean;
  message?: string;
  createdByName?: string;
  createdAt?: TimestampLike;
}

export interface SmsLog {
  id: string;
  to: string;
  message: string;
  kind: 'disbursement' | 'reminder' | 'due_today' | 'overdue' | 'receipt' | 'manual' | 'test';
  status: 'sent' | 'failed' | 'simulated';
  provider: string;
  error?: string;
  loanId?: string;
  createdAt?: TimestampLike;
}

export interface AuditEntry {
  id: string;
  action: string;
  actorUid: string;
  actorName: string;
  targetType?: string;
  targetId?: string;
  summary: string;
  createdAt?: TimestampLike;
}

export interface Invoice {
  id: string;
  plan: PlanId;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  periodStart?: TimestampLike;
  periodEnd?: TimestampLike;
  testMode: boolean;
  createdAt?: TimestampLike;
  paidAt?: TimestampLike;
}

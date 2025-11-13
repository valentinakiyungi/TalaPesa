
import { z } from 'zod';

export const SignupFormSchema = z.object({
  name: z.string().min(2).trim(),
  email: z.string().email().trim(),
  password: z.string()
    .min(8)
    .regex(/[a-zA-Z]/)
    .regex(/[0-9]/)
    .regex(/[^a-zA-Z0-9]/)
    .trim(),
});

export const LoginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type FormState =
  | { errors?: { name?: string[]; email?: string[]; password?: string[] }; message?: string }
  | undefined;

// === USER & AUTH ===
export type UserDetails = {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role?: string;
  vendorId?: string;
  vendorRole?: VendorRole;
  storeId?: string;
  storeIds?: string[];
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type VendorRole = "vendor_owner" | "vendor_supervisor" | "front_officer";

// === CUSTOMER ===
export type Customer = {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  address?: string;
  dateOfBirth: Date;
  nextOfKin: NextOfKin[];
  customerDocumentsId: string;
  customerFinancialDetailsId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

export type NextOfKin = {
  firstName: string;
  middleName?: string;
  lastName: string;
  relation: string;
  email: string;
  phone: string;
  address?: string;
};

// === LOAN & FINANCING ===
export type Loan = {
  id: string;
  salerId: string;
  salersName: string;
  customerId: string;
  customerPhoneNumber: string;
  customerEmail: string;
  customerDisplayName: string;
  principal: number;
  totalPaymentAmount: number;
  balanceDue: number;
  status: 'active' | 'completed' | 'defaulted' | 'canceled' | 'overdue';
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

// === DEVICE ===
export type Phone = {
  id: string;
  model: string;
  brand: string;
  imei: string;
  price: number;
  downPayment: number;
  totalPrice: number;
  status: 'available' | 'financed' | 'returned' | 'faulty';
  createdAt: Date;
  updatedAt: Date;
  addedBy: string;
};

// === CONTRACT ===
export type Contract = {
  id: string;
  customerId: string;
  contractNumber: string;
  signedBy: string;
  signedAt: Date;
  contractPdfUrl: string;
  status: 'pending' | 'signed' | 'active' | 'canceled';
  phoneId: string;
  createdAt: Date;
  updatedAt: Date;
  addedBy: string;
};

// === VENDOR & STORE ===
export type Vendor = {
  id: string;
  companyId: string;
  name: string;
  phone?: string;
  email?: string;
  status?: 'active' | 'inactive';
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type Store = {
  id: string;
  name: string;
  companyId: string;
  vendorId?: string;
  address?: Address;
  phone?: string;
  status?: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
};

export type Address = {
  city?: string;
  line1?: string;
  line2?: string;
  postalCode?: string;
  state?: string;
  country?: string;
};

// === DASHBOARD ===
export type DashboardKPIs = {
  asOf: string;
  totalFinanced: number;
  totalCollected: number;
  outstandingBalance: number;
  activeLoans: number;
  newLoans: number;
  collectionRate: number;
};

export type LeaderboardEntry = {
  id: string;
  label: string;
  loansCount: number;
  totalFinanced: number;
  totalCollected: number;
  collectionRate: number;
};

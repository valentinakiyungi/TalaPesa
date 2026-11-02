import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const money = z.coerce.number().finite().nonnegative();
const trimmed = (max = 200) => z.string().trim().max(max);

export const contactSchema = z.object({
  name: trimmed(120).min(2),
  phone: trimmed(30).min(9),
  relation: trimmed(60).optional().default(''),
  nationalId: trimmed(40).optional().default(''),
  address: trimmed(200).optional().default(''),
});

export const createOrgSchema = z.object({
  name: trimmed(120).min(2),
  phone: trimmed(30).optional().default(''),
  city: trimmed(80).optional().default(''),
  smsLanguage: z.enum(['sw', 'en']).default('sw'),
  userName: trimmed(120).min(2),
});

export const customerSchema = z.object({
  firstName: trimmed(60).min(1),
  lastName: trimmed(60).min(1),
  phone: trimmed(30).min(9),
  altPhone: trimmed(30).optional().default(''),
  email: z.union([z.literal(''), z.string().trim().email()]).optional().default(''),
  nationalId: trimmed(40).optional().default(''),
  gender: z.enum(['male', 'female', 'other', '']).optional().default(''),
  dateOfBirth: z.union([z.literal(''), isoDate]).optional().default(''),
  address: trimmed(200).optional().default(''),
  region: trimmed(60).optional().default(''),
  occupation: trimmed(100).optional().default(''),
  employer: trimmed(100).optional().default(''),
  monthlyIncome: money.optional().default(0),
  nextOfKin: contactSchema.nullable().optional().default(null),
  guarantor: contactSchema.nullable().optional().default(null),
  notes: trimmed(1000).optional().default(''),
});
export type CustomerInput = z.infer<typeof customerSchema>;

export const productSchema = z
  .object({
    name: trimmed(80).min(2),
    description: trimmed(300).optional().default(''),
    interestRate: z.coerce.number().min(0).max(100),
    ratePeriod: z.enum(['month', 'loan']),
    interestMethod: z.enum(['flat', 'reducing']),
    frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
    minAmount: money,
    maxAmount: money,
    minInstallments: z.coerce.number().int().min(1).max(520),
    maxInstallments: z.coerce.number().int().min(1).max(520),
    processingFeePercent: z.coerce.number().min(0).max(50),
    lateFeeType: z.enum(['none', 'percent', 'fixed']),
    lateFeeValue: z.coerce.number().min(0),
    graceDays: z.coerce.number().int().min(0).max(90),
    active: z.boolean().default(true),
  })
  .refine((p) => p.maxAmount >= p.minAmount, { message: 'maxAmount must be >= minAmount', path: ['maxAmount'] })
  .refine((p) => p.maxInstallments >= p.minInstallments, { message: 'maxInstallments must be >= minInstallments', path: ['maxInstallments'] })
  .refine((p) => !(p.interestMethod === 'reducing' && p.ratePeriod === 'loan'), {
    message: 'Reducing balance needs a monthly rate',
    path: ['ratePeriod'],
  });
export type ProductInput = z.infer<typeof productSchema>;

export const loanApplicationSchema = z.object({
  customerId: z.string().min(1),
  productId: z.string().min(1),
  principal: z.coerce.number().int().positive(),
  installments: z.coerce.number().int().min(1).max(520),
  purpose: trimmed(300).optional().default(''),
  collateral: trimmed(300).optional().default(''),
  guarantor: contactSchema.nullable().optional().default(null),
});
export type LoanApplicationInput = z.infer<typeof loanApplicationSchema>;

export const paymentMethods = ['cash', 'mpesa', 'tigopesa', 'airtelmoney', 'halopesa', 'bank', 'selcom', 'other'] as const;

export const loanActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve') }),
  z.object({ action: z.literal('reject'), reason: trimmed(300).min(2) }),
  z.object({
    action: z.literal('disburse'),
    date: isoDate,
    method: z.enum(paymentMethods),
    reference: trimmed(80).optional().default(''),
    sendSms: z.boolean().optional().default(true),
  }),
  z.object({ action: z.literal('write_off'), reason: trimmed(300).min(2) }),
  z.object({ action: z.literal('remind') }),
  z.object({ action: z.literal('refresh') }),
]);
export type LoanAction = z.infer<typeof loanActionSchema>;

export const paymentSchema = z.object({
  loanId: z.string().min(1),
  amount: z.coerce.number().int().positive(),
  method: z.enum(paymentMethods),
  reference: trimmed(80).optional().default(''),
  date: isoDate,
  note: trimmed(300).optional().default(''),
  sendReceipt: z.boolean().optional().default(true),
});
export type PaymentInputBody = z.infer<typeof paymentSchema>;

export const paymentRequestSchema = z.object({
  amount: z.coerce.number().int().positive(),
  phone: trimmed(30).min(9),
});

export const smsSchema = z.object({
  to: trimmed(30).min(9),
  message: trimmed(640).min(2),
  loanId: z.string().optional(),
});

export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(['admin', 'officer', 'viewer']),
});

export const memberUpdateSchema = z.object({
  role: z.enum(['admin', 'officer', 'viewer']).optional(),
  status: z.enum(['active', 'disabled']).optional(),
});

export const orgSettingsSchema = z.object({
  name: trimmed(120).min(2).optional(),
  email: z.union([z.literal(''), z.string().trim().email()]).optional(),
  phone: trimmed(30).optional(),
  address: trimmed(200).optional(),
  city: trimmed(80).optional(),
  registrationNumber: trimmed(80).optional(),
  settings: z
    .object({
      smsEnabled: z.boolean(),
      reminderDaysBefore: z.coerce.number().int().min(0).max(14),
      smsLanguage: z.enum(['sw', 'en']),
      templates: z.object({
        disbursement: trimmed(480),
        reminder: trimmed(480),
        dueToday: trimmed(480),
        overdue: trimmed(480),
        receipt: trimmed(480),
      }),
      loanPrefix: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{1,6}$/),
      requireGuarantor: z.boolean(),
      maxActiveLoansPerCustomer: z.coerce.number().int().min(1).max(20),
    })
    .partial()
    .optional(),
});

export const integrationsSchema = z.object({
  selcom: z
    .object({
      apiKey: z.string().trim().optional().default(''),
      apiSecret: z.string().trim().optional().default(''),
      vendor: z.string().trim().optional().default(''),
      live: z.boolean().default(false),
    })
    .nullable()
    .optional(),
  sms: z
    .object({
      provider: z.enum(['beem', 'africastalking']),
      apiKey: z.string().trim().optional().default(''),
      apiSecret: z.string().trim().optional().default(''),
      username: z.string().trim().optional().default(''),
      senderId: z.string().trim().max(11).optional().default(''),
    })
    .nullable()
    .optional(),
});

export const profileSchema = z.object({
  name: trimmed(120).min(2),
  phone: trimmed(30).optional().default(''),
});

export const checkoutSchema = z.object({ plan: z.enum(['starter', 'growth', 'pro']) });

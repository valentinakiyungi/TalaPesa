/**
 * TalaPesa loan engine.
 *
 * Pure functions only: no Firebase, no I/O. Everything about money in a loan
 * (repayment schedule, how a payment is split, late fees, overdue status) is
 * computed here so it can be unit tested and reused on server and client.
 *
 * All amounts are whole currency units (TZS has no minor unit in practice).
 * Dates are ISO strings "YYYY-MM-DD" (calendar days, no time zone).
 */

export type Frequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type InterestMethod = 'flat' | 'reducing';
/** "month": rate is % per month. "loan": rate is % charged once for the whole loan (flat only). */
export type RatePeriod = 'month' | 'loan';
export type LateFeeType = 'none' | 'percent' | 'fixed';

export interface LoanTerms {
  principal: number;
  /** Interest rate in percent, e.g. 10 for 10%. */
  interestRate: number;
  ratePeriod: RatePeriod;
  interestMethod: InterestMethod;
  frequency: Frequency;
  /** Number of installments. */
  installments: number;
  /** Date the money was disbursed (YYYY-MM-DD). First installment falls one period later. */
  startDate: string;
}

export interface PenaltyRules {
  lateFeeType: LateFeeType;
  /** Percent of the installment amount (percent) or a fixed amount (fixed). */
  lateFeeValue: number;
  /** Days after the due date before a late fee is charged and the installment counts as overdue. */
  graceDays: number;
}

export interface Installment {
  n: number;
  dueDate: string;
  principal: number;
  interest: number;
  /** principal + interest */
  amount: number;
  penalty: number;
  paidPrincipal: number;
  paidInterest: number;
  paidPenalty: number;
  /** Date the installment became fully paid. */
  paidDate?: string | null;
}

export type InstallmentStatus = 'paid' | 'partial' | 'due' | 'overdue' | 'upcoming';

export interface PaymentInput {
  id: string;
  amount: number;
  /** YYYY-MM-DD */
  date: string;
}

export interface Allocation {
  principal: number;
  interest: number;
  penalty: number;
}

export interface LoanState {
  schedule: Installment[];
  totalPrincipal: number;
  totalInterest: number;
  totalPenalty: number;
  totalDue: number;
  amountPaid: number;
  balance: number;
  principalOutstanding: number;
  /** Amount past due (including late fees) as of the evaluation date. */
  arrears: number;
  daysOverdue: number;
  nextDueDate: string | null;
  nextDueAmount: number;
  isClosed: boolean;
  isOverdue: boolean;
  allocations: Record<string, Allocation>;
}

const PERIOD_DAYS: Record<Frequency, number> = { daily: 1, weekly: 7, biweekly: 14, monthly: 30 };

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = parseDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDate(d);
}

/** Adds calendar months, clamping to the last day of the month (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(iso: string, months: number): string {
  const d = parseDate(iso);
  const day = d.getUTCDate();
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return formatDate(target);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parseDate(toIso).getTime() - parseDate(fromIso).getTime()) / 86_400_000);
}

export function dueDateFor(startDate: string, frequency: Frequency, n: number): string {
  if (frequency === 'monthly') return addMonths(startDate, n);
  return addDays(startDate, PERIOD_DAYS[frequency] * n);
}

export function todayIso(timeZone = 'Africa/Dar_es_Salaam'): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------

/** Loan length expressed in months, used to price flat-rate loans. */
export function durationInMonths(frequency: Frequency, installments: number): number {
  if (frequency === 'monthly') return installments;
  return (PERIOD_DAYS[frequency] * installments) / 30;
}

/** Splits `total` into `n` whole-unit parts; the rounding remainder goes to the last part. */
function splitEvenly(total: number, n: number): number[] {
  const base = Math.floor(total / n);
  const parts = Array.from({ length: n }, () => base);
  parts[n - 1] += total - base * n;
  return parts;
}

export function validateTerms(t: LoanTerms): string | null {
  if (!Number.isFinite(t.principal) || t.principal <= 0) return 'principal_invalid';
  if (!Number.isInteger(t.installments) || t.installments < 1 || t.installments > 520) return 'installments_invalid';
  if (!Number.isFinite(t.interestRate) || t.interestRate < 0 || t.interestRate > 100) return 'rate_invalid';
  if (t.interestMethod === 'reducing' && t.ratePeriod === 'loan') return 'reducing_requires_monthly_rate';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t.startDate)) return 'start_date_invalid';
  return null;
}

export function buildSchedule(t: LoanTerms): Installment[] {
  const err = validateTerms(t);
  if (err) throw new Error(err);
  const principal = Math.round(t.principal);
  const n = t.installments;
  const rate = t.interestRate / 100;

  let principalParts: number[];
  let interestParts: number[];

  if (t.interestMethod === 'flat') {
    const months = t.ratePeriod === 'loan' ? 1 : durationInMonths(t.frequency, n);
    const totalInterest = Math.round(principal * rate * months);
    principalParts = splitEvenly(principal, n);
    interestParts = splitEvenly(totalInterest, n);
  } else {
    // Declining balance with equal installments (annuity).
    const periodRate = rate * (t.frequency === 'monthly' ? 1 : PERIOD_DAYS[t.frequency] / 30);
    principalParts = [];
    interestParts = [];
    if (periodRate === 0) {
      principalParts = splitEvenly(principal, n);
      interestParts = Array.from({ length: n }, () => 0);
    } else {
      const payment = Math.round((principal * periodRate) / (1 - Math.pow(1 + periodRate, -n)));
      let remaining = principal;
      for (let i = 0; i < n; i++) {
        const interest = Math.round(remaining * periodRate);
        let principalPart = i === n - 1 ? remaining : Math.min(remaining, payment - interest);
        if (principalPart < 0) principalPart = 0;
        remaining -= principalPart;
        principalParts.push(principalPart);
        interestParts.push(interest);
      }
    }
  }

  return principalParts.map((p, i) => ({
    n: i + 1,
    dueDate: dueDateFor(t.startDate, t.frequency, i + 1),
    principal: p,
    interest: interestParts[i],
    amount: p + interestParts[i],
    penalty: 0,
    paidPrincipal: 0,
    paidInterest: 0,
    paidPenalty: 0,
    paidDate: null,
  }));
}

export function summarizeSchedule(schedule: Installment[]) {
  const totalPrincipal = schedule.reduce((s, i) => s + i.principal, 0);
  const totalInterest = schedule.reduce((s, i) => s + i.interest, 0);
  return {
    totalPrincipal,
    totalInterest,
    totalRepayable: totalPrincipal + totalInterest,
    firstInstallment: schedule[0]?.amount ?? 0,
    lastDueDate: schedule[schedule.length - 1]?.dueDate ?? null,
  };
}

// ---------------------------------------------------------------------------
// Payments and penalties
// ---------------------------------------------------------------------------

export function installmentOutstanding(i: Installment): number {
  return i.amount + i.penalty - i.paidPrincipal - i.paidInterest - i.paidPenalty;
}

function lateFeeFor(i: Installment, rules: PenaltyRules): number {
  if (rules.lateFeeType === 'percent') return Math.round((i.amount * rules.lateFeeValue) / 100);
  if (rules.lateFeeType === 'fixed') return Math.round(rules.lateFeeValue);
  return 0;
}

/** Charges a one-off late fee on every installment whose grace period ended on or before `date` and is still unpaid. */
function chargePenaltiesUpTo(schedule: Installment[], date: string, rules: PenaltyRules, charged: Set<number>) {
  for (const inst of schedule) {
    if (charged.has(inst.n)) continue;
    const trigger = addDays(inst.dueDate, rules.graceDays + 1);
    if (trigger > date) continue;
    charged.add(inst.n);
    const principalAndInterestLeft = inst.amount - inst.paidPrincipal - inst.paidInterest;
    if (principalAndInterestLeft > 0) inst.penalty += lateFeeFor(inst, rules);
  }
}

/** Oldest installment first; within an installment: late fee, then interest, then principal. */
function allocate(schedule: Installment[], amount: number, date: string): Allocation & { unapplied: number } {
  const out = { principal: 0, interest: 0, penalty: 0, unapplied: 0 };
  let left = amount;
  for (const inst of schedule) {
    if (left <= 0) break;
    const pen = Math.min(left, inst.penalty - inst.paidPenalty);
    inst.paidPenalty += pen; out.penalty += pen; left -= pen;
    const int = Math.min(left, inst.interest - inst.paidInterest);
    inst.paidInterest += int; out.interest += int; left -= int;
    const pr = Math.min(left, inst.principal - inst.paidPrincipal);
    inst.paidPrincipal += pr; out.principal += pr; left -= pr;
    if (installmentOutstanding(inst) === 0 && !inst.paidDate) inst.paidDate = date;
  }
  out.unapplied = left;
  return out;
}

/**
 * Rebuilds the full loan position from the original schedule and every
 * completed payment, evaluated on `asOf`. Replaying from scratch keeps the
 * result deterministic, so reversing a payment is just "replay without it".
 */
export function computeLoanState(
  baseSchedule: Installment[],
  payments: PaymentInput[],
  rules: PenaltyRules,
  asOf: string,
): LoanState {
  const schedule: Installment[] = baseSchedule.map((i) => ({
    ...i, penalty: 0, paidPrincipal: 0, paidInterest: 0, paidPenalty: 0, paidDate: null,
  }));
  const charged = new Set<number>();
  const allocations: Record<string, Allocation> = {};
  const ordered = [...payments].sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date)));

  for (const p of ordered) {
    chargePenaltiesUpTo(schedule, p.date, rules, charged);
    const a = allocate(schedule, Math.round(p.amount), p.date);
    allocations[p.id] = { principal: a.principal, interest: a.interest, penalty: a.penalty };
  }
  // A fully repaid loan accrues nothing further.
  const settledSoFar = schedule.every((i) => installmentOutstanding(i) === 0);
  if (!settledSoFar) chargePenaltiesUpTo(schedule, asOf, rules, charged);

  const totalPrincipal = schedule.reduce((s, i) => s + i.principal, 0);
  const totalInterest = schedule.reduce((s, i) => s + i.interest, 0);
  const totalPenalty = schedule.reduce((s, i) => s + i.penalty, 0);
  const amountPaid = schedule.reduce((s, i) => s + i.paidPrincipal + i.paidInterest + i.paidPenalty, 0);
  const totalDue = totalPrincipal + totalInterest + totalPenalty;
  const balance = totalDue - amountPaid;
  const principalOutstanding = totalPrincipal - schedule.reduce((s, i) => s + i.paidPrincipal, 0);

  let arrears = 0;
  let oldestOverdue: string | null = null;
  for (const inst of schedule) {
    const out = installmentOutstanding(inst);
    if (out > 0 && inst.dueDate < asOf) {
      arrears += out;
      if (!oldestOverdue) oldestOverdue = inst.dueDate;
    }
  }
  const daysOverdue = oldestOverdue ? daysBetween(oldestOverdue, asOf) : 0;
  const next = schedule.find((i) => installmentOutstanding(i) > 0) ?? null;

  return {
    schedule,
    totalPrincipal,
    totalInterest,
    totalPenalty,
    totalDue,
    amountPaid,
    balance,
    principalOutstanding,
    arrears,
    daysOverdue,
    nextDueDate: next ? next.dueDate : null,
    nextDueAmount: next ? installmentOutstanding(next) : 0,
    isClosed: balance <= 0,
    isOverdue: daysOverdue > rules.graceDays,
    allocations,
  };
}

export function installmentStatus(i: Installment, asOf: string): InstallmentStatus {
  const out = installmentOutstanding(i);
  if (out <= 0) return 'paid';
  if (i.dueDate < asOf) return 'overdue';
  if (i.dueDate === asOf) return 'due';
  if (i.paidPrincipal + i.paidInterest + i.paidPenalty > 0) return 'partial';
  return 'upcoming';
}

// ---------------------------------------------------------------------------
// Portfolio metrics
// ---------------------------------------------------------------------------

export interface PortfolioLoan {
  status: string;
  principalOutstanding?: number;
  balance?: number;
  daysOverdue?: number;
}

export type AgingBucket = 'current' | '1-30' | '31-60' | '61-90' | '90+';

export function agingBucket(daysOverdue: number): AgingBucket {
  if (daysOverdue <= 0) return 'current';
  if (daysOverdue <= 30) return '1-30';
  if (daysOverdue <= 60) return '31-60';
  if (daysOverdue <= 90) return '61-90';
  return '90+';
}

/** Portfolio at risk: share of outstanding principal in loans more than `days` overdue (0..1). */
export function portfolioAtRisk(loans: PortfolioLoan[], days = 30): number {
  const live = loans.filter((l) => l.status === 'active' || l.status === 'overdue');
  const total = live.reduce((s, l) => s + (l.principalOutstanding ?? 0), 0);
  if (total === 0) return 0;
  const risk = live.filter((l) => (l.daysOverdue ?? 0) > days).reduce((s, l) => s + (l.principalOutstanding ?? 0), 0);
  return risk / total;
}

/** Fills {placeholders} in a message template. Unknown placeholders are left as-is. */
export function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, key: string) => (key in values ? String(values[key]) : m));
}

/** Normalises a Tanzanian (or other) phone number to international digits, e.g. 0712 345 678 -> 255712345678. */
export function normalizePhone(raw: string, defaultCountryCode = '255'): string {
  let d = (raw || '').replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  else if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = defaultCountryCode + d.slice(1);
  else if (d.length === 9) d = defaultCountryCode + d;
  return d.replace(/\D/g, '');
}

export function isValidPhone(raw: string): boolean {
  const d = normalizePhone(raw);
  return d.length >= 10 && d.length <= 15;
}

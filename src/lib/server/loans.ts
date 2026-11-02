import 'server-only';
import { FieldValue, type DocumentReference, type Transaction } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { computeLoanState, fillTemplate, type PaymentInput } from '@/lib/engine/loan';
import { formatNumber } from '@/lib/utils';
import type { Loan, LoanStatus, Organization, Payment } from '@/lib/types';
import type { OrgContext } from './context';

/** Atomically increments `counters.<field>` on the org and returns the new value. */
export async function nextCounter(tx: Transaction, orgRef: DocumentReference, field: 'loans' | 'customers' | 'receipts'): Promise<number> {
  const snap = await tx.get(orgRef);
  const current = Number(snap.get(`counters.${field}`) || 0);
  const next = current + 1;
  tx.update(orgRef, { [`counters.${field}`]: next });
  return next;
}

export function pad(n: number, width = 6): string {
  return String(n).padStart(width, '0');
}

/** Recalculates balances, late fees and status from the loan's base schedule and its completed payments. */
export function recomputeLoan(loan: Loan, payments: Pick<Payment, 'id' | 'amount' | 'date' | 'status'>[], asOf: string) {
  const inputs: PaymentInput[] = payments.filter((p) => p.status === 'completed').map((p) => ({ id: p.id, amount: p.amount, date: p.date }));
  const state = computeLoanState(
    loan.baseSchedule,
    inputs,
    { lateFeeType: loan.lateFeeType, lateFeeValue: loan.lateFeeValue, graceDays: loan.graceDays },
    asOf,
  );
  let status: LoanStatus = loan.status;
  if (loan.status === 'active' || loan.status === 'overdue' || loan.status === 'closed') {
    status = state.isClosed ? 'closed' : state.isOverdue ? 'overdue' : 'active';
  }
  const lastPaymentDate = inputs.length ? inputs.map((p) => p.date).sort().slice(-1)[0] : null;
  const closedDate = status === 'closed' ? (loan.closedDate ?? lastPaymentDate ?? asOf) : null;
  return {
    state,
    update: {
      schedule: state.schedule,
      totalPenalty: state.totalPenalty,
      totalDue: state.totalDue,
      amountPaid: state.amountPaid,
      balance: state.balance,
      principalOutstanding: state.principalOutstanding,
      arrears: state.arrears,
      daysOverdue: state.daysOverdue,
      nextDueDate: state.nextDueDate,
      nextDueAmount: state.nextDueAmount,
      status,
      closedDate,
      lastPaymentDate,
      updatedAt: FieldValue.serverTimestamp(),
    },
  };
}

export async function audit(
  ctx: Pick<OrgContext, 'orgId' | 'uid' | 'name'>,
  action: string,
  summary: string,
  target?: { type: string; id: string },
) {
  await adminDb.collection(`orgs/${ctx.orgId}/audit`).add({
    action,
    summary,
    actorUid: ctx.uid,
    actorName: ctx.name,
    targetType: target?.type ?? null,
    targetId: target?.id ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export function auditInTx(tx: Transaction, ctx: Pick<OrgContext, 'orgId' | 'uid' | 'name'>, action: string, summary: string, target?: { type: string; id: string }) {
  tx.set(adminDb.collection(`orgs/${ctx.orgId}/audit`).doc(), {
    action,
    summary,
    actorUid: ctx.uid,
    actorName: ctx.name,
    targetType: target?.type ?? null,
    targetId: target?.id ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export type TemplateKind = keyof Organization['settings']['templates'];

export function renderSms(org: Organization, kind: TemplateKind, loan: Pick<Loan, 'customerName' | 'loanNumber'>, extra: Record<string, string | number>) {
  const tpl = org.settings?.templates?.[kind] || '';
  return fillTemplate(tpl, {
    name: loan.customerName.split(' ')[0] || loan.customerName,
    fullName: loan.customerName,
    loanNumber: loan.loanNumber,
    orgName: org.name,
    currency: org.settings?.currency || 'TZS',
    ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, typeof v === 'number' ? formatNumber(v) : v])),
  });
}

export async function loadLoanPayments(orgId: string, loanId: string, tx?: Transaction) {
  const q = adminDb.collection(`orgs/${orgId}/payments`).where('loanId', '==', loanId);
  const snap = tx ? await tx.get(q) : await q.get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Payment, 'id'>) }));
}

/** Picks the right reminder text for a live loan on `today`. */
export function reminderFor(org: Organization, loan: Loan, today: string): { message: string; kind: 'overdue' | 'due_today' | 'reminder' } {
  if (loan.daysOverdue > 0 && loan.arrears > 0) {
    return { kind: 'overdue', message: renderSms(org, 'overdue', loan, { amount: loan.arrears, days: loan.daysOverdue }) };
  }
  if (loan.nextDueDate === today) {
    return { kind: 'due_today', message: renderSms(org, 'dueToday', loan, { amount: loan.nextDueAmount, dueDate: loan.nextDueDate }) };
  }
  return { kind: 'reminder', message: renderSms(org, 'reminder', loan, { amount: loan.nextDueAmount, dueDate: loan.nextDueDate ?? '' }) };
}

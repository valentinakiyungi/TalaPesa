import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { computeLoanState, todayIso } from '@/lib/engine/loan';
import type { Loan, Organization, Payment, PaymentMethod } from '@/lib/types';
import { badRequest, notFound } from './http';
import { sendSms } from './integrations';
import { auditInTx, loadLoanPayments, nextCounter, pad, recomputeLoan, renderSms } from './loans';

export interface Actor {
  orgId: string;
  uid: string;
  name: string;
}

export interface RecordPaymentInput {
  loanId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  date: string;
  note?: string;
  source: 'manual' | 'selcom';
  sendReceipt: boolean;
  /** Idempotency key: a payment with this id is only recorded once (used by webhooks). */
  idempotencyKey?: string;
}

const LIVE = new Set(['active', 'overdue']);

export async function recordPayment(org: Organization, actor: Actor, input: RecordPaymentInput) {
  const orgRef = adminDb.doc(`orgs/${org.id}`);
  const loanRef = orgRef.collection('loans').doc(input.loanId);
  const payRef = input.idempotencyKey ? orgRef.collection('payments').doc(input.idempotencyKey) : orgRef.collection('payments').doc();
  const today = todayIso(org.settings?.timeZone);
  if (input.date > today) throw badRequest('future_date', 'Payment date cannot be in the future');

  let receipt = '';
  let loanAfter: Loan | null = null;
  let duplicate = false;

  await adminDb.runTransaction(async (tx) => {
    const [loanSnap, existingPay] = await Promise.all([tx.get(loanRef), tx.get(payRef)]);
    if (existingPay.exists) {
      duplicate = true;
      return;
    }
    if (!loanSnap.exists) throw notFound('loan_not_found', 'Loan not found');
    const loan = { id: loanSnap.id, ...loanSnap.data() } as Loan;
    if (!LIVE.has(loan.status)) throw badRequest('loan_not_active', 'Payments can only be recorded on active loans');
    if (loan.disbursedDate && input.date < loan.disbursedDate) throw badRequest('before_disbursement', 'Payment date is before the loan was disbursed');

    const payments = await loadLoanPayments(org.id, loan.id, tx);
    // Check the payment fits within what is owed at that point in time.
    const probe = computeLoanState(
      loan.baseSchedule,
      [...payments.filter((p) => p.status === 'completed').map((p) => ({ id: p.id, amount: p.amount, date: p.date })), { id: payRef.id, amount: input.amount, date: input.date }],
      { lateFeeType: loan.lateFeeType, lateFeeValue: loan.lateFeeValue, graceDays: loan.graceDays },
      today,
    );
    const alloc = probe.allocations[payRef.id];
    const applied = alloc.principal + alloc.interest + alloc.penalty;
    if (applied < input.amount) {
      throw badRequest('overpayment', `Amount exceeds the outstanding balance (${applied.toLocaleString('en-US')} can be applied)`, { maxAmount: applied });
    }

    const n = await nextCounter(tx, orgRef, 'receipts');
    receipt = `R-${pad(n, 7)}`;
    const payment: Omit<Payment, 'id'> = {
      loanId: loan.id,
      loanNumber: loan.loanNumber,
      customerId: loan.customerId,
      customerName: loan.customerName,
      amount: input.amount,
      method: input.method,
      reference: input.reference || '',
      date: input.date,
      status: 'completed',
      allocation: alloc,
      receiptNumber: receipt,
      note: input.note || '',
      receivedBy: actor.uid,
      receivedByName: actor.name,
      source: input.source,
    };
    tx.set(payRef, { ...payment, createdAt: FieldValue.serverTimestamp() });

    const all = [...payments, { id: payRef.id, amount: input.amount, date: input.date, status: 'completed' as const }];
    const { update } = recomputeLoan(loan, all, today);
    tx.update(loanRef, update);

    const custRef = orgRef.collection('customers').doc(loan.customerId);
    const custUpdate: Record<string, unknown> = { 'stats.totalRepaid': FieldValue.increment(input.amount), updatedAt: FieldValue.serverTimestamp() };
    if (update.status === 'closed') custUpdate['stats.activeLoans'] = FieldValue.increment(-1);
    tx.update(custRef, custUpdate);

    auditInTx(tx, actor, 'payment.recorded', `${input.amount.toLocaleString('en-US')} received on ${loan.loanNumber} (${receipt})${update.status === 'closed' ? ', loan fully repaid' : ''}`, { type: 'loan', id: loan.id });
    loanAfter = { ...loan, ...(update as unknown as Partial<Loan>) };
  });

  if (duplicate) return { paymentId: payRef.id, duplicate: true as const };

  const loan = loanAfter as Loan | null;
  if (input.sendReceipt && loan) {
    await sendSms(org.id, {
      to: loan.customerPhone,
      kind: 'receipt',
      loanId: loan.id,
      customerId: loan.customerId,
      message: renderSms(org, 'receipt', loan, { amount: input.amount, balance: loan.balance, receipt }),
    });
  }
  return { paymentId: payRef.id, receiptNumber: receipt, balance: loan?.balance ?? 0, status: loan?.status };
}

export async function reversePayment(org: Organization, actor: Actor, paymentId: string, reason: string) {
  const orgRef = adminDb.doc(`orgs/${org.id}`);
  const payRef = orgRef.collection('payments').doc(paymentId);
  const today = todayIso(org.settings?.timeZone);

  await adminDb.runTransaction(async (tx) => {
    const paySnap = await tx.get(payRef);
    if (!paySnap.exists) throw notFound();
    const pay = { id: paySnap.id, ...paySnap.data() } as Payment;
    if (pay.status !== 'completed') throw badRequest('already_reversed', 'This payment was already reversed');
    const loanRef = orgRef.collection('loans').doc(pay.loanId);
    const loanSnap = await tx.get(loanRef);
    if (!loanSnap.exists) throw notFound('loan_not_found');
    const loan = { id: loanSnap.id, ...loanSnap.data() } as Loan;
    if (!['active', 'overdue', 'closed'].includes(loan.status)) throw badRequest('loan_locked', 'Payments on this loan can no longer be reversed');
    const payments = await loadLoanPayments(org.id, loan.id, tx);

    tx.update(payRef, { status: 'reversed', reversedReason: reason, reversedBy: actor.uid, reversedAt: FieldValue.serverTimestamp() });
    const remaining = payments.filter((p) => p.id !== pay.id);
    const { update } = recomputeLoan(loan, remaining, today);
    tx.update(loanRef, update);

    const custUpdate: Record<string, unknown> = { 'stats.totalRepaid': FieldValue.increment(-pay.amount), updatedAt: FieldValue.serverTimestamp() };
    if (loan.status === 'closed' && update.status !== 'closed') custUpdate['stats.activeLoans'] = FieldValue.increment(1);
    tx.update(orgRef.collection('customers').doc(loan.customerId), custUpdate);
    auditInTx(tx, actor, 'payment.reversed', `Reversed ${pay.amount.toLocaleString('en-US')} (${pay.receiptNumber}) on ${loan.loanNumber}: ${reason}`, { type: 'loan', id: loan.id });
  });
}

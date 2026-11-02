import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { buildSchedule, summarizeSchedule, todayIso } from '@/lib/engine/loan';
import { can } from '@/lib/plans';
import { loanActionSchema } from '@/lib/schemas';
import { requireOrg } from '@/lib/server/context';
import { sendSms } from '@/lib/server/integrations';
import { badRequest, forbidden, notFound, parseBody, route } from '@/lib/server/http';
import { auditInTx, loadLoanPayments, recomputeLoan, reminderFor, renderSms } from '@/lib/server/loans';
import type { Loan } from '@/lib/types';

export const dynamic = 'force-dynamic';

const PERM = {
  approve: 'loans.approve',
  reject: 'loans.approve',
  disburse: 'loans.disburse',
  write_off: 'loans.writeoff',
  remind: 'sms.send',
  refresh: 'payments.record',
} as const;

export const POST = route<{ id: string }>(async (req, { params }) => {
  const body = await parseBody(req, loanActionSchema);
  const ctx = await requireOrg(req);
  if (!can(ctx.role, PERM[body.action])) throw forbidden('permission_denied', 'Your role does not allow this action');

  const ref = adminDb.doc(`orgs/${ctx.orgId}/loans/${params.id}`);
  const today = todayIso(ctx.org.settings?.timeZone);

  if (body.action === 'remind') {
    const snap = await ref.get();
    if (!snap.exists) throw notFound();
    const loan = { id: snap.id, ...snap.data() } as Loan;
    if (!['active', 'overdue'].includes(loan.status)) throw badRequest('not_active', 'Only active loans can be reminded');
    const r = reminderFor(ctx.org, loan, today);
    const result = await sendSms(ctx.orgId, { to: loan.customerPhone, message: r.message, kind: r.kind, loanId: loan.id, customerId: loan.customerId });
    await ref.update({ lastReminderDate: today });
    return { sms: result.status };
  }

  let smsAfter: { message: string; to: string; loan: Loan } | null = null;

  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw notFound();
    const loan = { id: snap.id, ...snap.data() } as Loan;
    const custRef = adminDb.doc(`orgs/${ctx.orgId}/customers/${loan.customerId}`);
    const target = { type: 'loan', id: loan.id };

    switch (body.action) {
      case 'approve': {
        if (loan.status !== 'pending') throw badRequest('bad_status', 'Only pending loans can be approved');
        tx.update(ref, { status: 'approved', approvedBy: ctx.uid, approvedByName: ctx.name, approvedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
        auditInTx(tx, ctx, 'loan.approved', `Approved loan ${loan.loanNumber}`, target);
        break;
      }
      case 'reject': {
        if (loan.status !== 'pending' && loan.status !== 'approved') throw badRequest('bad_status', 'This loan cannot be rejected');
        tx.update(ref, { status: 'rejected', rejectedReason: body.reason, balance: 0, principalOutstanding: 0, updatedAt: FieldValue.serverTimestamp() });
        auditInTx(tx, ctx, 'loan.rejected', `Rejected loan ${loan.loanNumber}: ${body.reason}`, target);
        break;
      }
      case 'disburse': {
        if (loan.status !== 'approved') throw badRequest('bad_status', 'Approve the loan before disbursing');
        if (body.date > today) throw badRequest('future_date', 'Disbursement date cannot be in the future');
        const schedule = buildSchedule({
          principal: loan.principal,
          interestRate: loan.interestRate,
          ratePeriod: loan.ratePeriod,
          interestMethod: loan.interestMethod,
          frequency: loan.frequency,
          installments: loan.installments,
          startDate: body.date,
        });
        const sum = summarizeSchedule(schedule);
        const disbursed: Loan = { ...loan, status: 'active', baseSchedule: schedule, schedule, totalInterest: sum.totalInterest };
        const { update } = recomputeLoan(disbursed, [], today);
        tx.update(ref, {
          ...update,
          baseSchedule: schedule,
          totalInterest: sum.totalInterest,
          disbursedDate: body.date,
          disbursementMethod: body.method,
          disbursementReference: body.reference,
          disbursedBy: ctx.uid,
        });
        tx.update(custRef, {
          'stats.activeLoans': FieldValue.increment(1),
          'stats.totalBorrowed': FieldValue.increment(loan.principal),
          updatedAt: FieldValue.serverTimestamp(),
        });
        auditInTx(tx, ctx, 'loan.disbursed', `Disbursed loan ${loan.loanNumber} (${loan.principal.toLocaleString('en-US')}) on ${body.date}`, target);
        if (body.sendSms) {
          smsAfter = {
            to: loan.customerPhone,
            loan,
            message: renderSms(ctx.org, 'disbursement', loan, {
              amount: loan.principal,
              installment: schedule[0].amount,
              dueDate: schedule[0].dueDate,
              total: sum.totalRepayable,
            }),
          };
        }
        break;
      }
      case 'write_off': {
        if (loan.status !== 'active' && loan.status !== 'overdue') throw badRequest('bad_status', 'Only active loans can be written off');
        tx.update(ref, { status: 'written_off', writtenOffReason: body.reason, closedDate: today, updatedAt: FieldValue.serverTimestamp() });
        tx.update(custRef, { 'stats.activeLoans': FieldValue.increment(-1), updatedAt: FieldValue.serverTimestamp() });
        auditInTx(tx, ctx, 'loan.written_off', `Wrote off loan ${loan.loanNumber} (balance ${loan.balance.toLocaleString('en-US')}): ${body.reason}`, target);
        break;
      }
      case 'refresh': {
        if (loan.status !== 'active' && loan.status !== 'overdue') return;
        const payments = await loadLoanPayments(ctx.orgId, loan.id, tx);
        const { update } = recomputeLoan(loan, payments, today);
        tx.update(ref, update);
        break;
      }
    }
  });

  if (smsAfter) {
    const s = smsAfter as { message: string; to: string; loan: Loan };
    await sendSms(ctx.orgId, { to: s.to, message: s.message, kind: 'disbursement', loanId: s.loan.id, customerId: s.loan.customerId });
  }
  return { ok: true };
});


import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { buildSchedule, summarizeSchedule, todayIso } from '@/lib/engine/loan';
import { PLANS } from '@/lib/plans';
import { loanApplicationSchema } from '@/lib/schemas';
import { requireOrg } from '@/lib/server/context';
import { badRequest, conflict, notFound, parseBody, route } from '@/lib/server/http';
import { auditInTx, nextCounter, pad } from '@/lib/server/loans';
import type { Customer, LoanProduct } from '@/lib/types';
import { normalizePhone } from '@/lib/engine/loan';

export const dynamic = 'force-dynamic';

const LIVE = ['pending', 'approved', 'active', 'overdue'];

/** Creates a loan application (status "pending"). Money moves only at disbursement. */
export const POST = route(async (req) => {
  const ctx = await requireOrg(req, { permission: 'loans.create' });
  const body = await parseBody(req, loanApplicationSchema);
  const orgPath = `orgs/${ctx.orgId}`;

  const [custSnap, prodSnap] = await Promise.all([
    adminDb.doc(`${orgPath}/customers/${body.customerId}`).get(),
    adminDb.doc(`${orgPath}/products/${body.productId}`).get(),
  ]);
  if (!custSnap.exists) throw notFound('customer_not_found', 'Customer not found');
  if (!prodSnap.exists) throw notFound('product_not_found', 'Loan product not found');
  const customer = { id: custSnap.id, ...custSnap.data() } as Customer;
  const product = { id: prodSnap.id, ...prodSnap.data() } as LoanProduct;

  if (customer.status === 'blacklisted') throw badRequest('customer_blacklisted', 'This customer is blacklisted');
  if (!product.active) throw badRequest('product_inactive', 'This loan product is not available');
  if (body.principal < product.minAmount || body.principal > product.maxAmount) {
    throw badRequest('amount_out_of_range', `Amount must be between ${product.minAmount} and ${product.maxAmount}`);
  }
  if (body.installments < product.minInstallments || body.installments > product.maxInstallments) {
    throw badRequest('installments_out_of_range', `Installments must be between ${product.minInstallments} and ${product.maxInstallments}`);
  }

  const guarantor = body.guarantor ? { ...body.guarantor, phone: normalizePhone(body.guarantor.phone) } : customer.guarantor ?? null;
  if (ctx.org.settings?.requireGuarantor && !guarantor) throw badRequest('guarantor_required', 'A guarantor is required');

  const loansCol = adminDb.collection(`${orgPath}/loans`);
  const [customerLive, orgLive] = await Promise.all([
    loansCol.where('customerId', '==', customer.id).where('status', 'in', LIVE).count().get(),
    loansCol.where('status', 'in', ['approved', 'active', 'overdue']).count().get(),
  ]);
  const maxPerCustomer = ctx.org.settings?.maxActiveLoansPerCustomer ?? 1;
  if (customerLive.data().count >= maxPerCustomer) throw conflict('customer_limit', 'Customer already has the maximum number of active loans');
  const planLimit = PLANS[ctx.org.plan]?.maxActiveLoans ?? 0;
  if (orgLive.data().count >= planLimit) throw conflict('plan_limit', `Your plan allows ${planLimit} active loans`);

  // Expected terms if disbursed today; recalculated on the actual disbursement date.
  const preview = summarizeSchedule(
    buildSchedule({
      principal: body.principal,
      interestRate: product.interestRate,
      ratePeriod: product.ratePeriod,
      interestMethod: product.interestMethod,
      frequency: product.frequency,
      installments: body.installments,
      startDate: todayIso(ctx.org.settings?.timeZone),
    }),
  );
  const processingFee = Math.round((body.principal * (product.processingFeePercent || 0)) / 100);

  const ref = loansCol.doc();
  let loanNumber = '';
  await adminDb.runTransaction(async (tx) => {
    const n = await nextCounter(tx, ctx.orgRef, 'loans');
    loanNumber = `${ctx.org.settings?.loanPrefix || 'TP'}-${pad(n)}`;
    tx.set(ref, {
      loanNumber,
      customerId: customer.id,
      customerName: customer.fullName,
      customerPhone: customer.phone,
      productId: product.id,
      productName: product.name,
      principal: body.principal,
      interestRate: product.interestRate,
      ratePeriod: product.ratePeriod,
      interestMethod: product.interestMethod,
      frequency: product.frequency,
      installments: body.installments,
      processingFee,
      lateFeeType: product.lateFeeType,
      lateFeeValue: product.lateFeeValue,
      graceDays: product.graceDays,
      purpose: body.purpose,
      collateral: body.collateral,
      guarantor,
      totalInterest: preview.totalInterest,
      totalDue: preview.totalRepayable,
      totalPenalty: 0,
      amountPaid: 0,
      balance: preview.totalRepayable,
      principalOutstanding: body.principal,
      arrears: 0,
      daysOverdue: 0,
      nextDueDate: null,
      nextDueAmount: 0,
      schedule: [],
      baseSchedule: [],
      status: 'pending',
      officerId: ctx.uid,
      officerName: ctx.name,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.update(custSnap.ref, { 'stats.loans': FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() });
    auditInTx(tx, ctx, 'loan.created', `Loan ${loanNumber} of ${body.principal.toLocaleString('en-US')} requested for ${customer.fullName}`, { type: 'loan', id: ref.id });
  });

  return { id: ref.id, loanNumber };
});

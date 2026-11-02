import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { normalizePhone, todayIso } from '@/lib/engine/loan';
import { paymentRequestSchema } from '@/lib/schemas';
import { requireOrg } from '@/lib/server/context';
import { appUrl, badRequest, notFound, parseBody, route } from '@/lib/server/http';
import { getIntegrations, liveSelcom } from '@/lib/server/integrations';
import { newOrderId, type PaymentOrder } from '@/lib/server/orders';
import { recordPayment } from '@/lib/server/payments';
import { createOrder, walletPush } from '@/lib/server/selcom';
import type { Loan } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** Sends a mobile-money payment prompt (USSD push) to the customer's phone. */
export const POST = route<{ id: string }>(async (req, { params }) => {
  const ctx = await requireOrg(req, { permission: 'payments.record' });
  const body = await parseBody(req, paymentRequestSchema);
  const loanSnap = await adminDb.doc(`orgs/${ctx.orgId}/loans/${params.id}`).get();
  if (!loanSnap.exists) throw notFound();
  const loan = { id: loanSnap.id, ...loanSnap.data() } as Loan;
  if (loan.status !== 'active' && loan.status !== 'overdue') throw badRequest('loan_not_active', 'Loan is not active');
  if (body.amount > loan.balance) throw badRequest('overpayment', 'Amount is more than the balance');

  const phone = normalizePhone(body.phone);
  const creds = liveSelcom(await getIntegrations(ctx.orgId));
  const orderId = newOrderId();
  const order: PaymentOrder = {
    kind: 'repayment',
    orgId: ctx.orgId,
    loanId: loan.id,
    amount: body.amount,
    phone,
    status: 'pending',
    testMode: !creds,
    createdByUid: ctx.uid,
    createdByName: ctx.name,
  };
  const requestRef = adminDb.doc(`orgs/${ctx.orgId}/paymentRequests/${orderId}`);
  await adminDb.doc(`paymentOrders/${orderId}`).set({ ...order, createdAt: FieldValue.serverTimestamp() });
  await requestRef.set({
    loanId: loan.id,
    loanNumber: loan.loanNumber,
    customerName: loan.customerName,
    phone,
    amount: body.amount,
    status: 'pending',
    testMode: !creds,
    createdByName: ctx.name,
    createdAt: FieldValue.serverTimestamp(),
  });

  if (!creds) {
    // Test mode: simulate the customer approving the prompt.
    const result = await recordPayment(ctx.org, ctx, {
      loanId: loan.id,
      amount: body.amount,
      method: 'selcom',
      reference: `TEST-${orderId}`,
      date: todayIso(ctx.org.settings?.timeZone),
      note: `Test mobile payment from ${phone}`,
      source: 'selcom',
      sendReceipt: true,
      idempotencyKey: `selcom_${orderId}`,
    });
    await adminDb.doc(`paymentOrders/${orderId}`).update({ status: 'completed' });
    await requestRef.update({ status: 'completed', message: 'Simulated (test mode)' });
    return { orderId, testMode: true, status: 'completed', receiptNumber: result.receiptNumber };
  }

  const base = appUrl(req);
  const created = await createOrder(creds, {
    orderId,
    amount: body.amount,
    buyerName: loan.customerName,
    buyerEmail: '',
    buyerPhone: phone,
    webhookUrl: `${base}/api/webhooks/selcom`,
    remarks: `Loan ${loan.loanNumber}`,
  });
  if (!created.ok) {
    const msg = created.raw.message || 'Selcom rejected the order';
    await requestRef.update({ status: 'failed', message: msg });
    await adminDb.doc(`paymentOrders/${orderId}`).update({ status: 'failed' });
    throw badRequest('selcom_error', msg);
  }
  const push = await walletPush(creds, orderId, phone);
  if (!push.ok) {
    const msg = push.raw.message || 'Could not send the payment prompt';
    await requestRef.update({ status: 'failed', message: msg });
    await adminDb.doc(`paymentOrders/${orderId}`).update({ status: 'failed' });
    throw badRequest('selcom_push_failed', msg);
  }
  return { orderId, testMode: false, status: 'pending' };
});

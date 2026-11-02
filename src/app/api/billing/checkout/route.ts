import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { PLANS } from '@/lib/plans';
import { checkoutSchema } from '@/lib/schemas';
import { requireOrg } from '@/lib/server/context';
import { appUrl, badRequest, parseBody, route } from '@/lib/server/http';
import { newOrderId, type PaymentOrder } from '@/lib/server/orders';
import { createOrder, platformSelcom } from '@/lib/server/selcom';

export const dynamic = 'force-dynamic';

/** Starts payment for one month of a plan. Works even when the subscription has lapsed. */
export const POST = route(async (req) => {
  const ctx = await requireOrg(req, { permission: 'billing.manage', write: false });
  const { plan } = await parseBody(req, checkoutSchema);
  const def = PLANS[plan];
  const creds = platformSelcom();
  const orderId = newOrderId();
  const invoiceRef = ctx.orgRef.collection('invoices').doc();

  await invoiceRef.set({
    plan,
    amount: def.price,
    currency: 'TZS',
    status: 'pending',
    testMode: !creds,
    orderId,
    createdAt: FieldValue.serverTimestamp(),
  });
  const order: PaymentOrder = {
    kind: 'subscription',
    orgId: ctx.orgId,
    amount: def.price,
    status: 'pending',
    testMode: !creds,
    plan,
    invoiceId: invoiceRef.id,
    createdByUid: ctx.uid,
    createdByName: ctx.name,
  };
  await adminDb.doc(`paymentOrders/${orderId}`).set({ ...order, createdAt: FieldValue.serverTimestamp() });

  if (!creds) return { testMode: true, orderId, invoiceId: invoiceRef.id };

  const base = appUrl(req);
  const res = await createOrder(creds, {
    orderId,
    amount: def.price,
    buyerName: ctx.org.name,
    buyerEmail: ctx.email,
    buyerPhone: (ctx.org.phone || '').replace(/\D/g, '') || '255000000000',
    webhookUrl: `${base}/api/webhooks/selcom`,
    redirectUrl: `${base}/billing?order=${orderId}`,
    cancelUrl: `${base}/billing`,
    remarks: `TalaPesa ${def.name}`,
  });
  if (!res.ok || !res.gatewayUrl) {
    await invoiceRef.update({ status: 'failed' });
    await adminDb.doc(`paymentOrders/${orderId}`).update({ status: 'failed' });
    throw badRequest('checkout_failed', res.raw.message || 'Could not start checkout');
  }
  return { testMode: false, orderId, invoiceId: invoiceRef.id, url: res.gatewayUrl };
});

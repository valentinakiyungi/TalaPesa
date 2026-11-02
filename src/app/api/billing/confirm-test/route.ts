import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase/admin';
import { requireOrg } from '@/lib/server/context';
import { badRequest, forbidden, notFound, parseBody, route } from '@/lib/server/http';
import { activateSubscription, settleOrder, type PaymentOrder } from '@/lib/server/orders';
import { platformSelcom } from '@/lib/server/selcom';

export const dynamic = 'force-dynamic';

const schema = z.object({ orderId: z.string().min(6).max(40) });

/**
 * In test mode: completes the simulated checkout.
 * In live mode: re-checks the order with Selcom (used after the redirect back).
 */
export const POST = route(async (req) => {
  const ctx = await requireOrg(req, { permission: 'billing.manage', write: false });
  const { orderId } = await parseBody(req, schema);
  const ref = adminDb.doc(`paymentOrders/${orderId}`);
  const snap = await ref.get();
  if (!snap.exists) throw notFound();
  const order = snap.data() as PaymentOrder;
  if (order.orgId !== ctx.orgId || order.kind !== 'subscription') throw forbidden();

  if (platformSelcom()) return { status: await settleOrder(orderId) };

  if (!order.testMode) throw badRequest('not_test');
  if (order.status !== 'pending') return { status: order.status };
  await ref.update({ status: 'completed', updatedAt: FieldValue.serverTimestamp() });
  await activateSubscription(ctx.orgId, order.plan!, order.invoiceId, `TEST-${orderId}`);
  return { status: 'completed' };
});

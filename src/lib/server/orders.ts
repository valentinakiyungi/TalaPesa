import 'server-only';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { todayIso } from '@/lib/engine/loan';
import { PLANS } from '@/lib/plans';
import type { Organization, PlanId } from '@/lib/types';
import { getIntegrations, liveSelcom } from './integrations';
import { recordPayment } from './payments';
import { orderStatus, platformSelcom } from './selcom';

/**
 * Every Selcom order (a customer repayment or a lender's subscription) gets a
 * top-level `paymentOrders/{orderId}` doc so the webhook can route it.
 */
export interface PaymentOrder {
  kind: 'repayment' | 'subscription';
  orgId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  testMode: boolean;
  loanId?: string;
  phone?: string;
  plan?: PlanId;
  invoiceId?: string;
  createdByUid?: string;
  createdByName?: string;
}

export function newOrderId(): string {
  // Selcom order ids: short, alphanumeric, unique.
  return 'TP' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 7).toUpperCase();
}

export async function activateSubscription(orgId: string, plan: PlanId, invoiceId: string | undefined, reference: string) {
  const orgRef = adminDb.doc(`orgs/${orgId}`);
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(orgRef);
    if (!snap.exists) return;
    const org = snap.data() as Organization;
    const now = Date.now();
    const currentEnd = (org.currentPeriodEnd as Timestamp | null | undefined)?.toMillis?.() ?? 0;
    const trialEnd = (org.trialEndsAt as Timestamp | null | undefined)?.toMillis?.() ?? 0;
    // Paying early extends from whichever is later: today, the current period, or the trial end.
    const start = Math.max(now, org.planStatus === 'active' ? currentEnd : 0, org.planStatus === 'trialing' ? trialEnd : 0);
    const end = Timestamp.fromMillis(start + 30 * 86_400_000);
    tx.update(orgRef, { plan, planStatus: 'active', currentPeriodEnd: end });
    if (invoiceId) {
      tx.update(orgRef.collection('invoices').doc(invoiceId), {
        status: 'paid',
        paidAt: FieldValue.serverTimestamp(),
        periodStart: Timestamp.fromMillis(start),
        periodEnd: end,
        reference,
      });
    }
    tx.set(orgRef.collection('audit').doc(), {
      action: 'billing.paid',
      summary: `Subscription ${PLANS[plan].name} paid until ${end.toDate().toISOString().slice(0, 10)}`,
      actorUid: 'system',
      actorName: 'TalaPesa',
      createdAt: FieldValue.serverTimestamp(),
    });
  });
}

/**
 * Asks Selcom whether an order is paid and, if so, settles it exactly once.
 * Never trusts the webhook body; the order status call is the source of truth.
 */
export async function settleOrder(orderId: string): Promise<'completed' | 'failed' | 'pending' | 'unknown'> {
  const orderRef = adminDb.doc(`paymentOrders/${orderId}`);
  const snap = await orderRef.get();
  if (!snap.exists) return 'unknown';
  const order = snap.data() as PaymentOrder;
  if (order.status !== 'pending') return order.status;

  const creds = order.kind === 'subscription' ? platformSelcom() : liveSelcom(await getIntegrations(order.orgId));
  if (!creds) return 'pending';
  const st = await orderStatus(creds, orderId);
  if (st.failed) {
    await orderRef.update({ status: 'failed', updatedAt: FieldValue.serverTimestamp() });
    if (order.kind === 'repayment') {
      await adminDb.doc(`orgs/${order.orgId}/paymentRequests/${orderId}`).update({ status: 'failed', message: st.status });
    } else if (order.invoiceId) {
      await adminDb.doc(`orgs/${order.orgId}/invoices/${order.invoiceId}`).update({ status: 'failed' });
    }
    return 'failed';
  }
  if (!st.paid) return 'pending';

  // Claim the order so concurrent webhooks don't double-settle.
  const claimed = await adminDb.runTransaction(async (tx) => {
    const fresh = await tx.get(orderRef);
    if (fresh.get('status') !== 'pending') return false;
    tx.update(orderRef, { status: 'completed', reference: st.reference ?? null, updatedAt: FieldValue.serverTimestamp() });
    return true;
  });
  if (!claimed) return 'completed';

  const amount = st.amount && st.amount > 0 ? Math.round(st.amount) : order.amount;
  if (order.kind === 'subscription') {
    await activateSubscription(order.orgId, order.plan!, order.invoiceId, st.reference ?? orderId);
    return 'completed';
  }

  const orgSnap = await adminDb.doc(`orgs/${order.orgId}`).get();
  const org = { id: orgSnap.id, ...orgSnap.data() } as Organization;
  try {
    await recordPayment(
      org,
      { orgId: org.id, uid: order.createdByUid || 'system', name: 'Selcom' },
      {
        loanId: order.loanId!,
        amount,
        method: 'selcom',
        reference: st.reference ?? orderId,
        date: todayIso(org.settings?.timeZone),
        note: `Mobile payment from ${order.phone ?? ''}`.trim(),
        source: 'selcom',
        sendReceipt: true,
        idempotencyKey: `selcom_${orderId}`,
      },
    );
    await adminDb.doc(`orgs/${order.orgId}/paymentRequests/${orderId}`).update({ status: 'completed' });
  } catch (err) {
    // Money arrived but could not be applied (e.g. loan already closed). Flag for staff.
    const message = err instanceof Error ? err.message : String(err);
    await adminDb.doc(`orgs/${order.orgId}/paymentRequests/${orderId}`).update({ status: 'failed', message: `Paid but not applied: ${message}` });
    await orderRef.update({ status: 'completed', applyError: message });
  }
  return 'completed';
}

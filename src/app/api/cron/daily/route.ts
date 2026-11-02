import { NextResponse, type NextRequest } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { addDays, todayIso } from '@/lib/engine/loan';
import { PLANS } from '@/lib/plans';
import { orgIsWritable } from '@/lib/server/context';
import { getIntegrations, sendSms } from '@/lib/server/integrations';
import { loadLoanPayments, recomputeLoan, reminderFor } from '@/lib/server/loans';
import { settleOrder } from '@/lib/server/orders';
import type { Loan, Organization } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const OVERDUE_REMIND_DAYS = new Set([1, 3, 7, 14, 21, 30, 45, 60, 90]);

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization');
  return header === `Bearer ${secret}` || req.nextUrl.searchParams.get('secret') === secret;
}

async function processOrg(org: Organization) {
  const tz = org.settings?.timeZone || 'Africa/Dar_es_Salaam';
  const today = todayIso(tz);
  const stats = { loans: 0, updated: 0, reminders: 0 };

  // Lapsed subscriptions become past due (read-only until paid).
  if (org.planStatus === 'active' && !orgIsWritable(org)) {
    await adminDb.doc(`orgs/${org.id}`).update({ planStatus: 'past_due' });
  }

  const snap = await adminDb.collection(`orgs/${org.id}/loans`).where('status', 'in', ['active', 'overdue']).get();
  const remindersOn = !!org.settings?.smsEnabled && PLANS[org.plan]?.sms && orgIsWritable(org);
  const integrations = remindersOn ? await getIntegrations(org.id) : {};
  const remindOn = addDays(today, Math.max(0, org.settings?.reminderDaysBefore ?? 2));

  for (const doc of snap.docs) {
    stats.loans++;
    const loan = { id: doc.id, ...doc.data() } as Loan;
    const payments = await loadLoanPayments(org.id, loan.id);
    const { update } = recomputeLoan(loan, payments, today);
    const changed =
      update.status !== loan.status ||
      update.daysOverdue !== loan.daysOverdue ||
      update.balance !== loan.balance ||
      update.totalPenalty !== loan.totalPenalty ||
      update.nextDueDate !== loan.nextDueDate ||
      update.arrears !== loan.arrears;
    if (changed) {
      await doc.ref.update(update);
      stats.updated++;
    }

    if (!remindersOn || loan.lastReminderDate === today || update.status === 'closed') continue;
    const fresh = { ...loan, ...(update as unknown as Partial<Loan>) };
    const due = fresh.nextDueDate;
    const shouldRemind =
      (fresh.daysOverdue > 0 && fresh.arrears > 0 && OVERDUE_REMIND_DAYS.has(fresh.daysOverdue)) ||
      (fresh.daysOverdue === 0 && (due === today || (due === remindOn && remindOn !== today)));
    if (!shouldRemind) continue;
    const r = reminderFor(org, fresh, today);
    await sendSms(org.id, { to: fresh.customerPhone, message: r.message, kind: r.kind, loanId: fresh.id, customerId: fresh.customerId }, integrations);
    await doc.ref.update({ lastReminderDate: today });
    stats.reminders++;
  }
  return stats;
}

async function run() {
  const orgs = await adminDb.collection('orgs').where('disabled', '==', false).get();
  const results: Record<string, unknown> = {};
  for (const d of orgs.docs) {
    try {
      results[d.id] = await processOrg({ id: d.id, ...d.data() } as Organization);
    } catch (err) {
      console.error('[cron] org', d.id, err);
      results[d.id] = { error: err instanceof Error ? err.message : String(err) };
    }
  }

  // Catch payments whose webhook never arrived.
  const stale = await adminDb
    .collection('paymentOrders')
    .where('status', '==', 'pending')
    .where('createdAt', '<', Timestamp.fromMillis(Date.now() - 10 * 60_000))
    .limit(200)
    .get();
  let settled = 0;
  for (const o of stale.docs) {
    if (o.get('testMode')) continue;
    try {
      if ((await settleOrder(o.id)) === 'completed') settled++;
    } catch (err) {
      console.error('[cron] settle', o.id, err);
    }
  }
  return { orgs: orgs.size, settled, results };
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json(await run());
}

export const POST = GET;

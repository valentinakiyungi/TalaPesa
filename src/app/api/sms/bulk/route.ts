import { z } from 'zod';
import { adminDb } from '@/lib/firebase/admin';
import { todayIso } from '@/lib/engine/loan';
import { requireOrg } from '@/lib/server/context';
import { getIntegrations, sendSms } from '@/lib/server/integrations';
import { parseBody, route } from '@/lib/server/http';
import { audit, reminderFor } from '@/lib/server/loans';
import type { Loan } from '@/lib/types';

export const dynamic = 'force-dynamic';

const schema = z.object({ loanIds: z.array(z.string().min(1)).min(1).max(300) });

/** Sends the appropriate reminder (upcoming, due today or overdue) for each selected loan. */
export const POST = route(async (req) => {
  const ctx = await requireOrg(req, { permission: 'sms.send' });
  const { loanIds } = await parseBody(req, schema);
  const today = todayIso(ctx.org.settings?.timeZone);
  const integrations = await getIntegrations(ctx.orgId);
  const refs = loanIds.map((id) => adminDb.doc(`orgs/${ctx.orgId}/loans/${id}`));
  const snaps = await adminDb.getAll(...refs);
  let sent = 0;
  let failed = 0;
  for (const snap of snaps) {
    if (!snap.exists) continue;
    const loan = { id: snap.id, ...snap.data() } as Loan;
    if (loan.status !== 'active' && loan.status !== 'overdue') continue;
    const r = reminderFor(ctx.org, loan, today);
    const res = await sendSms(ctx.orgId, { to: loan.customerPhone, message: r.message, kind: r.kind, loanId: loan.id, customerId: loan.customerId }, integrations);
    if (res.status === 'failed') failed++;
    else sent++;
    await snap.ref.update({ lastReminderDate: today });
  }
  await audit(ctx, 'sms.bulk', `Sent ${sent} reminders${failed ? `, ${failed} failed` : ''}`);
  return { sent, failed };
});

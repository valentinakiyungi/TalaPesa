import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase/admin';
import { requirePlatformAdmin } from '@/lib/server/context';
import { notFound, parseBody, route } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('suspend') }),
  z.object({ action: z.literal('reactivate') }),
  z.object({ action: z.literal('extend_trial') }),
  z.object({ action: z.literal('set_plan'), plan: z.enum(['starter', 'growth', 'pro']), months: z.number().int().min(1).max(24).default(1) }),
]);

export const POST = route<{ id: string }>(async (req, { params }) => {
  const admin = await requirePlatformAdmin(req);
  const body = await parseBody(req, schema);
  const ref = adminDb.doc(`orgs/${params.id}`);
  const snap = await ref.get();
  if (!snap.exists) throw notFound();

  let update: Record<string, unknown> = {};
  let summary = '';
  switch (body.action) {
    case 'suspend':
      update = { disabled: true };
      summary = 'Workspace suspended by platform admin';
      break;
    case 'reactivate':
      update = { disabled: false };
      summary = 'Workspace reactivated by platform admin';
      break;
    case 'extend_trial': {
      const current = (snap.get('trialEndsAt') as Timestamp | undefined)?.toMillis() ?? 0;
      update = { planStatus: 'trialing', plan: 'trial', trialEndsAt: Timestamp.fromMillis(Math.max(current, Date.now()) + 14 * 86_400_000) };
      summary = 'Trial extended by 14 days';
      break;
    }
    case 'set_plan':
      update = { plan: body.plan, planStatus: 'active', currentPeriodEnd: Timestamp.fromMillis(Date.now() + body.months * 30 * 86_400_000) };
      summary = `Plan set to ${body.plan} for ${body.months} month(s)`;
      break;
  }
  await ref.update(update);
  await ref.collection('audit').add({ action: `admin.${body.action}`, summary, actorUid: 'platform', actorName: `TalaPesa (${admin.email})`, createdAt: FieldValue.serverTimestamp() });
  return { ok: true };
});

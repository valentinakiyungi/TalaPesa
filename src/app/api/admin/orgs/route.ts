import type { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requirePlatformAdmin } from '@/lib/server/context';
import { route } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

const iso = (v: unknown) => ((v as Timestamp | null | undefined)?.toDate?.() ?? null)?.toISOString() ?? null;

export const GET = route(async (req) => {
  await requirePlatformAdmin(req);
  const snap = await adminDb.collection('orgs').orderBy('createdAt', 'desc').limit(500).get();
  const orgs = await Promise.all(
    snap.docs.map(async (d) => {
      const data = d.data();
      const [members, live] = await Promise.all([
        d.ref.collection('members').where('status', '==', 'active').count().get(),
        d.ref.collection('loans').where('status', 'in', ['active', 'overdue']).count().get(),
      ]);
      return {
        id: d.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        plan: data.plan,
        planStatus: data.planStatus,
        disabled: !!data.disabled,
        trialEndsAt: iso(data.trialEndsAt),
        currentPeriodEnd: iso(data.currentPeriodEnd),
        createdAt: iso(data.createdAt),
        customers: data.counters?.customers ?? 0,
        loans: data.counters?.loans ?? 0,
        activeLoans: live.data().count,
        members: members.data().count,
      };
    }),
  );
  return { orgs };
});

import { adminDb } from '@/lib/firebase/admin';
import { profileSchema } from '@/lib/schemas';
import { requireUser } from '@/lib/server/context';
import { parseBody, route } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export const PATCH = route(async (req) => {
  const user = await requireUser(req);
  const body = await parseBody(req, profileSchema);
  const userRef = adminDb.doc(`users/${user.uid}`);
  const snap = await userRef.get();
  await userRef.set({ uid: user.uid, email: user.email, name: body.name, phone: body.phone }, { merge: true });
  const orgId = snap.get('orgId') as string | undefined;
  if (orgId) {
    const memberRef = adminDb.doc(`orgs/${orgId}/members/${user.uid}`);
    if ((await memberRef.get()).exists) await memberRef.update({ name: body.name, phone: body.phone });
  }
  return { ok: true };
});

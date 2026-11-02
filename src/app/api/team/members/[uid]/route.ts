import { memberUpdateSchema } from '@/lib/schemas';
import { requireOrg } from '@/lib/server/context';
import { adminDb } from '@/lib/firebase/admin';
import { badRequest, forbidden, notFound, parseBody, route } from '@/lib/server/http';
import { audit } from '@/lib/server/loans';

export const dynamic = 'force-dynamic';

export const PATCH = route<{ uid: string }>(async (req, { params }) => {
  const ctx = await requireOrg(req, { permission: 'team.manage', write: false });
  const body = await parseBody(req, memberUpdateSchema);
  if (params.uid === ctx.uid) throw badRequest('self', 'You cannot change your own access');
  const ref = ctx.orgRef.collection('members').doc(params.uid);
  const snap = await ref.get();
  if (!snap.exists) throw notFound();
  if (snap.get('role') === 'owner') throw forbidden('owner_protected', 'The owner cannot be changed');
  if (ctx.role === 'admin' && snap.get('role') === 'admin') throw forbidden('permission_denied', 'Admins cannot change other admins');

  const update: Record<string, string> = {};
  if (body.role) update.role = body.role;
  if (body.status) update.status = body.status;
  await ref.update(update);
  if (body.role) await adminDb.doc(`users/${params.uid}`).set({ role: body.role }, { merge: true });
  await audit(ctx, 'team.updated', `${snap.get('name')}: ${Object.entries(update).map(([k, v]) => `${k} → ${v}`).join(', ')}`);
  return { ok: true };
});

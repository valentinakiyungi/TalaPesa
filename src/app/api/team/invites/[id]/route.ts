import { requireOrg } from '@/lib/server/context';
import { notFound, route } from '@/lib/server/http';
import { audit } from '@/lib/server/loans';

export const dynamic = 'force-dynamic';

export const DELETE = route<{ id: string }>(async (req, { params }) => {
  const ctx = await requireOrg(req, { permission: 'team.manage', write: false });
  const ref = ctx.orgRef.collection('invites').doc(params.id);
  const snap = await ref.get();
  if (!snap.exists) throw notFound();
  await ref.update({ status: 'revoked' });
  await audit(ctx, 'team.invite_revoked', `Revoked invitation for ${snap.get('email')}`);
  return { ok: true };
});

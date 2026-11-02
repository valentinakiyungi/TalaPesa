import crypto from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { PLANS } from '@/lib/plans';
import { inviteSchema } from '@/lib/schemas';
import { requireOrg } from '@/lib/server/context';
import { appUrl, conflict, parseBody, route } from '@/lib/server/http';
import { audit } from '@/lib/server/loans';

export const dynamic = 'force-dynamic';

export const POST = route(async (req) => {
  const ctx = await requireOrg(req, { permission: 'team.manage' });
  const body = await parseBody(req, inviteSchema);
  const members = await ctx.orgRef.collection('members').where('status', '==', 'active').get();
  if (members.docs.some((d) => d.get('email') === body.email)) throw conflict('already_member', 'This person is already on your team');
  const pending = await ctx.orgRef.collection('invites').where('status', '==', 'pending').get();
  const limit = PLANS[ctx.org.plan]?.maxMembers ?? 1;
  if (members.size + pending.size >= limit) throw conflict('plan_limit', `Your plan allows ${limit} team members`);

  const token = crypto.randomBytes(24).toString('hex');
  await ctx.orgRef.collection('invites').doc(token).set({
    email: body.email,
    role: body.role,
    status: 'pending',
    invitedBy: ctx.uid,
    invitedByName: ctx.name,
    expiresAt: Timestamp.fromMillis(Date.now() + 7 * 86_400_000),
    createdAt: FieldValue.serverTimestamp(),
  });
  await audit(ctx, 'team.invited', `Invited ${body.email} as ${body.role}`);
  return { token, link: `${appUrl(req)}/invite/${ctx.orgId}/${token}` };
});

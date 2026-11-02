import { FieldValue, type Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { PLANS } from '@/lib/plans';
import { isPlatformAdmin, requireUser } from '@/lib/server/context';
import { conflict, forbidden, notFound, route } from '@/lib/server/http';
import type { Organization } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function loadInvite(orgId: string, token: string) {
  if (!/^[a-f0-9]{48}$/.test(token)) throw notFound('invalid_invite');
  const orgRef = adminDb.doc(`orgs/${orgId}`);
  const [orgSnap, invSnap] = await Promise.all([orgRef.get(), orgRef.collection('invites').doc(token).get()]);
  if (!orgSnap.exists || !invSnap.exists) throw notFound('invalid_invite');
  const expires = (invSnap.get('expiresAt') as Timestamp | undefined)?.toMillis() ?? 0;
  if (invSnap.get('status') !== 'pending' || expires < Date.now()) throw notFound('invalid_invite');
  return { orgRef, org: { id: orgSnap.id, ...orgSnap.data() } as Organization, invRef: invSnap.ref, invite: invSnap.data() as { email: string; role: string } };
}

/** Public: shows who the invite is for (the token itself is the secret). */
export const GET = route<{ orgId: string; token: string }>(async (_req, { params }) => {
  const { org, invite } = await loadInvite(params.orgId, params.token);
  return { orgName: org.name, email: invite.email, role: invite.role };
});

export const POST = route<{ orgId: string; token: string }>(async (req, { params }) => {
  const user = await requireUser(req);
  const { orgRef, org, invRef, invite } = await loadInvite(params.orgId, params.token);
  if (invite.email !== user.email) throw forbidden('wrong_email', `This invitation is for ${invite.email}`);
  const userRef = adminDb.doc(`users/${user.uid}`);
  const body = (await req.json().catch(() => ({}))) as { name?: string };

  await adminDb.runTransaction(async (tx) => {
    const [userSnap, members] = await Promise.all([tx.get(userRef), tx.get(orgRef.collection('members').where('status', '==', 'active'))]);
    const currentOrg = userSnap.get('orgId');
    if (currentOrg && currentOrg !== org.id) throw conflict('already_member', 'You already belong to another workspace');
    if (members.size >= (PLANS[org.plan]?.maxMembers ?? 1)) throw conflict('plan_limit', 'This workspace has no free seats');
    const name = (body.name || userSnap.get('name') || user.name).toString().slice(0, 120);
    tx.set(orgRef.collection('members').doc(user.uid), {
      uid: user.uid,
      email: user.email,
      name,
      role: invite.role,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.set(userRef, { uid: user.uid, email: user.email, name, orgId: org.id, role: invite.role, platformAdmin: isPlatformAdmin(user.email), createdAt: userSnap.get('createdAt') ?? FieldValue.serverTimestamp() }, { merge: true });
    tx.update(invRef, { status: 'accepted', acceptedBy: user.uid, acceptedAt: FieldValue.serverTimestamp() });
    tx.set(orgRef.collection('audit').doc(), {
      action: 'team.joined',
      summary: `${name} joined as ${invite.role}`,
      actorUid: user.uid,
      actorName: name,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
  return { orgId: org.id };
});

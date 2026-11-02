import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { defaultOrgSettings, defaultProducts } from '@/lib/defaults';
import { TRIAL_DAYS } from '@/lib/plans';
import { createOrgSchema } from '@/lib/schemas';
import { isPlatformAdmin, requireUser } from '@/lib/server/context';
import { conflict, parseBody, route } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

/** Creates a new lending business (workspace) owned by the signed-in user. */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  const body = await parseBody(req, createOrgSchema);

  const userRef = adminDb.doc(`users/${user.uid}`);
  const orgRef = adminDb.collection('orgs').doc();

  await adminDb.runTransaction(async (tx) => {
    const existing = await tx.get(userRef);
    if (existing.get('orgId')) throw conflict('already_member', 'You already belong to a workspace');

    const now = Timestamp.now();
    const trialEndsAt = Timestamp.fromMillis(now.toMillis() + TRIAL_DAYS * 86_400_000);

    tx.set(orgRef, {
      name: body.name,
      phone: body.phone,
      city: body.city,
      email: user.email,
      address: '',
      country: 'TZ',
      ownerUid: user.uid,
      plan: 'trial',
      planStatus: 'trialing',
      trialEndsAt,
      currentPeriodEnd: null,
      settings: defaultOrgSettings(body.smsLanguage),
      counters: { loans: 0, customers: 0, receipts: 0 },
      integrations: { selcomConfigured: false, smsConfigured: false },
      disabled: false,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.set(orgRef.collection('members').doc(user.uid), {
      uid: user.uid,
      email: user.email,
      name: body.userName,
      role: 'owner',
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.set(
      userRef,
      {
        uid: user.uid,
        email: user.email,
        name: body.userName,
        orgId: orgRef.id,
        role: 'owner',
        platformAdmin: isPlatformAdmin(user.email),
        createdAt: existing.exists ? existing.get('createdAt') ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    for (const p of defaultProducts()) {
      tx.set(orgRef.collection('products').doc(), { ...p, createdAt: FieldValue.serverTimestamp() });
    }
    tx.set(orgRef.collection('audit').doc(), {
      action: 'org.created',
      summary: `Workspace "${body.name}" created`,
      actorUid: user.uid,
      actorName: body.userName,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return { orgId: orgRef.id };
});

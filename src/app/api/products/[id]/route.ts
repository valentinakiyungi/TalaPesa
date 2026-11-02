import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { productSchema } from '@/lib/schemas';
import { requireOrg } from '@/lib/server/context';
import { notFound, parseBody, route } from '@/lib/server/http';
import { audit } from '@/lib/server/loans';

export const dynamic = 'force-dynamic';

/** Existing loans keep the terms they were created with; edits only affect new loans. */
export const PUT = route<{ id: string }>(async (req, { params }) => {
  const ctx = await requireOrg(req, { permission: 'settings.manage' });
  const body = await parseBody(req, productSchema);
  const ref = adminDb.doc(`orgs/${ctx.orgId}/products/${params.id}`);
  if (!(await ref.get()).exists) throw notFound();
  await ref.set({ ...body, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  await audit(ctx, 'product.updated', `Updated loan product "${body.name}"`, { type: 'product', id: ref.id });
  return { ok: true };
});

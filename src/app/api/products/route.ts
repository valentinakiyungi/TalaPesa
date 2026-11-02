import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { productSchema } from '@/lib/schemas';
import { requireOrg } from '@/lib/server/context';
import { parseBody, route } from '@/lib/server/http';
import { audit } from '@/lib/server/loans';

export const dynamic = 'force-dynamic';

export const POST = route(async (req) => {
  const ctx = await requireOrg(req, { permission: 'settings.manage' });
  const body = await parseBody(req, productSchema);
  const ref = await adminDb.collection(`orgs/${ctx.orgId}/products`).add({ ...body, createdAt: FieldValue.serverTimestamp() });
  await audit(ctx, 'product.created', `Created loan product "${body.name}"`, { type: 'product', id: ref.id });
  return { id: ref.id };
});

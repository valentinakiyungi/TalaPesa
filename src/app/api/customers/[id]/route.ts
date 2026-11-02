import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase/admin';
import { customerSchema } from '@/lib/schemas';
import { requireOrg } from '@/lib/server/context';
import { conflict, notFound, parseBody, route } from '@/lib/server/http';
import { audit } from '@/lib/server/loans';
import { customerFields, searchTokens } from '@/lib/server/customers';

export const dynamic = 'force-dynamic';

const patchSchema = z.union([
  z.object({ action: z.literal('update'), customer: customerSchema }),
  z.object({ action: z.literal('status'), status: z.enum(['active', 'blacklisted']) }),
]);

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const ctx = await requireOrg(req, { permission: 'customers.write' });
  const body = await parseBody(req, patchSchema);
  const ref = adminDb.doc(`orgs/${ctx.orgId}/customers/${params.id}`);
  const snap = await ref.get();
  if (!snap.exists) throw notFound();

  if (body.action === 'status') {
    await ref.update({ status: body.status, updatedAt: FieldValue.serverTimestamp() });
    await audit(ctx, `customer.${body.status}`, `${snap.get('fullName')} marked ${body.status}`, { type: 'customer', id: ref.id });
    return { ok: true };
  }

  const fields = customerFields(body.customer);
  if (fields.phone !== snap.get('phone')) {
    const dup = await adminDb.collection(`orgs/${ctx.orgId}/customers`).where('phone', '==', fields.phone).limit(1).get();
    if (!dup.empty && dup.docs[0].id !== ref.id) throw conflict('duplicate_phone', 'A customer with this phone already exists');
  }
  await ref.update({
    ...fields,
    searchTokens: searchTokens({ ...fields, customerNumber: snap.get('customerNumber') }),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await audit(ctx, 'customer.updated', `Updated customer ${fields.fullName}`, { type: 'customer', id: ref.id });
  return { ok: true };
});

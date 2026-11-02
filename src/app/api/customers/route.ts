import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { customerSchema } from '@/lib/schemas';
import { customerFields, searchTokens } from '@/lib/server/customers';
import { requireOrg } from '@/lib/server/context';
import { conflict, parseBody, route } from '@/lib/server/http';
import { auditInTx, nextCounter, pad } from '@/lib/server/loans';

export const dynamic = 'force-dynamic';

export const POST = route(async (req) => {
  const ctx = await requireOrg(req, { permission: 'customers.write' });
  const body = await parseBody(req, customerSchema);
  const fields = customerFields(body);
  const col = adminDb.collection(`orgs/${ctx.orgId}/customers`);

  const dup = await col.where('phone', '==', fields.phone).limit(1).get();
  if (!dup.empty) throw conflict('duplicate_phone', 'A customer with this phone already exists');

  const ref = col.doc();
  let customerNumber = '';
  await adminDb.runTransaction(async (tx) => {
    const n = await nextCounter(tx, ctx.orgRef, 'customers');
    customerNumber = `C-${pad(n, 5)}`;
    tx.set(ref, {
      ...fields,
      customerNumber,
      status: 'active',
      documents: [],
      stats: { loans: 0, activeLoans: 0, totalBorrowed: 0, totalRepaid: 0 },
      searchTokens: searchTokens({ ...fields, customerNumber }),
      createdBy: ctx.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    auditInTx(tx, ctx, 'customer.created', `Added customer ${fields.fullName} (${customerNumber})`, { type: 'customer', id: ref.id });
  });
  return { id: ref.id, customerNumber };
});

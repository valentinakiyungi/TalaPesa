import crypto from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { adminDb, adminStorage } from '@/lib/firebase/admin';
import { requireOrg } from '@/lib/server/context';
import { badRequest, notFound, parseBody, route } from '@/lib/server/http';
import { audit } from '@/lib/server/loans';
import type { CustomerDocument } from '@/lib/types';

export const dynamic = 'force-dynamic';

const addSchema = z.object({
  name: z.string().trim().min(1).max(160),
  type: z.enum(['national_id', 'passport', 'photo', 'payslip', 'contract', 'other']),
  path: z.string().min(1).max(400),
  url: z.string().url(),
  size: z.number().int().nonnegative().optional(),
});

/** Registers a file the browser already uploaded to Storage under this customer's folder. */
export const POST = route<{ id: string }>(async (req, { params }) => {
  const ctx = await requireOrg(req, { permission: 'customers.write' });
  const body = await parseBody(req, addSchema);
  if (!body.path.startsWith(`orgs/${ctx.orgId}/customers/${params.id}/`)) throw badRequest('bad_path');
  const ref = adminDb.doc(`orgs/${ctx.orgId}/customers/${params.id}`);
  const snap = await ref.get();
  if (!snap.exists) throw notFound();
  const doc: CustomerDocument = { id: crypto.randomUUID(), ...body, uploadedAt: new Date().toISOString() };
  await ref.update({ documents: FieldValue.arrayUnion(doc), updatedAt: FieldValue.serverTimestamp() });
  await audit(ctx, 'customer.document_added', `Uploaded "${body.name}" for ${snap.get('fullName')}`, { type: 'customer', id: ref.id });
  return { document: doc };
});

const delSchema = z.object({ documentId: z.string().min(1) });

export const DELETE = route<{ id: string }>(async (req, { params }) => {
  const ctx = await requireOrg(req, { permission: 'customers.write' });
  const { documentId } = await parseBody(req, delSchema);
  const ref = adminDb.doc(`orgs/${ctx.orgId}/customers/${params.id}`);
  const snap = await ref.get();
  if (!snap.exists) throw notFound();
  const docs = (snap.get('documents') as CustomerDocument[] | undefined) ?? [];
  const target = docs.find((d) => d.id === documentId);
  if (!target) throw notFound();
  await ref.update({ documents: docs.filter((d) => d.id !== documentId), updatedAt: FieldValue.serverTimestamp() });
  try {
    await adminStorage.bucket().file(target.path).delete();
  } catch {
    // file already gone; the record is removed either way
  }
  await audit(ctx, 'customer.document_removed', `Removed "${target.name}" from ${snap.get('fullName')}`, { type: 'customer', id: ref.id });
  return { ok: true };
});

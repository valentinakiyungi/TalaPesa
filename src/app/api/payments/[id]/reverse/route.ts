import { z } from 'zod';
import { requireOrg } from '@/lib/server/context';
import { parseBody, route } from '@/lib/server/http';
import { reversePayment } from '@/lib/server/payments';

export const dynamic = 'force-dynamic';

const schema = z.object({ reason: z.string().trim().min(2).max(300) });

export const POST = route<{ id: string }>(async (req, { params }) => {
  const ctx = await requireOrg(req, { permission: 'payments.reverse' });
  const { reason } = await parseBody(req, schema);
  await reversePayment(ctx.org, ctx, params.id, reason);
  return { ok: true };
});

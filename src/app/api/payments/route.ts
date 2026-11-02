import { paymentSchema } from '@/lib/schemas';
import { requireOrg } from '@/lib/server/context';
import { parseBody, route } from '@/lib/server/http';
import { recordPayment } from '@/lib/server/payments';

export const dynamic = 'force-dynamic';

export const POST = route(async (req) => {
  const ctx = await requireOrg(req, { permission: 'payments.record' });
  const body = await parseBody(req, paymentSchema);
  return recordPayment(ctx.org, ctx, { ...body, source: 'manual' });
});

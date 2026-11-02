import { z } from 'zod';
import { requireOrg } from '@/lib/server/context';
import { sendSms } from '@/lib/server/integrations';
import { parseBody, route } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

const schema = z.object({ to: z.string().trim().min(9).max(30) });

export const POST = route(async (req) => {
  const ctx = await requireOrg(req, { permission: 'settings.manage' });
  const { to } = await parseBody(req, schema);
  return sendSms(ctx.orgId, { to, message: `TalaPesa: test message from ${ctx.org.name}.`, kind: 'test' });
});

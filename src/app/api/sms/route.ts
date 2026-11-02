import { smsSchema } from '@/lib/schemas';
import { requireOrg } from '@/lib/server/context';
import { sendSms } from '@/lib/server/integrations';
import { parseBody, route } from '@/lib/server/http';
import { audit } from '@/lib/server/loans';

export const dynamic = 'force-dynamic';

export const POST = route(async (req) => {
  const ctx = await requireOrg(req, { permission: 'sms.send' });
  const body = await parseBody(req, smsSchema);
  const result = await sendSms(ctx.orgId, { to: body.to, message: body.message, kind: 'manual', loanId: body.loanId });
  await audit(ctx, 'sms.sent', `SMS to ${body.to}`);
  return result;
});

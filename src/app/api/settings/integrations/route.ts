import { integrationsSchema } from '@/lib/schemas';
import { requireOrg } from '@/lib/server/context';
import { getIntegrations, integrationsRef, type OrgIntegrations } from '@/lib/server/integrations';
import { badRequest, parseBody, route } from '@/lib/server/http';
import { audit } from '@/lib/server/loans';

export const dynamic = 'force-dynamic';

function mask(v?: string) {
  if (!v) return '';
  return v.length <= 4 ? '••••' : `••••${v.slice(-4)}`;
}

/** Returns non-secret parts only, so the settings page can show what's connected. */
export const GET = route(async (req) => {
  const ctx = await requireOrg(req, { permission: 'settings.manage', write: false });
  const i = await getIntegrations(ctx.orgId);
  return {
    selcom: i.selcom ? { vendor: i.selcom.vendor, live: i.selcom.live, apiKey: mask(i.selcom.apiKey), hasSecret: !!i.selcom.apiSecret } : null,
    sms: i.sms ? { provider: i.sms.provider, senderId: i.sms.senderId || '', username: i.sms.username || '', apiKey: mask(i.sms.apiKey), hasSecret: !!i.sms.apiSecret } : null,
  };
});

/** Blank secret fields keep the stored value; `null` disconnects. */
export const PUT = route(async (req) => {
  const ctx = await requireOrg(req, { permission: 'settings.manage' });
  const body = await parseBody(req, integrationsSchema);
  const current = await getIntegrations(ctx.orgId);
  const next: OrgIntegrations = { ...current };

  if (body.selcom === null) next.selcom = null;
  else if (body.selcom) {
    const merged = {
      apiKey: body.selcom.apiKey || current.selcom?.apiKey || '',
      apiSecret: body.selcom.apiSecret || current.selcom?.apiSecret || '',
      vendor: body.selcom.vendor || current.selcom?.vendor || '',
      live: body.selcom.live,
    };
    if (!merged.apiKey || !merged.apiSecret || !merged.vendor) throw badRequest('selcom_incomplete', 'API key, secret and vendor are all required');
    next.selcom = merged;
  }

  if (body.sms === null) next.sms = null;
  else if (body.sms) {
    const same = current.sms?.provider === body.sms.provider;
    const merged = {
      provider: body.sms.provider,
      apiKey: body.sms.apiKey || (same ? current.sms?.apiKey : '') || '',
      apiSecret: body.sms.apiSecret || (same ? current.sms?.apiSecret : '') || '',
      username: body.sms.username || (same ? current.sms?.username : '') || '',
      senderId: body.sms.senderId,
    };
    if (!merged.apiKey) throw badRequest('sms_incomplete', 'API key is required');
    if (merged.provider === 'beem' && !merged.apiSecret) throw badRequest('sms_incomplete', 'Beem needs an API key and secret');
    if (merged.provider === 'africastalking' && !merged.username) throw badRequest('sms_incomplete', "Africa's Talking needs a username");
    next.sms = merged;
  }

  await integrationsRef(ctx.orgId).set(next);
  await ctx.orgRef.update({
    'integrations.selcomConfigured': !!(next.selcom && next.selcom.live),
    'integrations.smsConfigured': !!next.sms,
    'integrations.smsProvider': next.sms?.provider ?? null,
  });
  await audit(ctx, 'settings.integrations', 'Updated integration settings');
  return { ok: true };
});

import { orgSettingsSchema } from '@/lib/schemas';
import { requireOrg } from '@/lib/server/context';
import { parseBody, route } from '@/lib/server/http';
import { audit } from '@/lib/server/loans';

export const dynamic = 'force-dynamic';

export const PATCH = route(async (req) => {
  const ctx = await requireOrg(req, { permission: 'settings.manage' });
  const body = await parseBody(req, orgSettingsSchema);
  const { settings, ...profile } = body;
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(profile)) if (v !== undefined) update[k] = v;
  for (const [k, v] of Object.entries(settings ?? {})) if (v !== undefined) update[`settings.${k}`] = v;
  if (Object.keys(update).length) await ctx.orgRef.update(update);
  await audit(ctx, 'settings.updated', `Updated settings: ${Object.keys(update).join(', ')}`);
  return { ok: true };
});

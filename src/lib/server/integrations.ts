import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { normalizePhone } from '@/lib/engine/loan';
import type { SmsLog } from '@/lib/types';
import type { SelcomCredentials } from './selcom';

export interface SmsConfig {
  provider: 'beem' | 'africastalking';
  apiKey: string;
  apiSecret?: string;
  username?: string;
  senderId?: string;
}

export interface OrgIntegrations {
  selcom?: (SelcomCredentials & { live: boolean }) | null;
  sms?: SmsConfig | null;
}

/** Secrets live in a doc that security rules make unreadable from the browser. */
export function integrationsRef(orgId: string) {
  return adminDb.doc(`orgs/${orgId}/private/integrations`);
}

export async function getIntegrations(orgId: string): Promise<OrgIntegrations> {
  const snap = await integrationsRef(orgId).get();
  return (snap.data() as OrgIntegrations | undefined) ?? {};
}

export function liveSelcom(i: OrgIntegrations): SelcomCredentials | null {
  const s = i.selcom;
  if (!s || !s.live || !s.apiKey || !s.apiSecret || !s.vendor) return null;
  return s;
}

// ---------------------------------------------------------------------------
// SMS
// ---------------------------------------------------------------------------

interface SendResult {
  status: SmsLog['status'];
  provider: string;
  error?: string;
}

async function sendBeem(cfg: SmsConfig, to: string, message: string): Promise<SendResult> {
  const res = await fetch('https://apisms.beem.africa/v1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${cfg.apiKey}:${cfg.apiSecret ?? ''}`).toString('base64'),
    },
    body: JSON.stringify({
      source_addr: cfg.senderId || 'INFO',
      encoding: 0,
      schedule_time: '',
      message,
      recipients: [{ recipient_id: '1', dest_addr: to }],
    }),
  });
  const body = (await res.json().catch(() => ({}))) as { successful?: boolean; message?: string };
  if (res.ok && body.successful !== false) return { status: 'sent', provider: 'beem' };
  return { status: 'failed', provider: 'beem', error: body.message || `HTTP ${res.status}` };
}

async function sendAfricasTalking(cfg: SmsConfig, to: string, message: string): Promise<SendResult> {
  const params = new URLSearchParams({ username: cfg.username || '', to: '+' + to, message });
  if (cfg.senderId) params.set('from', cfg.senderId);
  const host = cfg.username === 'sandbox' ? 'api.sandbox.africastalking.com' : 'api.africastalking.com';
  const res = await fetch(`https://${host}/version1/messaging`, {
    method: 'POST',
    headers: { apiKey: cfg.apiKey, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const body = (await res.json().catch(() => ({}))) as { SMSMessageData?: { Recipients?: { status: string }[]; Message?: string } };
  const r = body.SMSMessageData?.Recipients?.[0];
  if (res.ok && r && r.status === 'Success') return { status: 'sent', provider: 'africastalking' };
  return { status: 'failed', provider: 'africastalking', error: r?.status || body.SMSMessageData?.Message || `HTTP ${res.status}` };
}

export interface SmsInput {
  to: string;
  message: string;
  kind: SmsLog['kind'];
  loanId?: string;
  customerId?: string;
}

/**
 * Sends an SMS with the org's provider and logs it. With no provider
 * configured the message is logged as "simulated" (test mode).
 */
export async function sendSms(orgId: string, input: SmsInput, integrations?: OrgIntegrations): Promise<SendResult> {
  const cfg = (integrations ?? (await getIntegrations(orgId))).sms;
  const to = normalizePhone(input.to);
  let result: SendResult;
  try {
    if (!cfg) result = { status: 'simulated', provider: 'test' };
    else if (cfg.provider === 'beem') result = await sendBeem(cfg, to, input.message);
    else result = await sendAfricasTalking(cfg, to, input.message);
  } catch (err) {
    result = { status: 'failed', provider: cfg?.provider ?? 'test', error: err instanceof Error ? err.message : String(err) };
  }
  await adminDb.collection(`orgs/${orgId}/sms`).add({
    to,
    message: input.message,
    kind: input.kind,
    status: result.status,
    provider: result.provider,
    error: result.error ?? null,
    loanId: input.loanId ?? null,
    customerId: input.customerId ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });
  return result;
}

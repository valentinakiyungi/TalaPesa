import 'server-only';
import crypto from 'node:crypto';

/**
 * Minimal Selcom API gateway client (checkout + mobile wallet push).
 * Signing follows Selcom's official clients: HMAC-SHA256 over
 * "timestamp=<ts>&field1=value1&..." with the fields listed in Signed-Fields.
 */
export interface SelcomCredentials {
  apiKey: string;
  apiSecret: string;
  vendor: string;
  baseUrl?: string;
}

export interface SelcomResponse {
  reference?: string;
  transid?: string;
  resultcode?: string;
  result?: string;
  message?: string;
  data?: Array<Record<string, unknown>>;
}

function timestamp(): string {
  // YYYY-MM-DDTHH:mm:ss+03:00 (Selcom expects an offset timestamp)
  const now = new Date();
  const offsetMin = -now.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');
  const local = new Date(now.getTime() + offsetMin * 60_000).toISOString().slice(0, 19);
  return `${local}${sign}${pad(offsetMin / 60)}:${pad(offsetMin % 60)}`;
}

export function selcomHeaders(creds: SelcomCredentials, payload: Record<string, string | number>) {
  const ts = timestamp();
  const keys = Object.keys(payload);
  const data = ['timestamp=' + ts, ...keys.map((k) => `${k}=${payload[k]}`)].join('&');
  const digest = crypto.createHmac('sha256', creds.apiSecret).update(data).digest('base64');
  return {
    'Content-Type': 'application/json',
    Authorization: 'SELCOM ' + Buffer.from(creds.apiKey, 'ascii').toString('base64'),
    'Digest-Method': 'HS256',
    Digest: digest,
    Timestamp: ts,
    'Signed-Fields': keys.join(','),
  };
}

async function call(creds: SelcomCredentials, method: 'GET' | 'POST', path: string, payload: Record<string, string | number>): Promise<SelcomResponse> {
  const base = (creds.baseUrl || process.env.SELCOM_BASE_URL || 'https://apigw.selcommobile.com').replace(/\/$/, '');
  const headers = selcomHeaders(creds, payload);
  const url = method === 'GET' ? `${base}${path}?${new URLSearchParams(Object.entries(payload).map(([k, v]) => [k, String(v)]))}` : `${base}${path}`;
  const res = await fetch(url, { method, headers, body: method === 'POST' ? JSON.stringify(payload) : undefined, cache: 'no-store' });
  const text = await res.text();
  try {
    return JSON.parse(text) as SelcomResponse;
  } catch {
    return { result: 'FAIL', resultcode: String(res.status), message: text.slice(0, 300) };
  }
}

export function isSuccess(r: SelcomResponse): boolean {
  return r.resultcode === '000' || r.result === 'SUCCESS';
}

export interface CreateOrderInput {
  orderId: string;
  amount: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  webhookUrl: string;
  redirectUrl?: string;
  cancelUrl?: string;
  remarks?: string;
}

export async function createOrder(creds: SelcomCredentials, o: CreateOrderInput) {
  const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');
  const payload: Record<string, string | number> = {
    vendor: creds.vendor,
    order_id: o.orderId,
    buyer_email: o.buyerEmail || 'noreply@talapesa.app',
    buyer_name: o.buyerName,
    buyer_phone: o.buyerPhone,
    amount: Math.round(o.amount),
    currency: 'TZS',
    webhook: b64(o.webhookUrl),
    buyer_remarks: o.remarks || 'None',
    merchant_remarks: o.remarks || 'None',
    no_of_items: 1,
  };
  if (o.redirectUrl) payload.redirect_url = b64(o.redirectUrl);
  if (o.cancelUrl) payload.cancel_url = b64(o.cancelUrl);
  const res = await call(creds, 'POST', '/v1/checkout/create-order-minimal', payload);
  const gw = res.data?.[0]?.payment_gateway_url as string | undefined;
  const gatewayUrl = gw ? (gw.startsWith('http') ? gw : Buffer.from(gw, 'base64').toString('utf8')) : undefined;
  return { ok: isSuccess(res), gatewayUrl, raw: res };
}

/** Sends a USSD push to the customer's phone for an existing order. */
export async function walletPush(creds: SelcomCredentials, orderId: string, msisdn: string) {
  const res = await call(creds, 'POST', '/v1/checkout/wallet-payment', {
    transid: `${orderId}-${Date.now()}`,
    order_id: orderId,
    msisdn,
  });
  return { ok: isSuccess(res), raw: res };
}

export async function orderStatus(creds: SelcomCredentials, orderId: string) {
  const res = await call(creds, 'GET', '/v1/checkout/order-status', { order_id: orderId });
  const row = res.data?.[0] ?? {};
  const status = String(row.payment_status ?? '').toUpperCase();
  return {
    ok: isSuccess(res),
    paid: status === 'COMPLETED',
    failed: status === 'CANCELLED' || status === 'REJECTED' || status === 'USERCANCELLED',
    status,
    reference: (row.reference as string) || (row.transid as string) || undefined,
    amount: row.amount !== undefined ? Number(row.amount) : undefined,
    raw: res,
  };
}

/** Platform credentials (used to bill lenders for their subscription). */
export function platformSelcom(): SelcomCredentials | null {
  const { SELCOM_API_KEY, SELCOM_API_SECRET, SELCOM_VENDOR } = process.env;
  if (!SELCOM_API_KEY || !SELCOM_API_SECRET || !SELCOM_VENDOR) return null;
  return { apiKey: SELCOM_API_KEY, apiSecret: SELCOM_API_SECRET, vendor: SELCOM_VENDOR };
}

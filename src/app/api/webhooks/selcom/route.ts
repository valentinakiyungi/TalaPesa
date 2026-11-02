import { NextResponse, type NextRequest } from 'next/server';
import { settleOrder } from '@/lib/server/orders';

export const dynamic = 'force-dynamic';

/**
 * Selcom calls this when a checkout order changes. We only use the order id
 * from the payload and re-check the status with Selcom before settling.
 */
export async function POST(req: NextRequest) {
  let orderId = '';
  try {
    const body = (await req.json()) as { order_id?: string };
    orderId = String(body.order_id || '');
  } catch {
    return NextResponse.json({ result: 'FAIL', message: 'invalid json' }, { status: 400 });
  }
  if (!/^[A-Z0-9]{6,40}$/i.test(orderId)) return NextResponse.json({ result: 'FAIL', message: 'bad order id' }, { status: 400 });
  try {
    const status = await settleOrder(orderId);
    return NextResponse.json({ result: 'SUCCESS', resultcode: '000', status });
  } catch (err) {
    console.error('[selcom webhook]', orderId, err);
    return NextResponse.json({ result: 'FAIL' }, { status: 500 });
  }
}

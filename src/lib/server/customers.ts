import 'server-only';
import { normalizePhone } from '@/lib/engine/loan';
import type { CustomerInput } from '@/lib/schemas';
import { badRequest } from './http';

export function customerFields(body: CustomerInput) {
  const phone = normalizePhone(body.phone);
  if (phone.length < 10) throw badRequest('phone_invalid', 'Phone number is not valid');
  const fullName = `${body.firstName} ${body.lastName}`.replace(/\s+/g, ' ').trim();
  const fix = (c: CustomerInput['guarantor']) => (c ? { ...c, phone: normalizePhone(c.phone) } : null);
  return {
    ...body,
    phone,
    altPhone: body.altPhone ? normalizePhone(body.altPhone) : '',
    fullName,
    nextOfKin: fix(body.nextOfKin),
    guarantor: fix(body.guarantor),
  };
}

export function searchTokens(c: { fullName: string; phone: string; nationalId?: string; customerNumber?: string }) {
  const words = c.fullName.toLowerCase().split(/\s+/).filter(Boolean);
  return Array.from(new Set([...words, c.phone, c.phone.slice(-9), (c.nationalId || '').toLowerCase(), (c.customerNumber || '').toLowerCase()].filter(Boolean)));
}

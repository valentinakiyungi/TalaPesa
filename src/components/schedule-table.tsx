'use client';

import { installmentOutstanding, installmentStatus, type Installment } from '@/lib/engine/loan';
import { useI18n } from '@/lib/i18n';
import { formatDate, formatNumber } from '@/lib/utils';
import { StatusBadge, Table, Td, Th } from './ui';

/** Repayment schedule. With `asOf`, shows payments, late fees and per-installment status. */
export function ScheduleTable({ schedule, asOf }: { schedule: Installment[]; asOf?: string }) {
  const { t, locale } = useI18n();
  const tracking = !!asOf;
  const totals = schedule.reduce(
    (s, i) => ({
      principal: s.principal + i.principal,
      interest: s.interest + i.interest,
      amount: s.amount + i.amount,
      penalty: s.penalty + i.penalty,
      paid: s.paid + i.paidPrincipal + i.paidInterest + i.paidPenalty,
      out: s.out + installmentOutstanding(i),
    }),
    { principal: 0, interest: 0, amount: 0, penalty: 0, paid: 0, out: 0 },
  );
  return (
    <Table className="min-w-[560px]">
      <thead>
        <tr>
          <Th>{t('schedule.no')}</Th>
          <Th>{t('schedule.due')}</Th>
          <Th align="right">{t('schedule.principal')}</Th>
          <Th align="right">{t('schedule.interest')}</Th>
          <Th align="right">{t('schedule.installment')}</Th>
          {tracking && <Th align="right">{t('schedule.penalty')}</Th>}
          {tracking && <Th align="right">{t('schedule.paid')}</Th>}
          {tracking && <Th align="right">{t('schedule.outstanding')}</Th>}
          {tracking && <Th>{t('common.status')}</Th>}
        </tr>
      </thead>
      <tbody>
        {schedule.map((i) => (
          <tr key={i.n}>
            <Td className="tabular-nums text-ink-500">{i.n}</Td>
            <Td className="whitespace-nowrap">{formatDate(i.dueDate, locale)}</Td>
            <Td align="right">{formatNumber(i.principal)}</Td>
            <Td align="right">{formatNumber(i.interest)}</Td>
            <Td align="right" className="font-medium text-ink-950">
              {formatNumber(i.amount)}
            </Td>
            {tracking && <Td align="right" className={i.penalty ? 'text-red-700' : 'text-ink-400'}>{i.penalty ? formatNumber(i.penalty) : '—'}</Td>}
            {tracking && <Td align="right">{formatNumber(i.paidPrincipal + i.paidInterest + i.paidPenalty)}</Td>}
            {tracking && <Td align="right">{formatNumber(installmentOutstanding(i))}</Td>}
            {tracking && (
              <Td>
                <StatusBadge status={installmentStatus(i, asOf!)} />
              </Td>
            )}
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="font-medium">
          <Td />
          <Td>{t('common.total')}</Td>
          <Td align="right">{formatNumber(totals.principal)}</Td>
          <Td align="right">{formatNumber(totals.interest)}</Td>
          <Td align="right">{formatNumber(totals.amount)}</Td>
          {tracking && <Td align="right">{formatNumber(totals.penalty)}</Td>}
          {tracking && <Td align="right">{formatNumber(totals.paid)}</Td>}
          {tracking && <Td align="right">{formatNumber(totals.out)}</Td>}
          {tracking && <Td />}
        </tr>
      </tfoot>
    </Table>
  );
}

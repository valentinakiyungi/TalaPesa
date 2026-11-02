'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { WalletCards } from 'lucide-react';
import { EmptyState, Field, Input, PageHeader, PageLoader, Panel, StatusBadge, Table, Td, Th } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { todayIso } from '@/lib/engine/loan';
import { useOrgCollection } from '@/lib/hooks';
import { useI18n } from '@/lib/i18n';
import type { Payment } from '@/lib/types';
import { downloadCsv, formatDate, formatMoney, formatNumber } from '@/lib/utils';

export default function PaymentsPage() {
  const { t, locale } = useI18n();
  const { org } = useAuth();
  const today = todayIso(org?.settings.timeZone);
  const [from, setFrom] = useState(today.slice(0, 8) + '01');
  const [to, setTo] = useState(today);
  const { data, loading } = useOrgCollection<Payment>('payments', { where: [['date', '>=', from], ['date', '<=', to]], orderBy: ['date', 'desc'] });

  const summary = useMemo(() => {
    const done = data.filter((p) => p.status === 'completed');
    const byMethod = new Map<string, number>();
    done.forEach((p) => byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + p.amount));
    return { total: done.reduce((s, p) => s + p.amount, 0), count: done.length, byMethod: [...byMethod.entries()].sort((a, b) => b[1] - a[1]) };
  }, [data]);

  const cur = org?.settings.currency;

  return (
    <>
      <PageHeader
        title={t('payments.title')}
        actions={
          data.length > 0 && (
            <button
              className="text-sm text-ink-600 hover:text-ink-900"
              onClick={() =>
                downloadCsv(`payments-${from}-${to}.csv`, [
                  ['Date', 'Receipt', 'Loan', 'Customer', 'Amount', 'Principal', 'Interest', 'Late fee', 'Method', 'Reference', 'Received by', 'Status'],
                  ...data.map((p) => [p.date, p.receiptNumber, p.loanNumber, p.customerName, p.amount, p.allocation?.principal, p.allocation?.interest, p.allocation?.penalty, p.method, p.reference, p.receivedByName, p.status]),
                ])
              }
            >
              {t('common.export')}
            </button>
          )
        }
      />
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <Field label={t('common.from')}>
          <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label={t('common.to')}>
          <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <div className="ml-auto text-right">
          <p className="text-xs text-ink-500">
            {t('reports.collected')} ({summary.count})
          </p>
          <p className="font-display text-2xl font-semibold tabular-nums text-brand-800">{formatMoney(summary.total, cur)}</p>
        </div>
      </div>
      {summary.byMethod.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {summary.byMethod.map(([m, amt]) => (
            <span key={m} className="rounded-lg border border-ink-100 bg-white px-3 py-1.5 text-sm">
              {t(`payments.method.${m as Payment['method']}`)} <span className="ml-1 font-medium tabular-nums">{formatNumber(amt)}</span>
            </span>
          ))}
        </div>
      )}
      <Panel padded={false}>
        {loading ? (
          <PageLoader />
        ) : data.length === 0 ? (
          <EmptyState icon={<WalletCards className="h-8 w-8" />} title={t('payments.empty')} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t('common.date')}</Th>
                <Th>{t('payments.receiptNo')}</Th>
                <Th>{t('loans.customer')}</Th>
                <Th>{t('common.method')}</Th>
                <Th>{t('payments.receivedBy')}</Th>
                <Th align="right">{t('common.amount')}</Th>
                <Th>{t('common.status')}</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="hover:bg-ink-50/70">
                  <Td className="whitespace-nowrap">{formatDate(p.date, locale)}</Td>
                  <Td className="tabular-nums">{p.receiptNumber}</Td>
                  <Td>
                    <Link href={`/loans/${p.loanId}`} className="font-medium text-ink-950 hover:text-brand-800">
                      {p.customerName}
                    </Link>
                    <div className="text-xs text-ink-500">{p.loanNumber}</div>
                  </Td>
                  <Td>
                    {t(`payments.method.${p.method}`)}
                    {p.reference && <div className="text-xs text-ink-500">{p.reference}</div>}
                  </Td>
                  <Td>{p.receivedByName}</Td>
                  <Td align="right" className="font-medium">
                    {formatNumber(p.amount)}
                  </Td>
                  <Td>
                    <StatusBadge status={p.status} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  );
}

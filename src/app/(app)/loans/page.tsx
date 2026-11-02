'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Banknote, Plus, Search } from 'lucide-react';
import { ButtonLink, EmptyState, Input, PageHeader, PageLoader, Panel, StatusBadge, Table, Tabs, Td, Th } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useOrgCollection } from '@/lib/hooks';
import { useI18n } from '@/lib/i18n';
import { can } from '@/lib/plans';
import type { Loan, LoanStatus } from '@/lib/types';
import { cn, downloadCsv, formatDate, formatNumber } from '@/lib/utils';

type Tab = 'all' | 'pending' | 'approved' | 'active' | 'overdue' | 'closed' | 'other';
const TAB_STATUSES: Record<Tab, LoanStatus[] | null> = {
  all: null,
  pending: ['pending'],
  approved: ['approved'],
  active: ['active', 'overdue'],
  overdue: ['overdue'],
  closed: ['closed'],
  other: ['rejected', 'written_off'],
};

function LoansList() {
  const { t, locale } = useI18n();
  const { role } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'active';
  const [q, setQ] = useState('');
  const { data, loading } = useOrgCollection<Loan>('loans');

  const counts = useMemo(() => {
    const c = {} as Record<Tab, number>;
    (Object.keys(TAB_STATUSES) as Tab[]).forEach((k) => {
      const st = TAB_STATUSES[k];
      c[k] = st ? data.filter((l) => st.includes(l.status)).length : data.length;
    });
    return c;
  }, [data]);

  const rows = useMemo(() => {
    const st = TAB_STATUSES[tab] ?? null;
    const s = q.trim().toLowerCase();
    return data
      .filter((l) => !st || st.includes(l.status))
      .filter((l) => !s || l.loanNumber.toLowerCase().includes(s) || l.customerName.toLowerCase().includes(s) || l.customerPhone.includes(s.replace(/\D/g, '') || '§'))
      .sort((a, b) => (tab === 'overdue' ? b.daysOverdue - a.daysOverdue : b.loanNumber.localeCompare(a.loanNumber)));
  }, [data, tab, q]);

  if (loading) return <PageLoader />;

  const setTab = (v: Tab) => router.replace(`/loans?tab=${v}`);

  return (
    <>
      <PageHeader
        title={t('loans.title')}
        actions={
          <>
            {rows.length > 0 && (
              <button
                className="text-sm text-ink-600 hover:text-ink-900"
                onClick={() =>
                  downloadCsv(`loans-${tab}.csv`, [
                    ['Loan no', 'Customer', 'Phone', 'Product', 'Principal', 'Interest', 'Late fees', 'Total due', 'Paid', 'Balance', 'Past due', 'Days overdue', 'Next due', 'Status', 'Disbursed', 'Officer'],
                    ...rows.map((l) => [l.loanNumber, l.customerName, l.customerPhone, l.productName, l.principal, l.totalInterest, l.totalPenalty, l.totalDue, l.amountPaid, l.balance, l.arrears, l.daysOverdue, l.nextDueDate, l.status, l.disbursedDate, l.officerName]),
                  ])
                }
              >
                {t('common.export')}
              </button>
            )}
            {can(role, 'loans.create') && (
              <ButtonLink href="/loans/new">
                <Plus className="h-4 w-4" /> {t('loans.new')}
              </ButtonLink>
            )}
          </>
        }
      />
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={(['active', 'overdue', 'pending', 'approved', 'closed', 'other', 'all'] as Tab[]).map((id) => ({ id, label: t(`loans.tab.${id}`), count: counts[id] }))}
      />
      <Panel padded={false}>
        <div className="border-b border-ink-100 p-3">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('loans.searchPlaceholder')} className="pl-9" />
          </div>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={<Banknote className="h-8 w-8" />} title={t('loans.empty')} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t('loans.number')}</Th>
                <Th>{t('loans.customer')}</Th>
                <Th align="right">{t('loans.principal')}</Th>
                <Th align="right">{t('loans.balance')}</Th>
                <Th>{t('loans.nextDue')}</Th>
                <Th align="right">{t('loans.daysOverdue')}</Th>
                <Th>{t('common.status')}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => {
                const live = l.status === 'active' || l.status === 'overdue';
                return (
                  <tr key={l.id} className="cursor-pointer hover:bg-ink-50/70" onClick={() => router.push(`/loans/${l.id}`)}>
                    <Td>
                      <Link href={`/loans/${l.id}`} className="font-medium text-ink-950 hover:text-brand-800" onClick={(e) => e.stopPropagation()}>
                        {l.loanNumber}
                      </Link>
                      <div className="text-xs text-ink-500">{l.productName}</div>
                    </Td>
                    <Td>
                      <div className="text-ink-900">{l.customerName}</div>
                      <div className="text-xs tabular-nums text-ink-500">+{l.customerPhone}</div>
                    </Td>
                    <Td align="right">{formatNumber(l.principal)}</Td>
                    <Td align="right">{live ? formatNumber(l.balance) : '—'}</Td>
                    <Td>
                      {live && l.nextDueDate ? (
                        <>
                          <div>{formatDate(l.nextDueDate, locale)}</div>
                          <div className="text-xs tabular-nums text-ink-500">{formatNumber(l.nextDueAmount)}</div>
                        </>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td align="right" className={cn(l.daysOverdue > 0 && live && 'font-medium text-red-700')}>
                      {live && l.daysOverdue > 0 ? l.daysOverdue : '—'}
                    </Td>
                    <Td>
                      <StatusBadge status={l.status} />
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  );
}

export default function LoansPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LoansList />
    </Suspense>
  );
}

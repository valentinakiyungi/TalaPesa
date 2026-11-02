'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, UserPlus, Users } from 'lucide-react';
import { ButtonLink, EmptyState, Input, Money, PageHeader, PageLoader, Panel, StatusBadge, Table, Td, Th } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useOrgCollection } from '@/lib/hooks';
import { useI18n } from '@/lib/i18n';
import { can } from '@/lib/plans';
import type { Customer } from '@/lib/types';
import { downloadCsv, formatDate } from '@/lib/utils';

export default function CustomersPage() {
  const { t, locale } = useI18n();
  const { role, org } = useAuth();
  const { data, loading } = useOrgCollection<Customer>('customers', { orderBy: ['createdAt', 'desc'] });
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data;
    const digits = s.replace(/\D/g, '');
    return data.filter(
      (c) =>
        c.fullName.toLowerCase().includes(s) ||
        c.customerNumber?.toLowerCase().includes(s) ||
        (c.nationalId || '').toLowerCase().includes(s) ||
        (digits.length >= 3 && (c.phone.includes(digits) || c.phone.includes(digits.replace(/^0/, '')))),
    );
  }, [data, q]);

  if (loading) return <PageLoader />;

  return (
    <>
      <PageHeader
        title={t('customers.title')}
        description={`${data.length}`}
        actions={
          <>
            {data.length > 0 && (
              <button
                className="text-sm text-ink-600 hover:text-ink-900"
                onClick={() =>
                  downloadCsv('customers.csv', [
                    ['Number', 'Name', 'Phone', 'National ID', 'Region', 'Occupation', 'Monthly income', 'Status', 'Loans', 'Active loans', 'Total borrowed', 'Total repaid'],
                    ...data.map((c) => [c.customerNumber, c.fullName, c.phone, c.nationalId, c.region, c.occupation, c.monthlyIncome, c.status, c.stats?.loans, c.stats?.activeLoans, c.stats?.totalBorrowed, c.stats?.totalRepaid]),
                  ])
                }
              >
                {t('common.export')}
              </button>
            )}
            {can(role, 'customers.write') && (
              <ButtonLink href="/customers/new">
                <UserPlus className="h-4 w-4" /> {t('customers.new')}
              </ButtonLink>
            )}
          </>
        }
      />
      <Panel padded={false}>
        <div className="border-b border-ink-100 p-3">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('customers.searchPlaceholder')} className="pl-9" />
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title={data.length === 0 ? t('customers.empty') : t('common.noResults')}
            action={data.length === 0 && can(role, 'customers.write') && <ButtonLink href="/customers/new">{t('customers.new')}</ButtonLink>}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t('common.name')}</Th>
                <Th>{t('common.phone')}</Th>
                <Th>{t('customers.region')}</Th>
                <Th align="right">{t('dash.activeLoans')}</Th>
                <Th align="right">{t('customers.totalBorrowed')}</Th>
                <Th>{t('common.status')}</Th>
                <Th>{t('common.created')}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-ink-50/70">
                  <Td>
                    <Link href={`/customers/${c.id}`} className="font-medium text-ink-950 hover:text-brand-800">
                      {c.fullName}
                    </Link>
                    <div className="text-xs text-ink-500">{c.customerNumber}</div>
                  </Td>
                  <Td className="tabular-nums">+{c.phone}</Td>
                  <Td>{c.region || '—'}</Td>
                  <Td align="right">{c.stats?.activeLoans ?? 0}</Td>
                  <Td align="right">
                    <Money value={c.stats?.totalBorrowed ?? 0} currency={org?.settings.currency} />
                  </Td>
                  <Td>
                    <StatusBadge status={c.status} />
                  </Td>
                  <Td className="text-ink-500">{formatDate(c.createdAt, locale)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  );
}

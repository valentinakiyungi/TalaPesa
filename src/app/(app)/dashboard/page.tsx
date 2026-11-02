'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Plus, UserPlus } from 'lucide-react';
import { ButtonLink, EmptyState, Money, PageHeader, PageLoader, Panel, StatusBadge } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { addMonths, agingBucket, portfolioAtRisk, todayIso, type AgingBucket } from '@/lib/engine/loan';
import { useOrgCollection } from '@/lib/hooks';
import { useI18n } from '@/lib/i18n';
import { can } from '@/lib/plans';
import type { Loan, Payment } from '@/lib/types';
import { cn, formatDate, formatNumber, formatPercent } from '@/lib/utils';

const BUCKETS: AgingBucket[] = ['current', '1-30', '31-60', '61-90', '90+'];
const BUCKET_COLORS: Record<AgingBucket, string> = {
  current: 'bg-brand-600',
  '1-30': 'bg-gold-400',
  '31-60': 'bg-orange-500',
  '61-90': 'bg-red-600',
  '90+': 'bg-red-900',
};

function compactTzs(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

export default function DashboardPage() {
  const { t, locale } = useI18n();
  const { org, member, role } = useAuth();
  const tz = org?.settings?.timeZone;
  const today = todayIso(tz);
  const monthStart = today.slice(0, 8) + '01';
  const sixMonthsAgo = addMonths(monthStart, -5);

  const loans = useOrgCollection<Loan>('loans');
  const payments = useOrgCollection<Payment>('payments', { where: [['date', '>=', sixMonthsAgo]], orderBy: ['date', 'desc'] });

  const stats = useMemo(() => {
    const live = loans.data.filter((l) => l.status === 'active' || l.status === 'overdue');
    const completed = payments.data.filter((p) => p.status === 'completed');
    const months = Array.from({ length: 6 }, (_, i) => addMonths(sixMonthsAgo, i).slice(0, 7));
    const trend = months.map((m) => ({
      month: new Date(`${m}-01T00:00:00Z`).toLocaleDateString(locale === 'sw' ? 'sw-TZ' : 'en-GB', { month: 'short', timeZone: 'UTC' }),
      disbursed: loans.data.filter((l) => l.disbursedDate?.startsWith(m)).reduce((s, l) => s + l.principal, 0),
      collected: completed.filter((p) => p.date.startsWith(m)).reduce((s, p) => s + p.amount, 0),
    }));
    const aging = BUCKETS.map((b) => {
      const inBucket = live.filter((l) => agingBucket(l.daysOverdue) === b);
      return { bucket: b, count: inBucket.length, amount: inBucket.reduce((s, l) => s + l.balance, 0) };
    });
    return {
      outstanding: live.reduce((s, l) => s + l.balance, 0),
      activeCount: live.length,
      overdueCount: live.filter((l) => l.status === 'overdue').length,
      pending: loans.data.filter((l) => l.status === 'pending' || l.status === 'approved'),
      dueToday: live.filter((l) => l.nextDueDate && l.nextDueDate <= today),
      collectedMonth: completed.filter((p) => p.date >= monthStart).reduce((s, p) => s + p.amount, 0),
      disbursedMonth: loans.data.filter((l) => (l.disbursedDate ?? '') >= monthStart).reduce((s, l) => s + l.principal, 0),
      par30: portfolioAtRisk(live, 30),
      trend,
      aging,
      recent: completed.slice(0, 8),
    };
  }, [loans.data, payments.data, today, monthStart, sixMonthsAgo, locale]);

  if (loans.loading) return <PageLoader />;
  const cur = org?.settings?.currency || 'TZS';
  const firstName = (member?.name || '').split(' ')[0];

  if (loans.data.length === 0) {
    return (
      <>
        <PageHeader title={t('dash.greeting', { name: firstName })} description={formatDate(today, locale)} />
        <Panel>
          <EmptyState
            title={t('dash.empty.title')}
            body={t('dash.empty.body')}
            action={
              can(role, 'customers.write') && (
                <div className="flex flex-wrap justify-center gap-2">
                  <ButtonLink href="/customers/new">
                    <UserPlus className="h-4 w-4" /> {t('dash.quick.newCustomer')}
                  </ButtonLink>
                  <ButtonLink href="/settings?tab=products" variant="secondary">
                    {t('settings.tab.products')}
                  </ButtonLink>
                </div>
              )
            }
          />
        </Panel>
      </>
    );
  }

  const agingTotal = stats.aging.reduce((s, a) => s + a.amount, 0) || 1;

  return (
    <>
      <PageHeader
        title={t('dash.greeting', { name: firstName })}
        description={formatDate(today, locale)}
        actions={
          can(role, 'loans.create') && (
            <>
              <ButtonLink href="/customers/new" variant="secondary">
                <UserPlus className="h-4 w-4" /> {t('dash.quick.newCustomer')}
              </ButtonLink>
              <ButtonLink href="/loans/new">
                <Plus className="h-4 w-4" /> {t('dash.quick.newLoan')}
              </ButtonLink>
            </>
          )
        }
      />

      {/* Portfolio band */}
      <section className="overflow-hidden rounded-2xl bg-brand-950 text-white">
        <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-brand-950 p-5 sm:p-6">
            <p className="text-sm text-brand-200">{t('dash.portfolio')}</p>
            <p className="mt-2 font-display text-3xl font-semibold tabular-nums">
              <span className="mr-1 text-base font-medium text-brand-300">{cur}</span>
              {formatNumber(stats.outstanding)}
            </p>
            <p className="mt-1 text-sm text-brand-200">
              {stats.activeCount} {t('dash.activeLoans').toLowerCase()}
            </p>
          </div>
          <div className="bg-brand-950 p-5 sm:p-6">
            <p className="text-sm text-brand-200">{t('dash.collectedMonth')}</p>
            <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-gold-400">{formatNumber(stats.collectedMonth)}</p>
            <p className="mt-1 text-sm text-brand-200">
              {t('dash.disbursedMonth')}: <span className="tabular-nums text-white">{formatNumber(stats.disbursedMonth)}</span>
            </p>
          </div>
          <Link href="/loans?tab=overdue" className="bg-brand-950 p-5 transition-colors hover:bg-brand-900 sm:p-6">
            <p className="text-sm text-brand-200">{t('dash.par30')}</p>
            <p className={cn('mt-2 font-display text-3xl font-semibold tabular-nums', stats.par30 > 0.1 ? 'text-red-300' : 'text-white')}>{formatPercent(stats.par30)}</p>
            <p className="mt-1 text-sm text-brand-200">
              {stats.overdueCount} {t('dash.overdueLoans').toLowerCase()}
            </p>
          </Link>
          <Link href="/collections" className="bg-brand-950 p-5 transition-colors hover:bg-brand-900 sm:p-6">
            <p className="text-sm text-brand-200">{t('dash.dueToday')}</p>
            <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{stats.dueToday.length}</p>
            <p className="mt-1 text-sm text-brand-200">
              {cur} <span className="tabular-nums text-white">{formatNumber(stats.dueToday.reduce((s, l) => s + (l.arrears || l.nextDueAmount), 0))}</span>
            </p>
          </Link>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title={t('dash.trend')} className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.trend} barGap={4} margin={{ left: -12, right: 4, top: 4 }}>
                <CartesianGrid vertical={false} stroke="#e3e6e4" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#616d66', fontSize: 12 }} />
                <YAxis tickFormatter={compactTzs} tickLine={false} axisLine={false} tick={{ fill: '#616d66', fontSize: 12 }} />
                <Tooltip formatter={(v) => `${cur} ${formatNumber(Number(v))}`} cursor={{ fill: '#f6f7f6' }} contentStyle={{ borderRadius: 8, border: '1px solid #e3e6e4', fontSize: 13 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13 }} />
                <Bar dataKey="disbursed" name={t('dash.trend.disbursed')} fill="#136445" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="collected" name={t('dash.trend.collected')} fill="#e29b22" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title={t('dash.aging')}>
          <div className="flex h-3 overflow-hidden rounded-full bg-ink-100">
            {stats.aging.map((a) => (
              <div key={a.bucket} className={BUCKET_COLORS[a.bucket]} style={{ width: `${(a.amount / agingTotal) * 100}%` }} title={a.bucket} />
            ))}
          </div>
          <ul className="mt-4 space-y-2.5 text-sm">
            {stats.aging.map((a) => (
              <li key={a.bucket} className="flex items-center gap-3">
                <span className={cn('h-2.5 w-2.5 rounded-full', BUCKET_COLORS[a.bucket])} />
                <span className="flex-1 text-ink-700">{a.bucket === 'current' ? t('status.active') : `${a.bucket} ${t('common.days')}`}</span>
                <span className="w-8 text-right tabular-nums text-ink-500">{a.count}</span>
                <span className="w-28 text-right tabular-nums text-ink-900">{formatNumber(a.amount)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title={t('dash.pendingApproval')} padded={false} actions={<Link href="/loans?tab=pending" className="text-sm text-brand-800 hover:underline">{t('common.view')}</Link>}>
          {stats.pending.length === 0 ? (
            <p className="px-5 py-6 text-sm text-ink-500">{t('common.none')}</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {stats.pending.slice(0, 6).map((l) => (
                <li key={l.id}>
                  <Link href={`/loans/${l.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-ink-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">{l.customerName}</p>
                      <p className="text-xs text-ink-500">
                        {l.loanNumber} · {l.officerName}
                      </p>
                    </div>
                    <Money value={l.principal} currency={cur} className="text-sm" />
                    <StatusBadge status={l.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t('dash.recentPayments')} padded={false} actions={<Link href="/payments" className="text-sm text-brand-800 hover:underline">{t('common.view')}</Link>}>
          {stats.recent.length === 0 ? (
            <p className="px-5 py-6 text-sm text-ink-500">{t('payments.empty')}</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {stats.recent.map((p) => (
                <li key={p.id}>
                  <Link href={`/loans/${p.loanId}`} className="flex items-center gap-3 px-5 py-3 hover:bg-ink-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">{p.customerName}</p>
                      <p className="text-xs text-ink-500">
                        {formatDate(p.date, locale)} · {t(`payments.method.${p.method}`)}
                      </p>
                    </div>
                    <Money value={p.amount} currency={cur} className="text-sm font-medium text-brand-800" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

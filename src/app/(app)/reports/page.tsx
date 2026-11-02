'use client';

import { useMemo, useState } from 'react';
import { Field, Input, PageHeader, PageLoader, Panel, Select, Table, Td, Th } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { addDays, addMonths, agingBucket, portfolioAtRisk, todayIso, type AgingBucket } from '@/lib/engine/loan';
import { useOrgCollection } from '@/lib/hooks';
import { useI18n } from '@/lib/i18n';
import type { Loan, Payment } from '@/lib/types';
import { downloadCsv, formatNumber, formatPercent } from '@/lib/utils';

type Period = 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';
const BUCKETS: AgingBucket[] = ['current', '1-30', '31-60', '61-90', '90+'];

export default function ReportsPage() {
  const { t } = useI18n();
  const { org } = useAuth();
  const today = todayIso(org?.settings.timeZone);
  const monthStart = today.slice(0, 8) + '01';
  const [period, setPeriod] = useState<Period>('thisMonth');
  const [customFrom, setCustomFrom] = useState(monthStart);
  const [customTo, setCustomTo] = useState(today);

  const [from, to] = useMemo<[string, string]>(() => {
    switch (period) {
      case 'thisMonth':
        return [monthStart, today];
      case 'lastMonth': {
        const s = addMonths(monthStart, -1);
        return [s, addDays(monthStart, -1)];
      }
      case 'thisYear':
        return [today.slice(0, 4) + '-01-01', today];
      default:
        return [customFrom, customTo];
    }
  }, [period, monthStart, today, customFrom, customTo]);

  const loans = useOrgCollection<Loan>('loans');
  const payments = useOrgCollection<Payment>('payments', { where: [['date', '>=', from], ['date', '<=', to]] });

  const r = useMemo(() => {
    const inRange = (d?: string | null) => !!d && d >= from && d <= to;
    const disbursed = loans.data.filter((l) => inRange(l.disbursedDate));
    const paid = payments.data.filter((p) => p.status === 'completed');
    const live = loans.data.filter((l) => l.status === 'active' || l.status === 'overdue');
    const totalOutstanding = live.reduce((s, l) => s + l.balance, 0) || 1;

    const officers = new Map<string, { name: string; issued: number; issuedAmount: number; collected: number; active: number; outstanding: number; atRisk: number }>();
    const officer = (id: string, name: string) => {
      if (!officers.has(id)) officers.set(id, { name, issued: 0, issuedAmount: 0, collected: 0, active: 0, outstanding: 0, atRisk: 0 });
      return officers.get(id)!;
    };
    disbursed.forEach((l) => {
      const o = officer(l.officerId, l.officerName);
      o.issued++;
      o.issuedAmount += l.principal;
    });
    live.forEach((l) => {
      const o = officer(l.officerId, l.officerName);
      o.active++;
      o.outstanding += l.principalOutstanding;
      if (l.daysOverdue > 30) o.atRisk += l.principalOutstanding;
    });
    const loanOfficer = new Map(loans.data.map((l) => [l.id, l]));
    paid.forEach((p) => {
      const l = loanOfficer.get(p.loanId);
      if (l) officer(l.officerId, l.officerName).collected += p.amount;
    });

    const products = new Map<string, { count: number; outstanding: number; principal: number }>();
    live.forEach((l) => {
      const p = products.get(l.productName) ?? { count: 0, outstanding: 0, principal: 0 };
      p.count++;
      p.outstanding += l.balance;
      p.principal += l.principal;
      products.set(l.productName, p);
    });

    const methods = new Map<string, number>();
    paid.forEach((p) => methods.set(p.method, (methods.get(p.method) ?? 0) + p.amount));

    return {
      disbursedAmount: disbursed.reduce((s, l) => s + l.principal, 0),
      disbursedCount: disbursed.length,
      processingFees: disbursed.reduce((s, l) => s + (l.processingFee || 0), 0),
      collected: paid.reduce((s, p) => s + p.amount, 0),
      interest: paid.reduce((s, p) => s + (p.allocation?.interest ?? 0), 0),
      fees: paid.reduce((s, p) => s + (p.allocation?.penalty ?? 0), 0),
      writtenOff: loans.data.filter((l) => l.status === 'written_off' && inRange(l.closedDate)).reduce((s, l) => s + l.balance, 0),
      par30: portfolioAtRisk(live, 30),
      officers: [...officers.values()].sort((a, b) => b.outstanding - a.outstanding),
      aging: BUCKETS.map((b) => {
        const ls = live.filter((l) => agingBucket(l.daysOverdue) === b);
        const amt = ls.reduce((s, l) => s + l.balance, 0);
        return { bucket: b, count: ls.length, amount: amt, share: amt / totalOutstanding };
      }),
      products: [...products.entries()].sort((a, b) => b[1].outstanding - a[1].outstanding),
      methods: [...methods.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [loans.data, payments.data, from, to]);

  if (loans.loading) return <PageLoader />;
  const cur = org?.settings.currency || 'TZS';

  const tiles = [
    { label: t('reports.disbursed'), value: r.disbursedAmount, sub: `${r.disbursedCount} ${t('reports.loansIssued').toLowerCase()}` },
    { label: t('reports.collected'), value: r.collected, accent: true },
    { label: t('reports.interestEarned'), value: r.interest },
    { label: t('reports.feesEarned'), value: r.fees },
    { label: t('reports.processingFees'), value: r.processingFees },
    { label: t('reports.writtenOff'), value: r.writtenOff },
  ];

  return (
    <>
      <PageHeader
        title={t('reports.title')}
        actions={
          <div className="flex flex-wrap gap-4 text-sm">
            <button
              className="text-ink-600 hover:text-ink-900"
              onClick={() =>
                downloadCsv(`officers-${from}-${to}.csv`, [
                  ['Officer', 'Loans issued', 'Amount issued', 'Collected', 'Active loans', 'Principal outstanding', 'PAR30 amount'],
                  ...r.officers.map((o) => [o.name, o.issued, o.issuedAmount, o.collected, o.active, o.outstanding, o.atRisk]),
                ])
              }
            >
              {t('reports.byOfficer')} (CSV)
            </button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <Field label={t('reports.period')}>
          <Select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="w-48">
            <option value="thisMonth">{t('reports.thisMonth')}</option>
            <option value="lastMonth">{t('reports.lastMonth')}</option>
            <option value="thisYear">{t('reports.thisYear')}</option>
            <option value="custom">{t('reports.custom')}</option>
          </Select>
        </Field>
        {period === 'custom' && (
          <>
            <Field label={t('common.from')}>
              <Input type="date" value={customFrom} max={customTo} onChange={(e) => setCustomFrom(e.target.value)} />
            </Field>
            <Field label={t('common.to')}>
              <Input type="date" value={customTo} min={customFrom} onChange={(e) => setCustomTo(e.target.value)} />
            </Field>
          </>
        )}
        <p className="pb-2 text-sm text-ink-500">
          {from} → {to}
        </p>
      </div>

      <section className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink-100 bg-ink-100 md:grid-cols-3 xl:grid-cols-6">
        {tiles.map((tile) => (
          <div key={tile.label} className="bg-white px-4 py-4">
            <p className="text-xs text-ink-500">{tile.label}</p>
            <p className={`mt-1 font-display text-xl font-semibold tabular-nums ${tile.accent ? 'text-brand-800' : 'text-ink-950'}`}>{formatNumber(tile.value)}</p>
            {tile.sub && <p className="text-xs text-ink-500">{tile.sub}</p>}
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={t('reports.byOfficer')} padded={false} className="lg:col-span-2">
          <Table>
            <thead>
              <tr>
                <Th>{t('loans.officer')}</Th>
                <Th align="right">{t('reports.loansIssued')}</Th>
                <Th align="right">{t('reports.disbursed')}</Th>
                <Th align="right">{t('reports.collected')}</Th>
                <Th align="right">{t('dash.activeLoans')}</Th>
                <Th align="right">{t('reports.outstanding')}</Th>
                <Th align="right">PAR30</Th>
              </tr>
            </thead>
            <tbody>
              {r.officers.length === 0 && (
                <tr>
                  <Td className="text-ink-500">{t('common.none')}</Td>
                </tr>
              )}
              {r.officers.map((o) => (
                <tr key={o.name}>
                  <Td className="font-medium text-ink-950">{o.name}</Td>
                  <Td align="right">{o.issued}</Td>
                  <Td align="right">{formatNumber(o.issuedAmount)}</Td>
                  <Td align="right">{formatNumber(o.collected)}</Td>
                  <Td align="right">{o.active}</Td>
                  <Td align="right">{formatNumber(o.outstanding)}</Td>
                  <Td align="right" className={o.outstanding && o.atRisk / o.outstanding > 0.1 ? 'text-red-700' : ''}>
                    {formatPercent(o.outstanding ? o.atRisk / o.outstanding : 0)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>

        <Panel title={`${t('reports.aging')} · PAR30 ${formatPercent(r.par30)}`} padded={false}>
          <Table className="min-w-0">
            <thead>
              <tr>
                <Th>{t('reports.bucket')}</Th>
                <Th align="right">{t('reports.loansCount')}</Th>
                <Th align="right">
                  {t('reports.outstanding')} ({cur})
                </Th>
                <Th align="right">{t('reports.share')}</Th>
              </tr>
            </thead>
            <tbody>
              {r.aging.map((a) => (
                <tr key={a.bucket}>
                  <Td>{a.bucket === 'current' ? t('status.active') : a.bucket}</Td>
                  <Td align="right">{a.count}</Td>
                  <Td align="right">{formatNumber(a.amount)}</Td>
                  <Td align="right">{formatPercent(a.share)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>

        <div className="space-y-6">
          <Panel title={t('reports.byProduct')} padded={false}>
            <Table className="min-w-0">
              <thead>
                <tr>
                  <Th>{t('loans.product')}</Th>
                  <Th align="right">{t('reports.loansCount')}</Th>
                  <Th align="right">{t('reports.outstanding')}</Th>
                </tr>
              </thead>
              <tbody>
                {r.products.map(([name, p]) => (
                  <tr key={name}>
                    <Td>{name}</Td>
                    <Td align="right">{p.count}</Td>
                    <Td align="right">{formatNumber(p.outstanding)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Panel>
          <Panel title={t('reports.collectionsByMethod')} padded={false}>
            <Table className="min-w-0">
              <tbody>
                {r.methods.length === 0 && (
                  <tr>
                    <Td className="text-ink-500">{t('payments.empty')}</Td>
                  </tr>
                )}
                {r.methods.map(([m, amt]) => (
                  <tr key={m}>
                    <Td>{t(`payments.method.${m as Payment['method']}`)}</Td>
                    <Td align="right">{formatNumber(amt)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Panel>
        </div>
      </div>
    </>
  );
}

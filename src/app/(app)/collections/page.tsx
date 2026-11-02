'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Phone } from 'lucide-react';
import { Button, PageHeader, PageLoader, Panel, useToast } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { addDays, todayIso } from '@/lib/engine/loan';
import { useOrgCollection } from '@/lib/hooks';
import { useI18n } from '@/lib/i18n';
import { can } from '@/lib/plans';
import type { Loan } from '@/lib/types';
import { cn, formatDate, formatNumber } from '@/lib/utils';

function Group({ title, loans, tone, amount }: { title: string; loans: Loan[]; tone: 'red' | 'gold' | 'ink'; amount: (l: Loan) => number }) {
  const { t, locale } = useI18n();
  const { role, writable } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const total = loans.reduce((s, l) => s + amount(l), 0);
  const dot = { red: 'bg-red-600', gold: 'bg-gold-400', ink: 'bg-ink-300' }[tone];

  return (
    <Panel
      padded={false}
      title={
        <span className="flex items-center gap-2">
          <span className={cn('h-2.5 w-2.5 rounded-full', dot)} />
          {title}
          <span className="font-normal text-ink-500">
            · {loans.length} · <span className="tabular-nums">{formatNumber(total)}</span>
          </span>
        </span>
      }
      actions={
        loans.length > 0 &&
        can(role, 'sms.send') &&
        writable && (
          <Button
            size="sm"
            variant="secondary"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const r = await api<{ sent: number }>('/api/sms/bulk', { body: { loanIds: loans.map((l) => l.id).slice(0, 300) } });
                toast(t('collections.reminded', { n: r.sent }));
              } catch (err) {
                toast(errorMessage(err), 'error');
              }
              setBusy(false);
            }}
          >
            <MessageSquare className="h-4 w-4" /> {t('collections.remindAll', { n: loans.length })}
          </Button>
        )
      }
    >
      {loans.length === 0 ? (
        <p className="px-5 py-5 text-sm text-ink-500">{t('collections.empty')}</p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {loans.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3">
              <div className="min-w-0 flex-1">
                <Link href={`/loans/${l.id}`} className="font-medium text-ink-950 hover:text-brand-800">
                  {l.customerName}
                </Link>
                <p className="text-xs text-ink-500">
                  {l.loanNumber}
                  {l.daysOverdue > 0 ? ` · ${l.daysOverdue} ${t('common.days')}` : l.nextDueDate ? ` · ${formatDate(l.nextDueDate, locale)}` : ''}
                  {l.lastReminderDate ? ` · SMS ${formatDate(l.lastReminderDate, locale)}` : ''}
                </p>
              </div>
              <a href={`tel:+${l.customerPhone}`} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm tabular-nums text-brand-800 hover:bg-brand-50">
                <Phone className="h-3.5 w-3.5" /> +{l.customerPhone}
              </a>
              <span className={cn('w-28 text-right font-medium tabular-nums', tone === 'red' && 'text-red-700')}>{formatNumber(amount(l))}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export default function CollectionsPage() {
  const { t } = useI18n();
  const { org } = useAuth();
  const { data, loading } = useOrgCollection<Loan>('loans', { where: [['status', 'in', ['active', 'overdue']]] });
  const today = todayIso(org?.settings.timeZone);
  const weekAhead = addDays(today, 7);

  const groups = useMemo(() => {
    const overdue = data.filter((l) => l.daysOverdue > 0 && l.arrears > 0).sort((a, b) => b.daysOverdue - a.daysOverdue);
    const ids = new Set(overdue.map((l) => l.id));
    const dueToday = data.filter((l) => !ids.has(l.id) && l.nextDueDate === today);
    const soon = data
      .filter((l) => !ids.has(l.id) && l.nextDueDate && l.nextDueDate > today && l.nextDueDate <= weekAhead)
      .sort((a, b) => (a.nextDueDate ?? '').localeCompare(b.nextDueDate ?? ''));
    return { overdue, dueToday, soon };
  }, [data, today, weekAhead]);

  if (loading) return <PageLoader />;

  return (
    <>
      <PageHeader title={t('collections.title')} description={t('collections.subtitle')} />
      <div className="space-y-6">
        <Group title={t('collections.overdue')} loans={groups.overdue} tone="red" amount={(l) => l.arrears} />
        <Group title={t('collections.dueToday')} loans={groups.dueToday} tone="gold" amount={(l) => l.nextDueAmount} />
        <Group title={t('collections.dueSoon')} loans={groups.soon} tone="ink" amount={(l) => l.nextDueAmount} />
      </div>
    </>
  );
}

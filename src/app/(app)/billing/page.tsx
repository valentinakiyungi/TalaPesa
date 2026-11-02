'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';
import { Alert, Button, Modal, PageHeader, PageLoader, Panel, StatusBadge, Table, Td, Th, useToast } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useOrgCollection } from '@/lib/hooks';
import { useI18n } from '@/lib/i18n';
import { can, PAID_PLANS, PLANS } from '@/lib/plans';
import type { Invoice, Loan, Member, PlanId } from '@/lib/types';
import { cn, formatDate, formatMoney, formatNumber } from '@/lib/utils';

function BillingInner() {
  const { t, locale } = useI18n();
  const { org, role } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const invoices = useOrgCollection<Invoice>('invoices', { orderBy: ['createdAt', 'desc'], limit: 24 });
  const members = useOrgCollection<Member>('members', { where: [['status', '==', 'active']] });
  const live = useOrgCollection<Loan>('loans', { where: [['status', 'in', ['approved', 'active', 'overdue']]] });
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [testCheckout, setTestCheckout] = useState<{ orderId: string; plan: PlanId } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const checkedReturn = useRef(false);

  // Coming back from the Selcom checkout page.
  useEffect(() => {
    const orderId = params.get('order');
    if (!orderId || checkedReturn.current) return;
    checkedReturn.current = true;
    api<{ status: string }>('/api/billing/confirm-test', { body: { orderId } })
      .then((r) => r.status === 'completed' && toast(t('billing.success')))
      .catch(() => undefined)
      .finally(() => router.replace('/billing'));
  }, [params, router, t, toast]);

  if (!org) return <PageLoader />;
  const owner = can(role, 'billing.manage');
  const current = PLANS[org.plan];
  const until = org.planStatus === 'trialing' ? t('billing.trialEnds', { date: formatDate(org.trialEndsAt, locale) }) : org.currentPeriodEnd ? t('billing.renews', { date: formatDate(org.currentPeriodEnd, locale) }) : '';

  const checkout = async (plan: PlanId) => {
    setBusy(plan);
    try {
      const res = await api<{ testMode: boolean; orderId: string; url?: string }>('/api/billing/checkout', { body: { plan } });
      if (res.testMode) setTestCheckout({ orderId: res.orderId, plan });
      else if (res.url) window.location.href = res.url;
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
    setBusy(null);
  };

  return (
    <>
      <PageHeader title={t('billing.title')} />
      {!owner && <Alert tone="info" className="mb-6">{t('billing.ownerOnly')}</Alert>}

      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Panel title={t('billing.current')}>
          <div className="flex items-center gap-3">
            <p className="font-display text-2xl font-semibold text-ink-950">{current.name}</p>
            <StatusBadge status={org.planStatus} />
          </div>
          <p className="mt-1 text-sm text-ink-500">{until}</p>
        </Panel>
        <Panel title={t('billing.usage')}>
          <dl className="space-y-3 text-sm">
            {[
              { label: t('nav.team'), used: members.data.length, max: current.maxMembers, unlimited: current.maxMembers >= 1000 },
              { label: t('dash.activeLoans'), used: live.data.length, max: current.maxActiveLoans, unlimited: current.maxActiveLoans >= 1_000_000 },
            ].map((u) => (
              <div key={u.label}>
                <div className="flex justify-between">
                  <dt className="text-ink-600">{u.label}</dt>
                  <dd className="tabular-nums text-ink-900">
                    {formatNumber(u.used)} {u.unlimited ? '' : `/ ${formatNumber(u.max)}`}
                  </dd>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100">
                  <div className={cn('h-full rounded-full', u.used / u.max > 0.9 ? 'bg-red-600' : 'bg-brand-600')} style={{ width: `${Math.min(100, (u.used / u.max) * 100)}%` }} />
                </div>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {PAID_PLANS.map((id) => {
          const p = PLANS[id];
          const isCurrent = org.plan === id && org.planStatus === 'active';
          return (
            <div key={id} className={cn('flex flex-col rounded-2xl border bg-white p-6', isCurrent ? 'border-brand-600 ring-1 ring-brand-600' : 'border-ink-200')}>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-semibold text-ink-950">{p.name}</h3>
                {isCurrent && <span className="rounded-md bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800">{t('billing.currentBadge')}</span>}
              </div>
              <p className="mt-3">
                <span className="font-display text-3xl font-semibold tabular-nums">TZS {formatNumber(p.price)}</span>
                <span className="ml-1 text-sm text-ink-500">{t('plan.perMonth')}</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-ink-700">
                {[
                  p.maxMembers >= 1000 ? t('plan.membersUnlimited') : t('plan.members', { n: p.maxMembers }),
                  p.maxActiveLoans >= 1_000_000 ? t('plan.loansUnlimited') : t('plan.loans', { n: formatNumber(p.maxActiveLoans) }),
                  p.sms ? t('plan.sms') : t('plan.noSms'),
                  t('plan.mobileMoney'),
                ].map((l) => (
                  <li key={l} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" /> {l}
                  </li>
                ))}
              </ul>
              {owner && (
                <Button className="mt-6" variant={p.highlight ? 'primary' : 'secondary'} loading={busy === id} onClick={() => checkout(id)}>
                  {t('billing.payWith', { amount: formatMoney(p.price), plan: p.name })}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <Panel title={t('billing.invoices')} padded={false} className="mt-8">
        {invoices.data.length === 0 ? (
          <p className="px-5 py-6 text-sm text-ink-500">{t('billing.noInvoices')}</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t('common.date')}</Th>
                <Th>{t('admin.plan')}</Th>
                <Th align="right">{t('common.amount')}</Th>
                <Th>{t('common.to')}</Th>
                <Th>{t('common.status')}</Th>
              </tr>
            </thead>
            <tbody>
              {invoices.data.map((inv) => (
                <tr key={inv.id}>
                  <Td>{formatDate(inv.createdAt, locale)}</Td>
                  <Td>
                    {PLANS[inv.plan]?.name} {inv.testMode && <span className="text-xs text-ink-400">({t('common.testMode')})</span>}
                  </Td>
                  <Td align="right">{formatMoney(inv.amount)}</Td>
                  <Td>{inv.periodEnd ? formatDate(inv.periodEnd, locale) : '—'}</Td>
                  <Td>
                    <StatusBadge status={inv.status === 'paid' ? 'paid' : inv.status} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      <Modal
        open={!!testCheckout}
        onClose={() => setTestCheckout(null)}
        title={t('billing.checkoutTest')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTestCheckout(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              loading={confirming}
              onClick={async () => {
                if (!testCheckout) return;
                setConfirming(true);
                try {
                  await api('/api/billing/confirm-test', { body: { orderId: testCheckout.orderId } });
                  toast(t('billing.success'));
                  setTestCheckout(null);
                } catch (err) {
                  toast(errorMessage(err), 'error');
                }
                setConfirming(false);
              }}
            >
              {t('billing.pay')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-700">{testCheckout && t('billing.checkoutTestBody', { plan: PLANS[testCheckout.plan].name })}</p>
      </Modal>
    </>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <BillingInner />
    </Suspense>
  );
}

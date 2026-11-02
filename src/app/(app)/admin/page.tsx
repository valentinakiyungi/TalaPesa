'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, PageHeader, PageLoader, Panel, Select, StatusBadge, Table, Td, Th, useToast } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { PLANS } from '@/lib/plans';
import type { PlanId, PlanStatus } from '@/lib/types';
import { formatDate, formatMoney, formatNumber } from '@/lib/utils';

interface AdminOrg {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: PlanId;
  planStatus: PlanStatus;
  disabled: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  createdAt: string | null;
  customers: number;
  loans: number;
  activeLoans: number;
  members: number;
}

export default function AdminPage() {
  const { t, locale } = useI18n();
  const { profile } = useAuth();
  const toast = useToast();
  const [orgs, setOrgs] = useState<AdminOrg[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api<{ orgs: AdminOrg[] }>('/api/admin/orgs');
      setOrgs(r.orgs);
    } catch (err) {
      toast(errorMessage(err), 'error');
      setOrgs([]);
    }
  }, [toast]);

  useEffect(() => {
    if (profile?.platformAdmin) load();
  }, [profile, load]);

  if (!profile?.platformAdmin) return <Alert tone="warn">403</Alert>;
  if (!orgs) return <PageLoader />;

  const act = async (id: string, body: Record<string, unknown>) => {
    setBusy(id);
    try {
      await api(`/api/admin/orgs/${id}`, { body });
      await load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
    setBusy(null);
  };

  const paying = orgs.filter((o) => o.planStatus === 'active' && !o.disabled);
  const mrr = paying.reduce((s, o) => s + (PLANS[o.plan]?.price ?? 0), 0);

  return (
    <>
      <PageHeader title={t('admin.title')} />
      <section className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink-100 bg-ink-100 sm:grid-cols-4">
        {[
          { label: t('admin.orgs'), value: formatNumber(orgs.length) },
          { label: t('status.trialing'), value: formatNumber(orgs.filter((o) => o.planStatus === 'trialing').length) },
          { label: t('status.active'), value: formatNumber(paying.length) },
          { label: t('admin.mrr'), value: formatMoney(mrr) },
        ].map((s) => (
          <div key={s.label} className="bg-white px-4 py-3">
            <p className="text-xs text-ink-500">{s.label}</p>
            <p className="mt-0.5 font-display text-xl font-semibold tabular-nums">{s.value}</p>
          </div>
        ))}
      </section>
      <Panel padded={false}>
        <Table>
          <thead>
            <tr>
              <Th>{t('admin.orgs')}</Th>
              <Th>{t('admin.plan')}</Th>
              <Th align="right">{t('nav.team')}</Th>
              <Th align="right">{t('nav.customers')}</Th>
              <Th align="right">{t('dash.activeLoans')}</Th>
              <Th>{t('common.created')}</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id}>
                <Td>
                  <p className="font-medium text-ink-950">{o.name}</p>
                  <p className="text-xs text-ink-500">
                    {o.email} {o.phone && `· ${o.phone}`}
                  </p>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    {PLANS[o.plan]?.name} <StatusBadge status={o.disabled ? 'canceled' : o.planStatus} />
                  </div>
                  <p className="text-xs text-ink-500">→ {formatDate(o.planStatus === 'trialing' ? o.trialEndsAt : o.currentPeriodEnd, locale)}</p>
                </Td>
                <Td align="right">{o.members}</Td>
                <Td align="right">{o.customers}</Td>
                <Td align="right">{o.activeLoans}</Td>
                <Td className="text-ink-500">{formatDate(o.createdAt, locale)}</Td>
                <Td>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <Select
                      className="h-8 w-28"
                      value=""
                      disabled={busy === o.id}
                      aria-label={t('admin.setPlan')}
                      onChange={(e) => e.target.value && act(o.id, { action: 'set_plan', plan: e.target.value, months: 1 })}
                    >
                      <option value="">{t('admin.setPlan')}</option>
                      <option value="starter">Starter</option>
                      <option value="growth">Growth</option>
                      <option value="pro">Pro</option>
                    </Select>
                    <Button size="sm" variant="ghost" disabled={busy === o.id} onClick={() => act(o.id, { action: 'extend_trial' })}>
                      {t('admin.extendTrial')}
                    </Button>
                    <Button size="sm" variant="ghost" className={o.disabled ? '' : 'text-red-700'} disabled={busy === o.id} onClick={() => act(o.id, { action: o.disabled ? 'reactivate' : 'suspend' })}>
                      {o.disabled ? t('admin.enable') : t('admin.disable')}
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}

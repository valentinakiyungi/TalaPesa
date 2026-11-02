'use client';

import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Alert, Badge, Button, EmptyState, Field, Input, Modal, MoneyInput, Panel, Select, Textarea, Toggle, useToast } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { buildSchedule, summarizeSchedule, todayIso, type Frequency, type InterestMethod, type LateFeeType, type RatePeriod } from '@/lib/engine/loan';
import { useOrgCollection } from '@/lib/hooks';
import { useI18n } from '@/lib/i18n';
import { can } from '@/lib/plans';
import type { LoanProduct } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

type Draft = Omit<LoanProduct, 'id' | 'createdAt'>;

const blank: Draft = {
  name: '',
  description: '',
  interestRate: 10,
  ratePeriod: 'month',
  interestMethod: 'flat',
  frequency: 'monthly',
  minAmount: 50_000,
  maxAmount: 2_000_000,
  minInstallments: 1,
  maxInstallments: 12,
  processingFeePercent: 0,
  lateFeeType: 'percent',
  lateFeeValue: 5,
  graceDays: 3,
  active: true,
};

function ProductModal({ product, open, onClose }: { product: LoanProduct | null; open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const [d, setD] = useState<Draft>(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const { id: _id, createdAt: _c, ...rest } = product ?? ({ ...blank, id: '', createdAt: null } as LoanProduct);
      setD({ ...blank, ...rest });
      setError(null);
    }
  }, [open, product]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const num = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, (e.target.value === '' ? 0 : Number(e.target.value)) as never);

  const example = useMemo(() => {
    try {
      const n = Math.min(d.maxInstallments, Math.max(d.minInstallments, 3));
      const principal = Math.max(d.minAmount, Math.min(d.maxAmount, 500_000));
      const s = summarizeSchedule(buildSchedule({ principal, interestRate: d.interestRate, ratePeriod: d.ratePeriod, interestMethod: d.interestMethod, frequency: d.frequency, installments: n, startDate: todayIso() }));
      return { principal, n, s };
    } catch {
      return null;
    }
  }, [d]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={product ? t('settings.products.edit') : t('settings.products.new')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            loading={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                if (product) await api(`/api/products/${product.id}`, { method: 'PUT', body: d });
                else await api('/api/products', { body: d });
                toast(t('settings.saved'));
                onClose();
              } catch (err) {
                setError(errorMessage(err));
              }
              setBusy(false);
            }}
          >
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('common.name')} className="sm:col-span-2">
            <Input value={d.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label={t('loans.frequency')}>
            <Select value={d.frequency} onChange={(e) => set('frequency', e.target.value as Frequency)}>
              {(['daily', 'weekly', 'biweekly', 'monthly'] as Frequency[]).map((f) => (
                <option key={f} value={f}>
                  {t(`freq.${f}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('loans.rate')}>
            <div className="flex gap-2">
              <Input type="number" step="0.1" min={0} max={100} value={d.interestRate} onChange={num('interestRate')} className="w-24" />
              <Select value={d.ratePeriod} onChange={(e) => set('ratePeriod', e.target.value as RatePeriod)}>
                <option value="month">% {t('ratePeriod.month')}</option>
                <option value="loan" disabled={d.interestMethod === 'reducing'}>
                  % {t('ratePeriod.loan')}
                </option>
              </Select>
            </div>
          </Field>
          <Field label={t('loans.interest')}>
            <Select
              value={d.interestMethod}
              onChange={(e) => {
                const m = e.target.value as InterestMethod;
                setD((p) => ({ ...p, interestMethod: m, ratePeriod: m === 'reducing' ? 'month' : p.ratePeriod }));
              }}
            >
              <option value="flat">{t('method.flat')}</option>
              <option value="reducing">{t('method.reducing')}</option>
            </Select>
          </Field>
          <Field label={`${t('loans.processingFee')} (%)`}>
            <Input type="number" step="0.1" min={0} max={50} value={d.processingFeePercent} onChange={num('processingFeePercent')} />
          </Field>
          <Field label={`${t('settings.products.minMax')} (min)`}>
            <MoneyInput value={d.minAmount} onChange={(v) => set('minAmount', v === '' ? 0 : v)} />
          </Field>
          <Field label={`${t('settings.products.minMax')} (max)`}>
            <MoneyInput value={d.maxAmount} onChange={(v) => set('maxAmount', v === '' ? 0 : v)} />
          </Field>
          <Field label={`${t('settings.products.installmentRange')} (min)`}>
            <Input type="number" min={1} max={520} value={d.minInstallments} onChange={num('minInstallments')} />
          </Field>
          <Field label={`${t('settings.products.installmentRange')} (max)`}>
            <Input type="number" min={1} max={520} value={d.maxInstallments} onChange={num('maxInstallments')} />
          </Field>
          <Field label={t('loans.lateFee')}>
            <div className="flex gap-2">
              <Select value={d.lateFeeType} onChange={(e) => set('lateFeeType', e.target.value as LateFeeType)}>
                <option value="none">{t('common.none')}</option>
                <option value="percent">% {t('schedule.installment').toLowerCase()}</option>
                <option value="fixed">{t('common.amount')}</option>
              </Select>
              {d.lateFeeType !== 'none' && <Input type="number" min={0} value={d.lateFeeValue} onChange={num('lateFeeValue')} className="w-28" />}
            </div>
          </Field>
          <Field label={`${t('loans.grace')} (${t('common.days')})`}>
            <Input type="number" min={0} max={90} value={d.graceDays} onChange={num('graceDays')} />
          </Field>
          <Field label={t('common.notes')} className="sm:col-span-2">
            <Textarea value={d.description ?? ''} onChange={(e) => set('description', e.target.value)} className="min-h-[60px]" />
          </Field>
        </div>
        <Toggle checked={d.active} onChange={(v) => set('active', v)} label={t('settings.products.active')} />
        {example && (
          <p className="rounded-lg bg-ink-50 px-4 py-3 text-sm text-ink-700">
            {t('settings.products.example', { amount: formatNumber(example.principal), n: example.n, unit: t(`freqUnit.${d.frequency}`) })}:{' '}
            <strong className="tabular-nums">{formatNumber(example.s.firstInstallment)}</strong> × {example.n} = <strong className="tabular-nums">{formatNumber(example.s.totalRepayable)}</strong>
          </p>
        )}
        {error && <Alert tone="error">{error}</Alert>}
      </div>
    </Modal>
  );
}

export function ProductsSettings() {
  const { t } = useI18n();
  const { role, writable } = useAuth();
  const { data } = useOrgCollection<LoanProduct>('products');
  const [editing, setEditing] = useState<LoanProduct | null>(null);
  const [open, setOpen] = useState(false);
  const manage = can(role, 'settings.manage') && writable;

  return (
    <>
      <Panel
        title={t('settings.tab.products')}
        padded={false}
        actions={
          manage && (
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> {t('settings.products.new')}
            </Button>
          )
        }
      >
        {data.length === 0 ? (
          <EmptyState title={t('settings.products.empty')} />
        ) : (
          <ul className="divide-y divide-ink-100">
            {data.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium text-ink-950">
                    {p.name} {!p.active && <Badge className="bg-ink-100 text-ink-600 ring-ink-200">{t('settings.products.inactive')}</Badge>}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-500">
                    {p.interestRate}% {t(`ratePeriod.${p.ratePeriod}`)}, {t(`method.${p.interestMethod}`).toLowerCase()}, {t(`freq.${p.frequency}`).toLowerCase()} · {formatNumber(p.minAmount)}–{formatNumber(p.maxAmount)} · {p.minInstallments}–{p.maxInstallments} {t(`freqUnit.${p.frequency}`)}
                  </p>
                </div>
                {manage && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditing(p);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" /> {t('common.edit')}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <ProductModal product={editing} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

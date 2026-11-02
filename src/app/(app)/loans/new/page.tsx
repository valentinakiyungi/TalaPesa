'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { ScheduleTable } from '@/components/schedule-table';
import { Alert, Button, ButtonLink, Field, Input, MoneyInput, PageHeader, PageLoader, Panel, Select, Textarea, Toggle, useToast } from '@/components/ui';
import { api, ApiClientError, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { buildSchedule, summarizeSchedule, todayIso, validateTerms } from '@/lib/engine/loan';
import { useOrgCollection } from '@/lib/hooks';
import { useI18n, type MessageKey } from '@/lib/i18n';
import type { Contact, Customer, LoanProduct } from '@/lib/types';
import { cn, formatMoney, formatNumber } from '@/lib/utils';

const emptyContact: Contact = { name: '', phone: '', relation: '', nationalId: '', address: '' };

function NewLoanForm() {
  const { t } = useI18n();
  const { org, writable } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const params = useSearchParams();
  const customers = useOrgCollection<Customer>('customers');
  const products = useOrgCollection<LoanProduct>('products', { where: [['active', '==', true]] });

  const [customerId, setCustomerId] = useState(params.get('customer') || '');
  const [customerQuery, setCustomerQuery] = useState('');
  const [productId, setProductId] = useState('');
  const [principal, setPrincipal] = useState<number | ''>('');
  const [installments, setInstallments] = useState<number | ''>('');
  const [purpose, setPurpose] = useState('');
  const [collateral, setCollateral] = useState('');
  const [useSaved, setUseSaved] = useState(true);
  const [guarantor, setGuarantor] = useState<Contact>(emptyContact);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customer = customers.data.find((c) => c.id === customerId) ?? null;
  const product = products.data.find((p) => p.id === productId) ?? null;
  const cur = org?.settings.currency || 'TZS';

  useEffect(() => {
    if (!productId && products.data.length) setProductId(products.data[0].id);
  }, [products.data, productId]);
  useEffect(() => {
    if (product && installments === '') setInstallments(product.minInstallments === product.maxInstallments ? product.minInstallments : Math.min(product.maxInstallments, Math.max(product.minInstallments, 3)));
  }, [product, installments]);
  useEffect(() => setUseSaved(!!customer?.guarantor), [customer]);

  const customerOptions = useMemo(() => {
    const s = customerQuery.trim().toLowerCase();
    return customers.data
      .filter((c) => c.status === 'active')
      .filter((c) => !s || c.fullName.toLowerCase().includes(s) || c.phone.includes(s.replace(/\D/g, '') || '§') || c.customerNumber.toLowerCase().includes(s))
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
      .slice(0, 200);
  }, [customers.data, customerQuery]);

  const amountError =
    product && principal !== '' && (principal < product.minAmount || principal > product.maxAmount)
      ? t('loans.outOfRange', { min: formatNumber(product.minAmount), max: formatNumber(product.maxAmount) })
      : null;
  const installmentsError =
    product && installments !== '' && (installments < product.minInstallments || installments > product.maxInstallments)
      ? t('loans.installmentsRange', { min: product.minInstallments, max: product.maxInstallments })
      : null;

  const preview = useMemo(() => {
    if (!product || principal === '' || installments === '' || amountError || installmentsError) return null;
    const terms = {
      principal,
      interestRate: product.interestRate,
      ratePeriod: product.ratePeriod,
      interestMethod: product.interestMethod,
      frequency: product.frequency,
      installments,
      startDate: todayIso(org?.settings.timeZone),
    };
    if (validateTerms(terms)) return null;
    const schedule = buildSchedule(terms);
    return { schedule, sum: summarizeSchedule(schedule), fee: Math.round((principal * product.processingFeePercent) / 100) };
  }, [product, principal, installments, amountError, installmentsError, org]);

  if (customers.loading || products.loading) return <PageLoader />;

  if (products.data.length === 0) {
    return (
      <>
        <PageHeader title={t('loans.new')} back={{ href: '/loans', label: t('loans.title') }} />
        <Alert tone="warn">
          {t('settings.products.empty')}{' '}
          <ButtonLink href="/settings?tab=products" size="sm" variant="secondary" className="ml-2">
            {t('settings.tab.products')}
          </ButtonLink>
        </Alert>
      </>
    );
  }

  const guarantorValue = useSaved && customer?.guarantor ? customer.guarantor : guarantor.name.trim() || guarantor.phone.trim() ? guarantor : null;
  const needsGuarantor = !!org?.settings.requireGuarantor && !guarantorValue;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={t('loans.new')} back={{ href: '/loans', label: t('loans.title') }} />
      <form
        className="grid gap-6 lg:grid-cols-[1fr_360px]"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!customer || !product || !preview) return;
          setBusy(true);
          setError(null);
          try {
            const res = await api<{ id: string }>('/api/loans', {
              body: { customerId: customer.id, productId: product.id, principal, installments, purpose, collateral, guarantor: guarantorValue },
            });
            toast(t('loans.submitted'));
            router.push(`/loans/${res.id}`);
          } catch (err) {
            const code = err instanceof ApiClientError ? err.code : '';
            const map: Record<string, MessageKey> = { customer_limit: 'loans.limitExceeded', customer_blacklisted: 'loans.blacklisted' };
            setError(map[code] ? t(map[code]) : errorMessage(err));
            setBusy(false);
          }
        }}
      >
        <div className="space-y-6">
          <Panel title={t('loans.customer')}>
            {customer ? (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-ink-50 px-4 py-3">
                <div>
                  <p className="font-medium text-ink-950">{customer.fullName}</p>
                  <p className="text-sm text-ink-500">
                    {customer.customerNumber} · +{customer.phone} · {t('dash.activeLoans')}: {customer.stats?.activeLoans ?? 0}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setCustomerId('')}>
                  {t('common.edit')}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <Input value={customerQuery} onChange={(e) => setCustomerQuery(e.target.value)} placeholder={t('customers.searchPlaceholder')} className="pl-9" autoFocus />
                </div>
                <ul className="max-h-64 divide-y divide-ink-100 overflow-y-auto rounded-lg border border-ink-100">
                  {customerOptions.map((c) => (
                    <li key={c.id}>
                      <button type="button" onClick={() => setCustomerId(c.id)} className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-ink-50">
                        <span className="font-medium text-ink-900">{c.fullName}</span>
                        <span className="tabular-nums text-ink-500">+{c.phone}</span>
                      </button>
                    </li>
                  ))}
                  {customerOptions.length === 0 && <li className="px-3 py-3 text-sm text-ink-500">{t('common.noResults')}</li>}
                </ul>
                <ButtonLink href="/customers/new" variant="ghost" size="sm">
                  + {t('customers.new')}
                </ButtonLink>
              </div>
            )}
          </Panel>

          <Panel title={t('loans.product')}>
            <div className="space-y-4">
              <Field label={t('loans.product')}>
                <Select value={productId} onChange={(e) => { setProductId(e.target.value); setInstallments(''); }}>
                  {products.data.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
              {product && (
                <p className="text-sm text-ink-600">
                  {product.interestRate}% {t(`ratePeriod.${product.ratePeriod}`)}, {t(`method.${product.interestMethod}`).toLowerCase()}, {t(`freq.${product.frequency}`).toLowerCase()}
                  {product.processingFeePercent > 0 && `, ${t('loans.processingFee').toLowerCase()} ${product.processingFeePercent}%`}
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={`${t('loans.principal')} (${cur})`} error={amountError} hint={product ? `${formatNumber(product.minAmount)} – ${formatNumber(product.maxAmount)}` : undefined}>
                  <MoneyInput required value={principal} onChange={setPrincipal} placeholder="500,000" />
                </Field>
                <Field
                  label={`${t('loans.installments')} (${product ? t(`freqUnit.${product.frequency}`) : ''})`}
                  error={installmentsError}
                  hint={product ? `${product.minInstallments} – ${product.maxInstallments}` : undefined}
                >
                  <Input
                    type="number"
                    required
                    min={product?.minInstallments}
                    max={product?.maxInstallments}
                    value={installments}
                    onChange={(e) => setInstallments(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </Field>
              </div>
              <Field label={t('loans.purpose')}>
                <Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} className="min-h-[64px]" />
              </Field>
              <Field label={<>{t('loans.collateral')} <span className="font-normal text-ink-400">({t('common.optional')})</span></>}>
                <Input value={collateral} onChange={(e) => setCollateral(e.target.value)} />
              </Field>
            </div>
          </Panel>

          <Panel title={t('customers.guarantor')}>
            <div className="space-y-4">
              {customer?.guarantor && <Toggle checked={useSaved} onChange={setUseSaved} label={t('loans.useCustomerGuarantor')} description={`${customer.guarantor.name}, +${customer.guarantor.phone}`} />}
              {!(useSaved && customer?.guarantor) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t('common.name')}>
                    <Input value={guarantor.name} onChange={(e) => setGuarantor({ ...guarantor, name: e.target.value })} />
                  </Field>
                  <Field label={t('common.phone')}>
                    <Input type="tel" value={guarantor.phone} onChange={(e) => setGuarantor({ ...guarantor, phone: e.target.value })} />
                  </Field>
                  <Field label={t('customers.relation')}>
                    <Input value={guarantor.relation ?? ''} onChange={(e) => setGuarantor({ ...guarantor, relation: e.target.value })} />
                  </Field>
                  <Field label={t('customers.nationalId')}>
                    <Input value={guarantor.nationalId ?? ''} onChange={(e) => setGuarantor({ ...guarantor, nationalId: e.target.value })} />
                  </Field>
                </div>
              )}
            </div>
          </Panel>

          {preview && (
            <Panel title={t('loans.preview')} padded={false}>
              <ScheduleTable schedule={preview.schedule} />
            </Panel>
          )}
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl bg-brand-950 p-5 text-white">
            <p className="text-sm text-brand-200">{t('loans.totalDue')}</p>
            <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{preview ? formatMoney(preview.sum.totalRepayable, cur) : '—'}</p>
            <dl className="mt-5 space-y-2.5 text-sm">
              {[
                [t('loans.principal'), preview ? formatNumber(principal || 0) : '—'],
                [t('loans.interest'), preview ? formatNumber(preview.sum.totalInterest) : '—'],
                [`${t('schedule.installment')} × ${installments || 0}`, preview ? formatNumber(preview.sum.firstInstallment) : '—'],
                [t('loans.processingFee'), preview ? formatNumber(preview.fee) : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-brand-200">{k}</dt>
                  <dd className="tabular-nums">{v}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 border-t border-white/15 pt-2.5">
                <dt className="text-brand-200">{t('loans.netDisbursed')}</dt>
                <dd className="font-medium tabular-nums text-gold-400">{preview ? formatNumber((principal || 0) - preview.fee) : '—'}</dd>
              </div>
            </dl>
          </div>
          {error && (
            <Alert tone="error" className="mt-4">
              {error}
            </Alert>
          )}
          {needsGuarantor && customer && (
            <Alert tone="warn" className="mt-4">
              {t('customers.guarantor')}: {t('common.required')}
            </Alert>
          )}
          <Button type="submit" size="lg" className={cn('mt-4 w-full')} loading={busy} disabled={!customer || !preview || needsGuarantor || !writable}>
            {t('loans.submit')}
          </Button>
        </aside>
      </form>
    </div>
  );
}

export default function NewLoanPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <NewLoanForm />
    </Suspense>
  );
}

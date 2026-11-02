'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProductsSettings } from '@/components/settings/product-editor';
import { Alert, Badge, Button, Field, Input, PageHeader, PageLoader, Panel, Select, Tabs, Textarea, Toggle, useToast } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { SMS_TEMPLATES } from '@/lib/defaults';
import { useI18n, type MessageKey } from '@/lib/i18n';
import { can, PLANS } from '@/lib/plans';
import type { OrgSettings } from '@/lib/types';

type Tab = 'organization' | 'products' | 'notifications' | 'integrations' | 'profile';

function OrganizationSettings() {
  const { t } = useI18n();
  const { org, writable } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ name: '', email: '', phone: '', address: '', city: '', registrationNumber: '' });
  const [s, setS] = useState({ loanPrefix: 'TP', requireGuarantor: true, maxActiveLoansPerCustomer: 1 });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!org) return;
    setF({ name: org.name, email: org.email ?? '', phone: org.phone ?? '', address: org.address ?? '', city: org.city ?? '', registrationNumber: org.registrationNumber ?? '' });
    setS({ loanPrefix: org.settings.loanPrefix, requireGuarantor: org.settings.requireGuarantor, maxActiveLoansPerCustomer: org.settings.maxActiveLoansPerCustomer });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org?.id]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <Panel title={t('settings.tab.organization')}>
      <form
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api('/api/settings', { method: 'PATCH', body: { ...f, settings: s } });
            toast(t('settings.saved'));
          } catch (err) {
            toast(errorMessage(err), 'error');
          }
          setBusy(false);
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('settings.orgName')}>
            <Input required value={f.name} onChange={set('name')} />
          </Field>
          <Field label={t('settings.registration')}>
            <Input value={f.registrationNumber} onChange={set('registrationNumber')} />
          </Field>
          <Field label={t('common.phone')}>
            <Input value={f.phone} onChange={set('phone')} />
          </Field>
          <Field label={t('common.email')}>
            <Input type="email" value={f.email} onChange={set('email')} />
          </Field>
          <Field label={t('common.address')}>
            <Input value={f.address} onChange={set('address')} />
          </Field>
          <Field label={t('onboarding.city')}>
            <Input value={f.city} onChange={set('city')} />
          </Field>
          <Field label={t('settings.loanPrefix')} hint={`${s.loanPrefix || 'TP'}-000123`}>
            <Input value={s.loanPrefix} maxLength={6} onChange={(e) => setS({ ...s, loanPrefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} />
          </Field>
          <Field label={t('settings.maxActive')}>
            <Input type="number" min={1} max={20} value={s.maxActiveLoansPerCustomer} onChange={(e) => setS({ ...s, maxActiveLoansPerCustomer: Number(e.target.value) || 1 })} />
          </Field>
        </div>
        <Toggle checked={s.requireGuarantor} onChange={(v) => setS({ ...s, requireGuarantor: v })} label={t('settings.requireGuarantor')} />
        <div className="flex justify-end">
          <Button type="submit" loading={busy} disabled={!writable}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

const TPL_KEYS: (keyof OrgSettings['templates'])[] = ['disbursement', 'reminder', 'dueToday', 'overdue', 'receipt'];
const PLACEHOLDERS = '{name} {fullName} {loanNumber} {amount} {dueDate} {balance} {days} {receipt} {installment} {currency} {orgName}';

function NotificationSettings() {
  const { t } = useI18n();
  const { org, writable } = useAuth();
  const toast = useToast();
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [days, setDays] = useState(2);
  const [lang, setLang] = useState<'sw' | 'en'>('sw');
  const [tpl, setTpl] = useState<OrgSettings['templates']>(SMS_TEMPLATES.sw);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!org) return;
    setSmsEnabled(org.settings.smsEnabled);
    setDays(org.settings.reminderDaysBefore);
    setLang(org.settings.smsLanguage);
    setTpl(org.settings.templates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org?.id]);

  if (!org) return null;
  const planHasSms = PLANS[org.plan].sms;

  return (
    <Panel title={t('settings.tab.notifications')}>
      <form
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api('/api/settings', { method: 'PATCH', body: { settings: { smsEnabled, reminderDaysBefore: days, smsLanguage: lang, templates: tpl } } });
            toast(t('settings.saved'));
          } catch (err) {
            toast(errorMessage(err), 'error');
          }
          setBusy(false);
        }}
      >
        {!planHasSms && <Alert tone="info">{t('sms.planNote')}</Alert>}
        {!org.integrations?.smsConfigured && <Alert tone="warn">{t('sms.simulatedNote')}</Alert>}
        <Toggle checked={smsEnabled} onChange={setSmsEnabled} label={t('settings.sms.enabled')} disabled={!planHasSms} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('settings.sms.daysBefore')}>
            <Input type="number" min={0} max={14} value={days} onChange={(e) => setDays(Number(e.target.value) || 0)} />
          </Field>
          <Field label={t('settings.sms.language')}>
            <Select value={lang} onChange={(e) => setLang(e.target.value as 'sw' | 'en')}>
              <option value="sw">Kiswahili</option>
              <option value="en">English</option>
            </Select>
          </Field>
        </div>
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink-900">{t('settings.sms.templates')}</h3>
            <Button size="sm" variant="ghost" onClick={() => setTpl({ ...SMS_TEMPLATES[lang] })}>
              {t('settings.sms.resetTemplates')}
            </Button>
          </div>
          <p className="mb-4 text-xs text-ink-500">{t('settings.sms.placeholders', { list: PLACEHOLDERS })}</p>
          <div className="space-y-4">
            {TPL_KEYS.map((k) => (
              <Field key={k} label={t(`settings.sms.tpl.${k}` as MessageKey)} hint={`${tpl[k].length} / 160`}>
                <Textarea value={tpl[k]} maxLength={480} onChange={(e) => setTpl({ ...tpl, [k]: e.target.value })} className="min-h-[72px]" />
              </Field>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={busy} disabled={!writable}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

interface IntegrationsView {
  selcom: { vendor: string; live: boolean; apiKey: string; hasSecret: boolean } | null;
  sms: { provider: 'beem' | 'africastalking'; senderId: string; username: string; apiKey: string; hasSecret: boolean } | null;
}

function IntegrationSettings() {
  const { t } = useI18n();
  const { writable } = useAuth();
  const toast = useToast();
  const [view, setView] = useState<IntegrationsView | null>(null);
  const [selcom, setSelcom] = useState({ apiKey: '', apiSecret: '', vendor: '', live: true });
  const [sms, setSms] = useState({ provider: 'beem' as 'beem' | 'africastalking', apiKey: '', apiSecret: '', username: '', senderId: '' });
  const [testTo, setTestTo] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const v = await api<IntegrationsView>('/api/settings/integrations');
    setView(v);
    if (v.selcom) setSelcom((s) => ({ ...s, vendor: v.selcom!.vendor, live: v.selcom!.live }));
    if (v.sms) setSms((s) => ({ ...s, provider: v.sms!.provider, senderId: v.sms!.senderId, username: v.sms!.username }));
  };
  useEffect(() => {
    load().catch((err) => toast(errorMessage(err), 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (key: string, body: Record<string, unknown>) => {
    setBusy(key);
    try {
      await api('/api/settings/integrations', { method: 'PUT', body });
      await load();
      setSelcom((s) => ({ ...s, apiKey: '', apiSecret: '' }));
      setSms((s) => ({ ...s, apiKey: '', apiSecret: '' }));
      toast(t('settings.saved'));
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
    setBusy(null);
  };

  if (!view) return <PageLoader />;

  const status = (on: boolean) =>
    on ? <Badge className="bg-brand-50 text-brand-800 ring-brand-200">{t('settings.int.configured')}</Badge> : <Badge className="bg-ink-100 text-ink-600 ring-ink-200">{t('settings.int.notConfigured')}</Badge>;

  return (
    <div className="space-y-6">
      <Panel title={t('settings.int.selcom')} actions={status(!!view.selcom?.live)}>
        <p className="mb-4 text-sm text-ink-600">{t('settings.int.selcomHelp')}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t('settings.int.apiKey')} hint={view.selcom?.apiKey}>
            <Input value={selcom.apiKey} onChange={(e) => setSelcom({ ...selcom, apiKey: e.target.value })} autoComplete="off" />
          </Field>
          <Field label={t('settings.int.apiSecret')} hint={view.selcom?.hasSecret ? '••••••••' : undefined}>
            <Input type="password" value={selcom.apiSecret} onChange={(e) => setSelcom({ ...selcom, apiSecret: e.target.value })} autoComplete="new-password" />
          </Field>
          <Field label={t('settings.int.vendor')}>
            <Input value={selcom.vendor} onChange={(e) => setSelcom({ ...selcom, vendor: e.target.value })} />
          </Field>
        </div>
        <div className="mt-4">
          <Toggle checked={selcom.live} onChange={(v) => setSelcom({ ...selcom, live: v })} label={t('settings.int.live')} />
        </div>
        <p className="mt-3 text-xs text-ink-500">{t('settings.int.secretHint')}</p>
        <div className="mt-4 flex justify-end gap-2">
          {view.selcom && (
            <Button variant="ghost" loading={busy === 'selcom-off'} onClick={() => save('selcom-off', { selcom: null })} disabled={!writable}>
              {t('settings.int.disconnect')}
            </Button>
          )}
          <Button loading={busy === 'selcom'} onClick={() => save('selcom', { selcom })} disabled={!writable}>
            {t('common.save')}
          </Button>
        </div>
      </Panel>

      <Panel title={t('settings.int.sms')} actions={status(!!view.sms)}>
        <p className="mb-4 text-sm text-ink-600">{t('settings.int.smsHelp')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('settings.int.provider')}>
            <Select value={sms.provider} onChange={(e) => setSms({ ...sms, provider: e.target.value as 'beem' | 'africastalking' })}>
              <option value="beem">Beem Africa</option>
              <option value="africastalking">Africa’s Talking</option>
            </Select>
          </Field>
          <Field label={t('settings.int.senderId')} hint="max 11">
            <Input value={sms.senderId} maxLength={11} onChange={(e) => setSms({ ...sms, senderId: e.target.value })} />
          </Field>
          <Field label={t('settings.int.apiKey')} hint={view.sms?.provider === sms.provider ? view.sms?.apiKey : undefined}>
            <Input value={sms.apiKey} onChange={(e) => setSms({ ...sms, apiKey: e.target.value })} autoComplete="off" />
          </Field>
          {sms.provider === 'beem' ? (
            <Field label={t('settings.int.apiSecret')} hint={view.sms?.hasSecret && view.sms.provider === 'beem' ? '••••••••' : undefined}>
              <Input type="password" value={sms.apiSecret} onChange={(e) => setSms({ ...sms, apiSecret: e.target.value })} autoComplete="new-password" />
            </Field>
          ) : (
            <Field label={t('settings.int.username')}>
              <Input value={sms.username} onChange={(e) => setSms({ ...sms, username: e.target.value })} />
            </Field>
          )}
        </div>
        <p className="mt-3 text-xs text-ink-500">{t('settings.int.secretHint')}</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-end gap-2">
            <Field label={t('settings.int.testSms')}>
              <Input type="tel" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="0712 345 678" className="w-44" />
            </Field>
            <Button
              variant="secondary"
              loading={busy === 'test'}
              disabled={testTo.length < 9 || !writable}
              onClick={async () => {
                setBusy('test');
                try {
                  const r = await api<{ status: string; error?: string }>('/api/settings/integrations/test-sms', { body: { to: testTo } });
                  toast(`${t(`status.${r.status}` as MessageKey)}${r.error ? `: ${r.error}` : ''}`, r.status === 'failed' ? 'error' : 'success');
                } catch (err) {
                  toast(errorMessage(err), 'error');
                }
                setBusy(null);
              }}
            >
              {t('sms.send')}
            </Button>
          </div>
          <div className="flex gap-2">
            {view.sms && (
              <Button variant="ghost" loading={busy === 'sms-off'} onClick={() => save('sms-off', { sms: null })} disabled={!writable}>
                {t('settings.int.disconnect')}
              </Button>
            )}
            <Button loading={busy === 'sms'} onClick={() => save('sms', { sms })} disabled={!writable}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function ProfileSettings() {
  const { t } = useI18n();
  const { member, user } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(member?.name ?? '');
  const [phone, setPhone] = useState(member?.phone ?? '');
  const [busy, setBusy] = useState(false);
  return (
    <Panel title={t('settings.tab.profile')}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api('/api/profile', { method: 'PATCH', body: { name, phone } });
            toast(t('settings.saved'));
          } catch (err) {
            toast(errorMessage(err), 'error');
          }
          setBusy(false);
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('settings.profile.name')}>
            <Input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label={t('settings.profile.phone')}>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label={t('common.email')}>
            <Input value={user?.email ?? ''} disabled />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={busy}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function SettingsInner() {
  const { t } = useI18n();
  const { role } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const manager = can(role, 'settings.manage');
  const tabs: Tab[] = manager ? ['organization', 'products', 'notifications', 'integrations', 'profile'] : ['products', 'profile'];
  const requested = params.get('tab') as Tab | null;
  const tab: Tab = requested && tabs.includes(requested) ? requested : tabs[0];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t('settings.title')} />
      <Tabs<Tab> value={tab} onChange={(v) => router.replace(`/settings?tab=${v}`)} tabs={tabs.map((id) => ({ id, label: t(`settings.tab.${id}`) }))} />
      {tab === 'organization' && <OrganizationSettings />}
      {tab === 'products' && <ProductsSettings />}
      {tab === 'notifications' && <NotificationSettings />}
      {tab === 'integrations' && <IntegrationSettings />}
      {tab === 'profile' && <ProfileSettings />}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SettingsInner />
    </Suspense>
  );
}

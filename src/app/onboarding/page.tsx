'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo, LanguageSwitch } from '@/components/brand';
import { Alert, Button, Field, Input, PageLoader, Select } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

export default function OnboardingPage() {
  const { t, locale } = useI18n();
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [smsLanguage, setSmsLanguage] = useState<'sw' | 'en'>('sw');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (profile?.orgId) router.replace('/dashboard');
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (user?.displayName && !userName) setUserName(user.displayName);
  }, [user, userName]);

  useEffect(() => setSmsLanguage(locale), [locale]);

  if (loading || !user || profile?.orgId) return <PageLoader />;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-5 sm:px-8">
        <Logo />
        <div className="flex items-center gap-3">
          <LanguageSwitch />
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            {t('common.signOut')}
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-16 pt-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950">{t('onboarding.title')}</h1>
        <p className="mt-1 text-ink-500">{t('onboarding.subtitle')}</p>
        <form
          className="mt-8 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              await api('/api/orgs', { body: { name, phone, city, smsLanguage, userName } });
              router.replace('/dashboard');
            } catch (err) {
              setError(errorMessage(err));
              setBusy(false);
            }
          }}
        >
          <Field label={t('auth.fullName')} htmlFor="userName">
            <Input id="userName" required minLength={2} value={userName} onChange={(e) => setUserName(e.target.value)} />
          </Field>
          <Field label={t('onboarding.orgName')} htmlFor="orgName">
            <Input id="orgName" required minLength={2} placeholder="Mfano: Upendo Microfinance" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('onboarding.phone')} htmlFor="phone">
              <Input id="phone" type="tel" placeholder="0712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label={t('onboarding.city')} htmlFor="city">
              <Input id="city" placeholder="Mwanza" value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
          </div>
          <Field label={t('onboarding.smsLanguage')} htmlFor="smsLang">
            <Select id="smsLang" value={smsLanguage} onChange={(e) => setSmsLanguage(e.target.value as 'sw' | 'en')}>
              <option value="sw">Kiswahili</option>
              <option value="en">English</option>
            </Select>
          </Field>
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" size="lg" className="w-full" loading={busy}>
            {t('onboarding.create')}
          </Button>
          <p className="text-sm text-ink-500">{t('onboarding.invited')}</p>
        </form>
      </main>
    </div>
  );
}

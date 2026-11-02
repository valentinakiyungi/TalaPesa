'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useI18n } from '@/lib/i18n';
import { Alert, Button, Field, Input } from '@/components/ui';
import { authErrorKey, Divider, GoogleButton, useRedirectWhenSignedIn } from '@/components/auth-forms';

function LoginForm() {
  useRedirectWhenSignedIn();
  const { t } = useI18n();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = params.get('next');

  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950">{t('auth.login.title')}</h1>
      <p className="mt-1 text-ink-500">{t('auth.login.subtitle')}</p>
      <div className="mt-8">
        <GoogleButton />
        <Divider />
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              await signInWithEmailAndPassword(auth, email.trim(), password);
            } catch (err) {
              setError(t(authErrorKey(err)));
              setBusy(false);
            }
          }}
        >
          <Field label={t('auth.email')} htmlFor="email">
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label={t('auth.password')} htmlFor="password">
            <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" className="w-full" size="lg" loading={busy}>
            {t('auth.signIn')}
          </Button>
        </form>
        <div className="mt-5 flex justify-between text-sm">
          <Link href="/forgot-password" className="text-ink-600 hover:text-ink-900">
            {t('auth.forgot')}
          </Link>
          <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : '/signup'} className="font-medium text-brand-800 hover:text-brand-900">
            {t('auth.signUp')}
          </Link>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

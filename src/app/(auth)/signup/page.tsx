'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useI18n } from '@/lib/i18n';
import { TRIAL_DAYS } from '@/lib/plans';
import { Alert, Button, Field, Input } from '@/components/ui';
import { authErrorKey, Divider, GoogleButton, useRedirectWhenSignedIn } from '@/components/auth-forms';

function SignupForm() {
  useRedirectWhenSignedIn();
  const { t } = useI18n();
  const params = useSearchParams();
  const next = params.get('next');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(params.get('email') || '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950">{t('auth.signup.title')}</h1>
      <p className="mt-1 text-ink-500">{t('auth.signup.subtitle', { days: TRIAL_DAYS })}</p>
      <div className="mt-8">
        <GoogleButton />
        <Divider />
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (password.length < 8) return setError(t('auth.err.weak'));
            setBusy(true);
            setError(null);
            try {
              const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
              await updateProfile(cred.user, { displayName: name.trim() });
            } catch (err) {
              setError(t(authErrorKey(err)));
              setBusy(false);
            }
          }}
        >
          <Field label={t('auth.fullName')} htmlFor="name">
            <Input id="name" autoComplete="name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label={t('auth.email')} htmlFor="email">
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label={t('auth.password')} hint={t('auth.passwordHint')} htmlFor="password">
            <Input id="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" className="w-full" size="lg" loading={busy}>
            {t('auth.signUp')}
          </Button>
          <p className="text-xs text-ink-500">{t('auth.terms')}</p>
        </form>
        <p className="mt-5 text-sm text-ink-600">
          {t('auth.haveAccount')}{' '}
          <Link href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'} className="font-medium text-brand-800 hover:text-brand-900">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

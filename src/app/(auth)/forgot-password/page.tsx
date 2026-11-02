'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useI18n } from '@/lib/i18n';
import { Alert, Button, Field, Input } from '@/components/ui';

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950">{t('auth.reset.title')}</h1>
      <p className="mt-1 text-ink-500">{t('auth.reset.subtitle')}</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await sendPasswordResetEmail(auth, email.trim());
          } catch {
            // Don't reveal whether the email exists.
          }
          setSent(true);
          setBusy(false);
        }}
      >
        <Field label={t('auth.email')} htmlFor="email">
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        {sent && <Alert tone="success">{t('auth.reset.sent')}</Alert>}
        <Button type="submit" className="w-full" size="lg" loading={busy}>
          {t('auth.reset.send')}
        </Button>
      </form>
      <Link href="/login" className="mt-5 inline-block text-sm text-ink-600 hover:text-ink-900">
        ← {t('auth.signIn')}
      </Link>
    </>
  );
}

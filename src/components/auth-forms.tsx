'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/lib/auth';
import { useI18n, type MessageKey } from '@/lib/i18n';
import { Button } from '@/components/ui';

export function authErrorKey(err: unknown): MessageKey {
  const code = (err as { code?: string })?.code || '';
  if (code.includes('email-already-in-use')) return 'auth.err.exists';
  if (code.includes('weak-password')) return 'auth.err.weak';
  if (code.includes('too-many-requests')) return 'auth.err.tooMany';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found') || code.includes('invalid-email')) return 'auth.err.invalid';
  return 'common.error';
}

/** Sends signed-in users where they belong: ?next=, their dashboard, or onboarding. */
export function useRedirectWhenSignedIn() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    if (loading || !user) return;
    const next = params.get('next');
    if (next && next.startsWith('/') && !next.startsWith('//')) router.replace(next);
    else router.replace(profile?.orgId ? '/dashboard' : '/onboarding');
  }, [loading, user, profile, params, router]);
}

export function GoogleButton() {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <Button
        variant="secondary"
        className="w-full"
        loading={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await signInWithPopup(auth, new GoogleAuthProvider());
          } catch (err) {
            const code = (err as { code?: string }).code || '';
            if (!code.includes('popup-closed')) setError(t(authErrorKey(err)));
          } finally {
            setBusy(false);
          }
        }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
          <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
          <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
          <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
        </svg>
        {t('auth.google')}
      </Button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}

export function Divider() {
  const { t } = useI18n();
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-ink-400">
      <span className="h-px flex-1 bg-ink-200" />
      {t('auth.or')}
      <span className="h-px flex-1 bg-ink-200" />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo, LanguageSwitch } from '@/components/brand';
import { Alert, Button, ButtonLink, PageLoader } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n, type MessageKey } from '@/lib/i18n';

interface InviteInfo {
  orgName: string;
  email: string;
  role: string;
}

export default function InvitePage({ params }: { params: { orgId: string; token: string } }) {
  const { t } = useI18n();
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const here = `/invite/${params.orgId}/${params.token}`;

  useEffect(() => {
    fetch(`/api/invites/${params.orgId}/${params.token}`)
      .then(async (r) => (r.ok ? setInfo(await r.json()) : setInvalid(true)))
      .catch(() => setInvalid(true));
  }, [params.orgId, params.token]);

  if (loading || (!info && !invalid)) return <PageLoader />;

  const role = info ? t(`role.${info.role}` as MessageKey) : '';
  const wrongEmail = !!(user && info && user.email?.toLowerCase() !== info.email);
  const inOtherOrg = !!(profile?.orgId && profile.orgId !== params.orgId);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-5 sm:px-8">
        <Link href="/">
          <Logo />
        </Link>
        <LanguageSwitch />
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-10">
        {invalid || !info ? (
          <Alert tone="error">{t('invite.invalid')}</Alert>
        ) : (
          <>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950">{t('invite.title', { org: info.orgName })}</h1>
            <p className="mt-2 text-ink-600">{t('invite.subtitle', { role })}</p>
            <div className="mt-8 space-y-4">
              {!user ? (
                <>
                  <p className="text-sm text-ink-600">{t('invite.signInFirst', { email: info.email })}</p>
                  <div className="flex gap-2">
                    <ButtonLink href={`/signup?next=${encodeURIComponent(here)}&email=${encodeURIComponent(info.email)}`}>{t('auth.signUp')}</ButtonLink>
                    <ButtonLink href={`/login?next=${encodeURIComponent(here)}`} variant="secondary">
                      {t('auth.signIn')}
                    </ButtonLink>
                  </div>
                </>
              ) : wrongEmail ? (
                <>
                  <Alert tone="warn">{t('invite.wrongEmail', { email: info.email, current: user.email || '' })}</Alert>
                  <Button variant="secondary" onClick={() => signOut()}>
                    {t('common.signOut')}
                  </Button>
                </>
              ) : inOtherOrg ? (
                <Alert tone="warn">{t('invite.alreadyMember')}</Alert>
              ) : (
                <>
                  {error && <Alert tone="error">{error}</Alert>}
                  <Button
                    size="lg"
                    loading={busy}
                    onClick={async () => {
                      setBusy(true);
                      setError(null);
                      try {
                        await api(`/api/invites/${params.orgId}/${params.token}`, { body: { name: user.displayName || '' } });
                        router.replace('/dashboard');
                      } catch (err) {
                        setError(errorMessage(err));
                        setBusy(false);
                      }
                    }}
                  >
                    {t('invite.accept')}
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Banknote,
  BarChart3,
  CalendarClock,
  CreditCard,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Shield,
  UserRound,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import { LanguageSwitch, Logo } from '@/components/brand';
import { Alert, Button, ButtonLink, PageLoader } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useI18n, type MessageKey } from '@/lib/i18n';
import { can, PLANS, type Permission } from '@/lib/plans';
import { cn, initials, toDate } from '@/lib/utils';

interface NavItem {
  href: string;
  label: MessageKey;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
  admin?: boolean;
}

const NAV: NavItem[][] = [
  [
    { href: '/dashboard', label: 'nav.dashboard', icon: LayoutDashboard },
    { href: '/collections', label: 'nav.collections', icon: CalendarClock },
    { href: '/loans', label: 'nav.loans', icon: Banknote },
    { href: '/customers', label: 'nav.customers', icon: UserRound },
    { href: '/payments', label: 'nav.payments', icon: WalletCards },
    { href: '/messages', label: 'nav.messages', icon: MessageSquare },
    { href: '/reports', label: 'nav.reports', icon: BarChart3 },
  ],
  [
    { href: '/team', label: 'nav.team', icon: Users, permission: 'team.manage' },
    { href: '/settings', label: 'nav.settings', icon: Settings },
    { href: '/billing', label: 'nav.billing', icon: CreditCard, permission: 'billing.manage' },
    { href: '/activity', label: 'nav.activity', icon: History, permission: 'team.manage' },
    { href: '/admin', label: 'nav.admin', icon: Shield, admin: true },
  ],
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { role, profile } = useAuth();
  return (
    <nav className="space-y-6">
      {NAV.map((group, gi) => (
        <ul key={gi} className="space-y-0.5">
          {group
            .filter((item) => (item.admin ? profile?.platformAdmin : !item.permission || can(role, item.permission)))
            .map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-[0.92rem] transition-colors',
                      active ? 'bg-white/10 font-medium text-white' : 'text-brand-100/80 hover:bg-white/5 hover:text-white',
                    )}
                  >
                    <item.icon className={cn('h-[18px] w-[18px]', active ? 'text-gold-400' : 'text-brand-300')} />
                    {t(item.label)}
                  </Link>
                </li>
              );
            })}
        </ul>
      ))}
    </nav>
  );
}

function SidebarFooter() {
  const { member, org, signOut } = useAuth();
  const { t } = useI18n();
  return (
    <div className="space-y-4 border-t border-white/10 pt-4">
      <LanguageSwitch dark />
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-medium text-white">{initials(member?.name || '')}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{member?.name}</p>
          <p className="truncate text-xs text-brand-200/80">
            {t(`role.${member?.role ?? 'viewer'}` as MessageKey)} · {org ? PLANS[org.plan].name : ''}
          </p>
        </div>
        <button onClick={() => signOut()} className="rounded-md p-1.5 text-brand-200 hover:bg-white/10 hover:text-white" aria-label={t('common.signOut')} title={t('common.signOut')}>
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SubscriptionBanner() {
  const { org, writable, role } = useAuth();
  const { t } = useI18n();
  if (!org) return null;
  if (!writable) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-900 sm:px-8">
        <span>{org.planStatus === 'trialing' ? t('dash.trialEnded') : ''} {t('common.readOnly')}</span>
        {can(role, 'billing.manage') && (
          <ButtonLink href="/billing" size="sm" variant="danger">
            {t('common.choosePlan')}
          </ButtonLink>
        )}
      </div>
    );
  }
  if (org.planStatus === 'trialing') {
    const ends = toDate(org.trialEndsAt);
    const days = ends ? Math.max(0, Math.ceil((ends.getTime() - Date.now()) / 86_400_000)) : 0;
    if (days > 5) return null;
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold-400/40 bg-gold-400/15 px-4 py-2 text-sm text-ink-900 sm:px-8">
        <span>{t('dash.trialEnds', { days })}</span>
        {can(role, 'billing.manage') && (
          <Link href="/billing" className="font-medium underline underline-offset-4">
            {t('common.choosePlan')}
          </Link>
        )}
      </div>
    );
  }
  return null;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { loading, user, profile, org, member, signOut } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (!profile?.orgId) router.replace('/onboarding');
  }, [loading, user, profile, router, pathname]);

  useEffect(() => setOpen(false), [pathname]);

  if (loading || !user || !profile?.orgId) return <PageLoader />;

  if (!org || !member) {
    return (
      <div className="mx-auto max-w-md px-4 pt-24">
        <Alert tone="warn">This workspace is unavailable or your access was disabled. Ask the workspace owner for help. / Huna ruhusa kwenye eneo hili la kazi.</Alert>
        <Button variant="secondary" className="mt-4" onClick={() => signOut()}>
          {t('common.signOut')}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-brand-950 px-4 py-5 lg:flex">
        <Link href="/dashboard" className="mb-1 px-2">
          <Logo light />
        </Link>
        <p className="mb-6 truncate px-2 text-xs text-brand-200/70">{org.name}</p>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <SidebarFooter />
      </aside>

      <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-ink-100 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <button onClick={() => setOpen(true)} className="rounded-md p-1.5 text-ink-700 hover:bg-ink-100" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </button>
        <Logo />
        <span className="w-8" />
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-brand-950 px-4 py-5">
            <div className="mb-1 flex items-center justify-between px-2">
              <Logo light />
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-brand-100 hover:bg-white/10" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-6 truncate px-2 text-xs text-brand-200/70">{org.name}</p>
            <div className="flex-1 overflow-y-auto">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            <SidebarFooter />
          </aside>
        </div>
      )}

      <SubscriptionBanner />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}

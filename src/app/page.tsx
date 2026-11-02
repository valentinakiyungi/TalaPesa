'use client';

import Link from 'next/link';
import { BarChart3, Bell, Calculator, Check, ShieldCheck, Smartphone, Users } from 'lucide-react';
import { Logo, LanguageSwitch } from '@/components/brand';
import { ButtonLink } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { buildSchedule, summarizeSchedule } from '@/lib/engine/loan';
import { useI18n } from '@/lib/i18n';
import { PAID_PLANS, PLANS, TRIAL_DAYS } from '@/lib/plans';
import { cn, formatDate, formatNumber } from '@/lib/utils';

const SAMPLE = buildSchedule({
  principal: 600_000,
  interestRate: 10,
  ratePeriod: 'month',
  interestMethod: 'flat',
  frequency: 'monthly',
  installments: 6,
  startDate: '2026-06-05',
});
const SAMPLE_SUM = summarizeSchedule(SAMPLE);

function RepaymentCard() {
  const { t, locale } = useI18n();
  const paid = 3;
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-3 -z-10 rotate-2 rounded-3xl bg-brand-900/90" aria-hidden />
      <div className="rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-ink-500">{t('loans.number')} TP-000214</p>
            <p className="mt-0.5 font-display text-lg font-semibold text-ink-950">Neema Joseph Mollel</p>
            <p className="text-sm text-ink-500">{t('freq.monthly')} · 10% {t('ratePeriod.month')}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-500">{t('loans.balance')}</p>
            <p className="font-display text-xl font-semibold tabular-nums text-ink-950">{formatNumber(SAMPLE_SUM.totalRepayable - SAMPLE[0].amount * paid)}</p>
          </div>
        </div>
        <ol className="mt-5 divide-y divide-ink-100 border-y border-ink-100 text-sm">
          {SAMPLE.map((i) => {
            const state = i.n <= paid ? 'paid' : i.n === paid + 1 ? 'next' : 'later';
            return (
              <li key={i.n} className="flex items-center gap-3 py-2.5">
                <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums', state === 'paid' ? 'bg-brand-700 text-white' : state === 'next' ? 'bg-gold-400 text-ink-950' : 'bg-ink-100 text-ink-500')}>
                  {state === 'paid' ? <Check className="h-3.5 w-3.5" /> : i.n}
                </span>
                <span className={cn('flex-1', state === 'paid' ? 'text-ink-400' : 'text-ink-700')}>{formatDate(i.dueDate, locale)}</span>
                <span className={cn('tabular-nums', state === 'paid' ? 'text-ink-400 line-through decoration-ink-300' : state === 'next' ? 'font-semibold text-ink-950' : 'text-ink-700')}>{formatNumber(i.amount)}</span>
              </li>
            );
          })}
        </ol>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-brand-900">
            <Smartphone className="h-4 w-4" /> M-Pesa · 0754 ••• 812
          </span>
          <span className="font-medium tabular-nums text-brand-900">{formatNumber(SAMPLE[paid].amount)}</span>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { t } = useI18n();
  const { user, org } = useAuth();

  const features = [
    { icon: Calculator, title: t('landing.f1.title'), body: t('landing.f1.body') },
    { icon: Smartphone, title: t('landing.f2.title'), body: t('landing.f2.body') },
    { icon: Bell, title: t('landing.f3.title'), body: t('landing.f3.body') },
    { icon: BarChart3, title: t('landing.f4.title'), body: t('landing.f4.body') },
    { icon: Users, title: t('landing.f5.title'), body: t('landing.f5.body') },
    { icon: ShieldCheck, title: t('landing.f6.title'), body: t('landing.f6.body') },
  ];

  return (
    <div className="bg-[#f7f8f6]">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Logo />
        <div className="flex items-center gap-3">
          <LanguageSwitch className="hidden sm:inline-flex" />
          {user ? (
            <ButtonLink href={org ? '/dashboard' : '/onboarding'} size="sm">
              {t('nav.dashboard')}
            </ButtonLink>
          ) : (
            <ButtonLink href="/login" variant="secondary" size="sm">
              {t('landing.cta.login')}
            </ButtonLink>
          )}
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-8 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
        <div>
          <h1 className="font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-ink-950 sm:text-6xl">{t('landing.hero.title')}</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-600">{t('landing.hero.subtitle')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/signup" size="lg">
              {t('landing.cta.start', { days: TRIAL_DAYS })}
            </ButtonLink>
            <ButtonLink href="/login" size="lg" variant="secondary">
              {t('landing.cta.login')}
            </ButtonLink>
          </div>
          <p className="mt-6 text-sm text-ink-500">{t('landing.trust')}</p>
          <LanguageSwitch className="mt-6 sm:hidden" />
        </div>
        <RepaymentCard />
      </section>

      <section className="border-y border-ink-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-x-12 gap-y-10 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title}>
              <f.icon className="h-6 w-6 text-brand-700" strokeWidth={1.75} />
              <h3 className="mt-3 font-display text-lg font-semibold text-ink-950">{f.title}</h3>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6" id="pricing">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">{t('landing.pricing.title')}</h2>
        <p className="mt-2 text-ink-600">{t('landing.pricing.subtitle', { days: TRIAL_DAYS })}</p>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {PAID_PLANS.map((id) => {
            const p = PLANS[id];
            return (
              <div key={id} className={cn('flex flex-col rounded-2xl p-6', p.highlight ? 'bg-brand-900 text-white' : 'border border-ink-200 bg-white')}>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                  {p.highlight && <span className="rounded-md bg-gold-400 px-2 py-0.5 text-xs font-medium text-ink-950">{t('plan.popular')}</span>}
                </div>
                <p className="mt-4">
                  <span className="font-display text-4xl font-semibold tabular-nums">TZS {formatNumber(p.price)}</span>
                  <span className={cn('ml-1 text-sm', p.highlight ? 'text-brand-200' : 'text-ink-500')}>{t('plan.perMonth')}</span>
                </p>
                <ul className={cn('mt-6 flex-1 space-y-2.5 text-sm', p.highlight ? 'text-brand-50' : 'text-ink-700')}>
                  {[
                    p.maxMembers >= 1000 ? t('plan.membersUnlimited') : t('plan.members', { n: p.maxMembers }),
                    p.maxActiveLoans >= 1_000_000 ? t('plan.loansUnlimited') : t('plan.loans', { n: formatNumber(p.maxActiveLoans) }),
                    p.sms ? t('plan.sms') : t('plan.noSms'),
                    t('plan.mobileMoney'),
                    t('plan.reports'),
                  ].map((line) => (
                    <li key={line} className="flex gap-2">
                      <Check className={cn('mt-0.5 h-4 w-4 shrink-0', p.highlight ? 'text-gold-400' : 'text-brand-700')} />
                      {line}
                    </li>
                  ))}
                </ul>
                <ButtonLink href="/signup" variant={p.highlight ? 'gold' : 'secondary'} className="mt-8">
                  {t('landing.cta.start', { days: TRIAL_DAYS })}
                </ButtonLink>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-ink-100">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 text-sm text-ink-500 sm:flex-row sm:items-center sm:px-6">
          <span>
            © {new Date().getFullYear()} {t('landing.footer')}
          </span>
          <div className="flex gap-5">
            <Link href="/terms" className="hover:text-ink-800">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-ink-800">
              Privacy
            </Link>
            <a href="mailto:valentinakiyungi@gmail.com" className="hover:text-ink-800">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

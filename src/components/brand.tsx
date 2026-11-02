'use client';

import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** Mark: a coin sitting in a ledger tab. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-8 w-8', className)} aria-hidden>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="#125038" />
      <path d="M8 10h16" stroke="#d8f3e3" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M16 10v13" stroke="#d8f3e3" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="22.5" cy="21.5" r="4.5" fill="#f2b84b" />
    </svg>
  );
}

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      <span className={cn('font-display text-xl font-semibold tracking-tight', light ? 'text-white' : 'text-ink-950')}>TalaPesa</span>
    </span>
  );
}

export function LanguageSwitch({ className, dark }: { className?: string; dark?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className={cn('inline-flex rounded-lg p-0.5 text-xs font-medium', dark ? 'bg-white/10' : 'bg-ink-100', className)} role="group" aria-label={t('common.language')}>
      {(['sw', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={cn(
            'rounded-md px-2.5 py-1 transition-colors',
            locale === l ? (dark ? 'bg-white text-brand-900' : 'bg-white text-ink-900 shadow-sm') : dark ? 'text-brand-100 hover:text-white' : 'text-ink-500 hover:text-ink-800',
          )}
        >
          {l === 'sw' ? 'Kiswahili' : 'English'}
        </button>
      ))}
    </div>
  );
}

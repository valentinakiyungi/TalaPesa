import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-6xl font-semibold text-brand-800">404</p>
      <p className="mt-3 text-ink-600">This page doesn’t exist. / Ukurasa huu haupo.</p>
      <Link href="/" className="mt-6 text-sm font-medium text-brand-800 underline underline-offset-4">
        TalaPesa
      </Link>
    </main>
  );
}

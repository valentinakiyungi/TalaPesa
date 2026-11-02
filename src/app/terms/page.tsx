import Link from 'next/link';

export const metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-[0.95rem] leading-relaxed text-ink-800">
      <Link href="/" className="text-sm text-ink-500 hover:text-ink-800">
        ← TalaPesa
      </Link>
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink-950">Terms of Service</h1>
      <p className="mt-2 text-sm text-ink-500">Template — review with a lawyer before launch.</p>
      <div className="mt-8 space-y-4">
        <p>TalaPesa provides software that helps lending businesses record customers, loans, repayments and messages. You are responsible for the loans you issue, for complying with the laws that apply to your business (including Bank of Tanzania microfinance regulations and data protection law), and for the accuracy of the data you enter.</p>
        <p>Subscriptions are billed monthly in advance. If a subscription lapses, your workspace becomes read-only until payment is made; your data is kept for at least 90 days.</p>
        <p>You may export your data at any time from the Reports and list pages. You may cancel by not renewing.</p>
        <p>TalaPesa is provided “as is”. We work to keep the service available and your data safe, but we are not liable for indirect losses arising from use of the service.</p>
      </div>
    </main>
  );
}

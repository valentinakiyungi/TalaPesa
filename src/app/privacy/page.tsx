import Link from 'next/link';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-[0.95rem] leading-relaxed text-ink-800">
      <Link href="/" className="text-sm text-ink-500 hover:text-ink-800">
        ← TalaPesa
      </Link>
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink-950">Privacy Policy</h1>
      <p className="mt-2 text-sm text-ink-500">Template — review with a lawyer before launch.</p>
      <div className="mt-8 space-y-4">
        <p>Each lending business (“workspace”) controls the personal data of its customers that it stores in TalaPesa. TalaPesa processes that data only to provide the service.</p>
        <p>Data is stored in Google Cloud (Firebase) and encrypted in transit and at rest. Workspaces are isolated: staff can only see data of the workspace they belong to.</p>
        <p>Phone numbers are shared with the SMS and payment providers a workspace connects (for example Beem Africa, Africa’s Talking or Selcom) only to deliver messages and collect payments.</p>
        <p>To request access to or deletion of data, contact the lending business that holds it, or write to us.</p>
      </div>
    </main>
  );
}

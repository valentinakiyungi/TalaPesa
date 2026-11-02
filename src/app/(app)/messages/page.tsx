'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Alert, Button, EmptyState, Field, Input, PageHeader, PageLoader, Panel, StatusBadge, Table, Td, Textarea, Th, useToast } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useOrgCollection } from '@/lib/hooks';
import { useI18n, type MessageKey } from '@/lib/i18n';
import { can, PLANS } from '@/lib/plans';
import type { SmsLog } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

const KIND_LABEL: Record<SmsLog['kind'], MessageKey> = {
  disbursement: 'settings.sms.tpl.disbursement',
  reminder: 'settings.sms.tpl.reminder',
  due_today: 'settings.sms.tpl.dueToday',
  overdue: 'settings.sms.tpl.overdue',
  receipt: 'settings.sms.tpl.receipt',
  manual: 'sms.compose',
  test: 'settings.int.testSms',
};

export default function MessagesPage() {
  const { t, locale } = useI18n();
  const { org, role, writable } = useAuth();
  const toast = useToast();
  const { data, loading } = useOrgCollection<SmsLog>('sms', { orderBy: ['createdAt', 'desc'], limit: 300 });
  const [to, setTo] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  if (!org) return <PageLoader />;
  const smsConnected = !!org.integrations?.smsConfigured;

  return (
    <>
      <PageHeader title={t('sms.title')} />
      <div className="mb-6 space-y-3">
        {!smsConnected && <Alert tone="warn">{t('sms.simulatedNote')}</Alert>}
        {!PLANS[org.plan].sms && <Alert tone="info">{t('sms.planNote')}</Alert>}
      </div>
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {can(role, 'sms.send') && (
          <Panel title={t('sms.compose')} className="self-start">
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  await api('/api/sms', { body: { to, message } });
                  toast(t('sms.sent'));
                  setMessage('');
                } catch (err) {
                  toast(errorMessage(err), 'error');
                }
                setBusy(false);
              }}
            >
              <Field label={t('sms.to')}>
                <Input type="tel" required value={to} onChange={(e) => setTo(e.target.value)} placeholder="0712 345 678" />
              </Field>
              <Field label={t('sms.message')} hint={`${message.length} / 160`}>
                <Textarea required maxLength={640} value={message} onChange={(e) => setMessage(e.target.value)} />
              </Field>
              <Button type="submit" className="w-full" loading={busy} disabled={!writable}>
                {t('sms.send')}
              </Button>
            </form>
          </Panel>
        )}
        <Panel padded={false}>
          {loading ? (
            <PageLoader />
          ) : data.length === 0 ? (
            <EmptyState icon={<MessageSquare className="h-8 w-8" />} title={t('sms.empty')} />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t('common.date')}</Th>
                  <Th>{t('sms.to')}</Th>
                  <Th>{t('sms.kind')}</Th>
                  <Th>{t('sms.message')}</Th>
                  <Th>{t('common.status')}</Th>
                </tr>
              </thead>
              <tbody>
                {data.map((s) => (
                  <tr key={s.id}>
                    <Td className="whitespace-nowrap text-ink-500">{formatDateTime(s.createdAt, locale)}</Td>
                    <Td className="tabular-nums">+{s.to}</Td>
                    <Td className="whitespace-nowrap">{t(KIND_LABEL[s.kind] ?? 'sms.compose')}</Td>
                    <Td className="max-w-md text-ink-700">
                      {s.message}
                      {s.error && <div className="mt-1 text-xs text-red-700">{s.error}</div>}
                    </Td>
                    <Td>
                      <StatusBadge status={s.status} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}

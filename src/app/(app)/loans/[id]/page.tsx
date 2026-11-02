'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Ban, Check, FileDown, FileSignature, MessageSquare, Smartphone, Wallet, X } from 'lucide-react';
import { DisburseModal, ReasonModal, RecordPaymentModal, RequestPaymentModal } from '@/components/loan-modals';
import { ScheduleTable } from '@/components/schedule-table';
import { Alert, Button, DefinitionList, Money, PageHeader, PageLoader, Panel, StatusBadge, Table, Td, Th, useToast } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { buildSchedule, todayIso } from '@/lib/engine/loan';
import { useOrgCollection, useOrgDoc } from '@/lib/hooks';
import { useI18n } from '@/lib/i18n';
import { downloadAgreement, downloadStatement } from '@/lib/pdf';
import { can } from '@/lib/plans';
import type { Loan, Payment, PaymentRequest } from '@/lib/types';
import { cn, formatDate, formatDateTime, formatMoney, formatNumber } from '@/lib/utils';

type ModalKind = null | 'pay' | 'request' | 'disburse' | 'reject' | 'writeoff' | { reverse: Payment };

export default function LoanPage({ params }: { params: { id: string } }) {
  const { t, locale } = useI18n();
  const { org, role, writable } = useAuth();
  const toast = useToast();
  const { data: loan, loading } = useOrgDoc<Loan>('loans', params.id);
  const payments = useOrgCollection<Payment>('payments', { where: [['loanId', '==', params.id]], orderBy: ['date', 'desc'] });
  const requests = useOrgCollection<PaymentRequest>('paymentRequests', { where: [['loanId', '==', params.id]] });
  const [modal, setModal] = useState<ModalKind>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const today = todayIso(org?.settings.timeZone);

  const previewSchedule = useMemo(() => {
    if (!loan || loan.schedule?.length) return null;
    try {
      return buildSchedule({ ...loan, startDate: today });
    } catch {
      return null;
    }
  }, [loan, today]);

  if (loading) return <PageLoader />;
  if (!loan || !org) return <Alert tone="error">{t('common.noResults')}</Alert>;

  const cur = org.settings.currency;
  const live = loan.status === 'active' || loan.status === 'overdue';
  const disbursed = !!loan.disbursedDate;
  const act = async (action: string, body: Record<string, unknown> = {}) => {
    setBusy(action);
    try {
      await api(`/api/loans/${loan.id}`, { body: { action, ...body } });
      if (action === 'remind') toast(t('sms.sent'));
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
    setBusy(null);
  };
  const lang = locale;
  const sortedRequests = [...requests.data].sort((a, b) => String(b.id).localeCompare(String(a.id)));

  return (
    <>
      <PageHeader
        back={{ href: '/loans', label: t('loans.title') }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {loan.loanNumber} <StatusBadge status={loan.status} />
          </span>
        }
        description={
          <>
            <Link href={`/customers/${loan.customerId}`} className="font-medium text-ink-800 hover:text-brand-800">
              {loan.customerName}
            </Link>{' '}
            · +{loan.customerPhone} · {loan.productName}
          </>
        }
        actions={
          writable && (
            <>
              {loan.status === 'pending' && can(role, 'loans.approve') && (
                <>
                  <Button variant="secondary" onClick={() => setModal('reject')}>
                    <X className="h-4 w-4" /> {t('loans.reject')}
                  </Button>
                  <Button loading={busy === 'approve'} onClick={() => act('approve')}>
                    <Check className="h-4 w-4" /> {t('loans.approve')}
                  </Button>
                </>
              )}
              {loan.status === 'approved' && can(role, 'loans.disburse') && (
                <>
                  <Button variant="secondary" onClick={() => setModal('reject')}>
                    <X className="h-4 w-4" /> {t('loans.reject')}
                  </Button>
                  <Button onClick={() => setModal('disburse')}>
                    <Wallet className="h-4 w-4" /> {t('loans.disburse')}
                  </Button>
                </>
              )}
              {live && (
                <>
                  {can(role, 'sms.send') && (
                    <Button variant="ghost" loading={busy === 'remind'} onClick={() => act('remind')}>
                      <MessageSquare className="h-4 w-4" /> {t('loans.sendReminder')}
                    </Button>
                  )}
                  {can(role, 'payments.record') && (
                    <>
                      <Button variant="secondary" onClick={() => setModal('request')}>
                        <Smartphone className="h-4 w-4" /> {t('loans.requestPayment')}
                      </Button>
                      <Button onClick={() => setModal('pay')}>
                        <Wallet className="h-4 w-4" /> {t('loans.recordPayment')}
                      </Button>
                    </>
                  )}
                </>
              )}
            </>
          )
        }
      />

      {loan.status === 'rejected' && loan.rejectedReason && <Alert tone="warn" className="mb-6">{t('status.rejected')}: {loan.rejectedReason}</Alert>}
      {loan.status === 'written_off' && loan.writtenOffReason && <Alert tone="warn" className="mb-6">{t('status.written_off')}: {loan.writtenOffReason}</Alert>}

      {/* Position */}
      <section className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink-100 bg-ink-100 lg:grid-cols-5">
        {[
          { label: t('loans.principal'), value: formatNumber(loan.principal) },
          { label: t('loans.totalDue'), value: formatNumber(loan.totalDue) },
          { label: t('loans.paid'), value: formatNumber(loan.amountPaid), tone: 'text-brand-800' },
          { label: t('loans.balance'), value: formatNumber(live || loan.status === 'written_off' ? loan.balance : 0), strong: true },
          live && loan.daysOverdue > 0
            ? { label: `${t('loans.arrears')} · ${loan.daysOverdue} ${t('common.days')}`, value: formatNumber(loan.arrears), tone: 'text-red-700' }
            : { label: t('loans.nextDue'), value: live && loan.nextDueDate ? `${formatNumber(loan.nextDueAmount)}` : '—', sub: live && loan.nextDueDate ? formatDate(loan.nextDueDate, locale) : undefined },
        ].map((s) => (
          <div key={s.label} className="bg-white px-4 py-3.5">
            <p className="text-xs text-ink-500">{s.label}</p>
            <p className={cn('mt-0.5 font-display text-xl font-semibold tabular-nums text-ink-950', s.tone)}>{s.value}</p>
            {'sub' in s && s.sub && <p className="text-xs text-ink-500">{s.sub}</p>}
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title={disbursed ? t('loans.schedule') : t('loans.preview')} padded={false}>
            {disbursed ? <ScheduleTable schedule={loan.schedule} asOf={today} /> : previewSchedule ? <ScheduleTable schedule={previewSchedule} /> : <p className="p-5 text-sm text-ink-500">—</p>}
          </Panel>

          <Panel title={t('loans.payments')} padded={false}>
            {payments.data.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ink-500">{t('loans.noPayments')}</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>{t('common.date')}</Th>
                    <Th>{t('payments.receiptNo')}</Th>
                    <Th>{t('common.method')}</Th>
                    <Th align="right">{t('common.amount')}</Th>
                    <Th>{t('payments.allocation')}</Th>
                    <Th>{t('common.status')}</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {payments.data.map((p) => (
                    <tr key={p.id}>
                      <Td className="whitespace-nowrap">{formatDate(p.date, locale)}</Td>
                      <Td>
                        <div className="tabular-nums">{p.receiptNumber}</div>
                        <div className="text-xs text-ink-500">{p.receivedByName}</div>
                      </Td>
                      <Td>
                        <div>{t(`payments.method.${p.method}`)}</div>
                        {p.reference && <div className="text-xs text-ink-500">{p.reference}</div>}
                      </Td>
                      <Td align="right" className="font-medium">
                        {formatNumber(p.amount)}
                      </Td>
                      <Td className="text-xs text-ink-600">
                        {p.allocation && (
                          <>
                            {t('schedule.principal')} {formatNumber(p.allocation.principal)} · {t('schedule.interest')} {formatNumber(p.allocation.interest)}
                            {p.allocation.penalty > 0 && ` · ${t('schedule.penalty')} ${formatNumber(p.allocation.penalty)}`}
                          </>
                        )}
                      </Td>
                      <Td>
                        <StatusBadge status={p.status} />
                      </Td>
                      <Td align="right">
                        {p.status === 'completed' && can(role, 'payments.reverse') && writable && ['active', 'overdue', 'closed'].includes(loan.status) && (
                          <button className="text-xs text-ink-500 hover:text-red-700" onClick={() => setModal({ reverse: p })}>
                            {t('payments.reverse')}
                          </button>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Panel>

          {sortedRequests.length > 0 && (
            <Panel title={t('payments.requests')} padded={false}>
              <ul className="divide-y divide-ink-100 text-sm">
                {sortedRequests.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <Smartphone className="h-4 w-4 text-ink-400" />
                    <span className="tabular-nums">+{r.phone}</span>
                    <span className="flex-1 text-ink-500">
                      {formatDateTime(r.createdAt, locale)} · {r.createdByName}
                      {r.testMode && ` · ${t('common.testMode')}`}
                      {r.message && r.status === 'failed' && ` · ${r.message}`}
                    </span>
                    <span className="font-medium tabular-nums">{formatNumber(r.amount)}</span>
                    <StatusBadge status={r.status === 'pending' ? 'pending' : r.status} />
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <div className="space-y-6">
          <Panel title={t('loans.product')}>
            <DefinitionList
              columns={1}
              items={[
                { label: t('loans.rate'), value: `${loan.interestRate}% ${t(`ratePeriod.${loan.ratePeriod}`)} · ${t(`method.${loan.interestMethod}`)}` },
                { label: t('loans.installments'), value: `${loan.installments} × ${t(`freq.${loan.frequency}`).toLowerCase()}` },
                { label: t('loans.interest'), value: <Money value={loan.totalInterest} currency={cur} /> },
                { label: t('loans.processingFee'), value: <Money value={loan.processingFee} currency={cur} /> },
                {
                  label: t('loans.lateFee'),
                  value: loan.lateFeeType === 'none' ? t('common.none') : `${loan.lateFeeType === 'percent' ? `${loan.lateFeeValue}%` : formatMoney(loan.lateFeeValue, cur)} · ${t('loans.grace')} ${loan.graceDays} ${t('common.days')}`,
                },
                ...(loan.totalPenalty > 0 ? [{ label: t('loans.penalties'), value: <Money value={loan.totalPenalty} currency={cur} className="text-red-700" /> }] : []),
                { label: t('loans.purpose'), value: loan.purpose },
                { label: t('loans.collateral'), value: loan.collateral },
                { label: t('customers.guarantor'), value: loan.guarantor ? `${loan.guarantor.name}, +${loan.guarantor.phone}${loan.guarantor.relation ? ` (${loan.guarantor.relation})` : ''}` : '' },
                { label: t('loans.officer'), value: loan.officerName },
              ]}
            />
          </Panel>

          <Panel title={t('loans.timeline')}>
            <ol className="space-y-3 text-sm">
              {[
                { label: t('status.pending'), date: formatDateTime(loan.createdAt, locale), by: loan.officerName, show: true },
                { label: t('status.approved'), date: formatDateTime(loan.approvedAt, locale), by: loan.approvedByName, show: !!loan.approvedAt },
                { label: t('loans.disburse'), date: loan.disbursedDate ? formatDate(loan.disbursedDate, locale) : '', by: loan.disbursementMethod ? t(`payments.method.${loan.disbursementMethod as Payment['method']}`) : '', show: disbursed },
                { label: t(`status.${loan.status}`), date: loan.closedDate ? formatDate(loan.closedDate, locale) : '', by: '', show: ['closed', 'written_off', 'rejected'].includes(loan.status) },
              ]
                .filter((e) => e.show)
                .map((e) => (
                  <li key={e.label} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                    <div>
                      <p className="font-medium text-ink-900">{e.label}</p>
                      <p className="text-ink-500">
                        {e.date}
                        {e.by && ` · ${e.by}`}
                      </p>
                    </div>
                  </li>
                ))}
            </ol>
          </Panel>

          <Panel>
            <div className="flex flex-col gap-2">
              <Button variant="secondary" onClick={() => downloadAgreement(org, loan, lang)}>
                <FileSignature className="h-4 w-4" /> {t('loans.agreement')}
              </Button>
              {disbursed && (
                <Button variant="secondary" onClick={() => downloadStatement(org, loan, payments.data, lang)}>
                  <FileDown className="h-4 w-4" /> {t('loans.statement')}
                </Button>
              )}
              {live && can(role, 'loans.writeoff') && writable && (
                <Button variant="ghost" className="text-red-700 hover:bg-red-50" onClick={() => setModal('writeoff')}>
                  <Ban className="h-4 w-4" /> {t('loans.writeOff')}
                </Button>
              )}
            </div>
          </Panel>
        </div>
      </div>

      <RecordPaymentModal loan={loan} open={modal === 'pay'} onClose={() => setModal(null)} />
      <RequestPaymentModal loan={loan} open={modal === 'request'} onClose={() => setModal(null)} />
      <DisburseModal loan={loan} open={modal === 'disburse'} onClose={() => setModal(null)} />
      <ReasonModal
        open={modal === 'reject'}
        onClose={() => setModal(null)}
        title={t('loans.reject')}
        label={t('loans.rejectReason')}
        confirmLabel={t('loans.reject')}
        danger
        onConfirm={async (reason) => {
          await api(`/api/loans/${loan.id}`, { body: { action: 'reject', reason } });
        }}
      />
      <ReasonModal
        open={modal === 'writeoff'}
        onClose={() => setModal(null)}
        title={t('loans.writeOff')}
        label={t('loans.writeOffReason')}
        confirmLabel={t('loans.writeOff')}
        danger
        onConfirm={async (reason) => {
          await api(`/api/loans/${loan.id}`, { body: { action: 'write_off', reason } });
        }}
      />
      <ReasonModal
        open={typeof modal === 'object' && modal !== null}
        onClose={() => setModal(null)}
        title={`${t('payments.reverse')} ${typeof modal === 'object' && modal ? modal.reverse.receiptNumber : ''}`}
        label={t('payments.reverseReason')}
        confirmLabel={t('payments.reverse')}
        danger
        onConfirm={async (reason) => {
          if (typeof modal === 'object' && modal) {
            await api(`/api/payments/${modal.reverse.id}/reverse`, { body: { reason } });
            toast(t('payments.reversed'));
          }
        }}
      />
    </>
  );
}

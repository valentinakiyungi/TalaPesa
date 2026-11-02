'use client';

import { useEffect, useState } from 'react';
import { Alert, Button, Field, Input, Modal, MoneyInput, Select, Textarea, Toggle, useToast } from '@/components/ui';
import { api, ApiClientError, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { todayIso } from '@/lib/engine/loan';
import { useI18n } from '@/lib/i18n';
import { paymentMethods } from '@/lib/schemas';
import type { Loan, PaymentMethod } from '@/lib/types';
import { formatMoney, formatNumber } from '@/lib/utils';

export function RecordPaymentModal({ loan, open, onClose }: { loan: Loan; open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { org } = useAuth();
  const toast = useToast();
  const today = todayIso(org?.settings.timeZone);
  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(today);
  const [note, setNote] = useState('');
  const [sendReceipt, setSendReceipt] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAmount(loan.arrears > 0 ? Math.min(loan.arrears, loan.balance) : loan.nextDueAmount || '');
      setDate(today);
      setError(null);
    }
  }, [open, loan.arrears, loan.balance, loan.nextDueAmount, today]);

  const cur = org?.settings.currency;
  const tooMuch = amount !== '' && amount > loan.balance;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('payments.record')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            loading={busy}
            disabled={amount === '' || amount <= 0 || tooMuch}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                const res = await api<{ receiptNumber: string }>('/api/payments', { body: { loanId: loan.id, amount, method, reference, date, note, sendReceipt } });
                toast(`${t('payments.recorded')} · ${res.receiptNumber}`);
                onClose();
                setReference('');
                setNote('');
              } catch (err) {
                setError(err instanceof ApiClientError && err.code === 'overpayment' ? t('payments.exceeds', { balance: formatMoney(loan.balance, cur) }) : errorMessage(err));
              }
              setBusy(false);
            }}
          >
            {t('payments.record')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex justify-between rounded-lg bg-ink-50 px-4 py-3 text-sm">
          <span className="text-ink-600">{t('loans.balance')}</span>
          <span className="font-medium tabular-nums">{formatMoney(loan.balance, cur)}</span>
        </div>
        <Field label={`${t('common.amount')} (${cur})`} error={tooMuch ? t('payments.exceeds', { balance: formatNumber(loan.balance) }) : null}>
          <MoneyInput value={amount} onChange={setAmount} autoFocus />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('common.method')}>
            <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              {paymentMethods.map((m) => (
                <option key={m} value={m}>
                  {t(`payments.method.${m}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('common.date')}>
            <Input type="date" value={date} max={today} min={loan.disbursedDate ?? undefined} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Field label={<>{t('common.reference')} <span className="font-normal text-ink-400">({t('common.optional')})</span></>}>
          <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. QK72HD91LP" />
        </Field>
        <Field label={<>{t('common.notes')} <span className="font-normal text-ink-400">({t('common.optional')})</span></>}>
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <Toggle checked={sendReceipt} onChange={setSendReceipt} label={t('payments.sendReceipt')} />
        {error && <Alert tone="error">{error}</Alert>}
      </div>
    </Modal>
  );
}

export function RequestPaymentModal({ loan, open, onClose }: { loan: Loan; open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { org } = useAuth();
  const toast = useToast();
  const [amount, setAmount] = useState<number | ''>('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = !!org?.integrations?.selcomConfigured;

  useEffect(() => {
    if (open) {
      setAmount(loan.arrears > 0 ? Math.min(loan.arrears, loan.balance) : Math.min(loan.nextDueAmount, loan.balance) || '');
      setPhone('+' + loan.customerPhone);
      setError(null);
    }
  }, [open, loan]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('loans.requestPayment')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="gold"
            loading={busy}
            disabled={amount === '' || amount <= 0 || amount > loan.balance}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                const res = await api<{ testMode: boolean }>(`/api/loans/${loan.id}/request-payment`, { body: { amount, phone } });
                toast(res.testMode ? t('payments.request.testSent') : t('payments.request.sent'));
                onClose();
              } catch (err) {
                setError(errorMessage(err));
              }
              setBusy(false);
            }}
          >
            {t('payments.request.send')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {!configured && <Alert tone="warn">{t('payments.request.notConfigured')}</Alert>}
        <Field label={t('payments.request.phone')}>
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label={`${t('common.amount')} (${org?.settings.currency})`} hint={`${t('loans.balance')}: ${formatNumber(loan.balance)}`}>
          <MoneyInput value={amount} onChange={setAmount} />
        </Field>
        {error && <Alert tone="error">{error}</Alert>}
      </div>
    </Modal>
  );
}

export function DisburseModal({ loan, open, onClose }: { loan: Loan; open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { org } = useAuth();
  const toast = useToast();
  const today = todayIso(org?.settings.timeZone);
  const [date, setDate] = useState(today);
  const [method, setMethod] = useState<PaymentMethod>('mpesa');
  const [reference, setReference] = useState('');
  const [sendSms, setSendSms] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cur = org?.settings.currency;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('loans.disburseTitle')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            loading={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await api(`/api/loans/${loan.id}`, { body: { action: 'disburse', date, method, reference, sendSms } });
                toast(t('status.active'));
                onClose();
              } catch (err) {
                setError(errorMessage(err));
              }
              setBusy(false);
            }}
          >
            {t('loans.disburse')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-ink-50 px-4 py-3 text-sm">
          <span className="text-ink-600">{t('loans.principal')}</span>
          <span className="text-right tabular-nums">{formatMoney(loan.principal, cur)}</span>
          <span className="text-ink-600">{t('loans.processingFee')}</span>
          <span className="text-right tabular-nums">− {formatNumber(loan.processingFee)}</span>
          <span className="font-medium text-ink-900">{t('loans.netDisbursed')}</span>
          <span className="text-right font-semibold tabular-nums">{formatMoney(loan.principal - loan.processingFee, cur)}</span>
        </div>
        <Field label={t('loans.disburseDate')} hint={t('loans.disburseNote')}>
          <Input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('loans.disburseMethod')}>
            <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              {paymentMethods.map((m) => (
                <option key={m} value={m}>
                  {t(`payments.method.${m}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('common.reference')}>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} />
          </Field>
        </div>
        <Toggle checked={sendSms} onChange={setSendSms} label={t('settings.sms.tpl.disbursement')} description="SMS" />
        {error && <Alert tone="error">{error}</Alert>}
      </div>
    </Modal>
  );
}

export function ReasonModal({
  open,
  onClose,
  title,
  label,
  confirmLabel,
  danger,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  label: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setReason('');
      setError(null);
    }
  }, [open]);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            loading={busy}
            disabled={reason.trim().length < 2}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await onConfirm(reason.trim());
                onClose();
              } catch (err) {
                setError(errorMessage(err));
              }
              setBusy(false);
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <Field label={label}>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
      </Field>
      {error && (
        <Alert tone="error" className="mt-3">
          {error}
        </Alert>
      )}
    </Modal>
  );
}

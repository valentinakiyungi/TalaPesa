'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { FileText, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import {
  Alert,
  Button,
  ButtonLink,
  DefinitionList,
  Money,
  PageHeader,
  PageLoader,
  Panel,
  Select,
  StatusBadge,
  Table,
  Td,
  Th,
  useToast,
} from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { storage } from '@/lib/firebase/client';
import { useOrgCollection, useOrgDoc } from '@/lib/hooks';
import { useI18n, type MessageKey } from '@/lib/i18n';
import { can } from '@/lib/plans';
import type { Contact, Customer, CustomerDocument, Loan } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/utils';

const DOC_TYPES: CustomerDocument['type'][] = ['national_id', 'photo', 'payslip', 'contract', 'passport', 'other'];

function ContactBlock({ title, c }: { title: string; c?: Contact | null }) {
  const { t } = useI18n();
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-ink-900">{title}</h3>
      {c ? (
        <DefinitionList
          items={[
            { label: t('common.name'), value: c.name },
            { label: t('common.phone'), value: c.phone ? `+${c.phone}` : '' },
            { label: t('customers.relation'), value: c.relation },
            { label: t('customers.nationalId'), value: c.nationalId },
          ]}
        />
      ) : (
        <p className="text-sm text-ink-500">—</p>
      )}
    </div>
  );
}

export default function CustomerPage({ params }: { params: { id: string } }) {
  const { t, locale } = useI18n();
  const { org, role, writable } = useAuth();
  const toast = useToast();
  const { data: c, loading } = useOrgDoc<Customer>('customers', params.id);
  const loans = useOrgCollection<Loan>('loans', { where: [['customerId', '==', params.id]] });
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<CustomerDocument['type']>('national_id');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading) return <PageLoader />;
  if (!c || !org) return <Alert tone="error">{t('common.noResults')}</Alert>;
  const canWrite = can(role, 'customers.write') && writable;
  const cur = org.settings.currency;

  async function upload(file: File) {
    if (!c || !org) return;
    if (file.size > 10 * 1024 * 1024) return toast('Max 10 MB', 'error');
    setUploading(true);
    try {
      const safe = file.name.replace(/[^\w.-]+/g, '_').slice(-80);
      const path = `orgs/${org.id}/customers/${c.id}/${Date.now()}-${safe}`;
      const snap = await uploadBytes(storageRef(storage, path), file, { contentType: file.type });
      const url = await getDownloadURL(snap.ref);
      await api(`/api/customers/${c.id}/documents`, { body: { name: file.name, type: docType, path, url, size: file.size } });
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const sortedLoans = [...loans.data].sort((a, b) => b.loanNumber.localeCompare(a.loanNumber));

  return (
    <>
      <PageHeader
        back={{ href: '/customers', label: t('customers.title') }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {c.fullName} <StatusBadge status={c.status} />
          </span>
        }
        description={`${c.customerNumber} · +${c.phone}`}
        actions={
          canWrite && (
            <>
              <Button
                variant="ghost"
                loading={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await api(`/api/customers/${c.id}`, { method: 'PATCH', body: { action: 'status', status: c.status === 'blacklisted' ? 'active' : 'blacklisted' } });
                  } catch (err) {
                    toast(errorMessage(err), 'error');
                  }
                  setBusy(false);
                }}
              >
                {c.status === 'blacklisted' ? t('customers.unblacklist') : t('customers.blacklist')}
              </Button>
              <ButtonLink href={`/customers/${c.id}/edit`} variant="secondary">
                <Pencil className="h-4 w-4" /> {t('common.edit')}
              </ButtonLink>
              {c.status === 'active' && can(role, 'loans.create') && (
                <ButtonLink href={`/loans/new?customer=${c.id}`}>
                  <Plus className="h-4 w-4" /> {t('customers.newLoan')}
                </ButtonLink>
              )}
            </>
          )
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink-100 bg-ink-100 sm:grid-cols-4">
        {[
          { label: t('customers.loans'), value: String(c.stats?.loans ?? 0) },
          { label: t('dash.activeLoans'), value: String(c.stats?.activeLoans ?? 0) },
          { label: t('customers.totalBorrowed'), value: formatMoney(c.stats?.totalBorrowed, cur) },
          { label: t('customers.totalRepaid'), value: formatMoney(c.stats?.totalRepaid, cur) },
        ].map((s) => (
          <div key={s.label} className="bg-white px-4 py-3">
            <p className="text-xs text-ink-500">{s.label}</p>
            <p className="mt-0.5 font-display text-lg font-semibold tabular-nums text-ink-950">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title={t('customers.loans')} padded={false}>
            {sortedLoans.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ink-500">{t('loans.empty')}</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>{t('loans.number')}</Th>
                    <Th align="right">{t('loans.principal')}</Th>
                    <Th align="right">{t('loans.balance')}</Th>
                    <Th>{t('loans.nextDue')}</Th>
                    <Th>{t('common.status')}</Th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLoans.map((l) => (
                    <tr key={l.id} className="hover:bg-ink-50/70">
                      <Td>
                        <Link href={`/loans/${l.id}`} className="font-medium text-ink-950 hover:text-brand-800">
                          {l.loanNumber}
                        </Link>
                        <div className="text-xs text-ink-500">{l.productName}</div>
                      </Td>
                      <Td align="right">{formatMoney(l.principal, cur)}</Td>
                      <Td align="right">{['active', 'overdue'].includes(l.status) ? formatMoney(l.balance, cur) : '—'}</Td>
                      <Td>{l.nextDueDate ? formatDate(l.nextDueDate, locale) : '—'}</Td>
                      <Td>
                        <StatusBadge status={l.status} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Panel>

          <Panel title={t('customers.section.personal')}>
            <DefinitionList
              columns={3}
              items={[
                { label: t('customers.nationalId'), value: c.nationalId },
                { label: t('customers.altPhone'), value: c.altPhone ? `+${c.altPhone}` : '' },
                { label: t('common.email'), value: c.email },
                { label: t('customers.gender'), value: c.gender ? t(`customers.gender.${c.gender}` as MessageKey) : '' },
                { label: t('customers.dob'), value: c.dateOfBirth ? formatDate(c.dateOfBirth, locale) : '' },
                { label: t('customers.region'), value: c.region },
                { label: t('common.address'), value: c.address },
                { label: t('customers.occupation'), value: c.occupation },
                { label: t('customers.employer'), value: c.employer },
                { label: t('customers.income'), value: c.monthlyIncome ? <Money value={c.monthlyIncome} currency={cur} /> : '' },
              ]}
            />
            {c.notes && <p className="mt-4 whitespace-pre-wrap border-t border-ink-100 pt-4 text-sm text-ink-700">{c.notes}</p>}
          </Panel>

          <Panel title={t('customers.section.contacts')}>
            <div className="grid gap-6 sm:grid-cols-2">
              <ContactBlock title={t('customers.nextOfKin')} c={c.nextOfKin} />
              <ContactBlock title={t('customers.guarantor')} c={c.guarantor} />
            </div>
          </Panel>
        </div>

        <Panel title={t('customers.documents')} className="self-start" padded={false}>
          {(c.documents ?? []).length === 0 ? (
            <p className="px-5 py-5 text-sm text-ink-500">{t('customers.noDocuments')}</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {(c.documents ?? []).map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                  <FileText className="h-5 w-5 shrink-0 text-ink-400" />
                  <div className="min-w-0 flex-1">
                    <a href={d.url} target="_blank" rel="noreferrer" className="block truncate text-sm font-medium text-ink-900 hover:text-brand-800">
                      {d.name}
                    </a>
                    <p className="text-xs text-ink-500">
                      {t(`customers.docType.${d.type}` as MessageKey)} · {formatDate(d.uploadedAt, locale)}
                    </p>
                  </div>
                  {canWrite && (
                    <button
                      className="rounded p-1 text-ink-400 hover:bg-red-50 hover:text-red-700"
                      aria-label={t('common.delete')}
                      onClick={async () => {
                        if (!confirm(`${t('common.delete')} "${d.name}"?`)) return;
                        try {
                          await api(`/api/customers/${c.id}/documents`, { method: 'DELETE', body: { documentId: d.id } });
                        } catch (err) {
                          toast(errorMessage(err), 'error');
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {canWrite && (
            <div className="space-y-3 border-t border-ink-100 p-5">
              <Select value={docType} onChange={(e) => setDocType(e.target.value as CustomerDocument['type'])} aria-label={t('customers.docType')}>
                {DOC_TYPES.map((dt) => (
                  <option key={dt} value={dt}>
                    {t(`customers.docType.${dt}` as MessageKey)}
                  </option>
                ))}
              </Select>
              <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              <Button variant="secondary" className="w-full" loading={uploading} onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" /> {uploading ? t('customers.uploading') : t('customers.upload')}
              </Button>
              <p className="text-xs text-ink-500">JPG, PNG, PDF · max 10 MB</p>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

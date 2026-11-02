'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Field, Input, MoneyInput, Panel, Select, Textarea, useToast } from '@/components/ui';
import { api, ApiClientError, errorMessage } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import type { Contact, Customer } from '@/lib/types';

const REGIONS = [
  'Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 'Kagera', 'Katavi', 'Kigoma', 'Kilimanjaro', 'Lindi', 'Manyara', 'Mara', 'Mbeya',
  'Morogoro', 'Mtwara', 'Mwanza', 'Njombe', 'Pemba Kaskazini', 'Pemba Kusini', 'Pwani', 'Rukwa', 'Ruvuma', 'Shinyanga', 'Simiyu', 'Singida',
  'Songwe', 'Tabora', 'Tanga', 'Unguja Kaskazini', 'Unguja Kusini', 'Unguja Mjini Magharibi',
];

const emptyContact: Contact = { name: '', phone: '', relation: '', nationalId: '', address: '' };

function ContactFields({ title, value, onChange }: { title: string; value: Contact; onChange: (c: Contact) => void }) {
  const { t } = useI18n();
  const set = (k: keyof Contact) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [k]: e.target.value });
  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-sm font-semibold text-ink-900">{title}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('common.name')}>
          <Input value={value.name} onChange={set('name')} />
        </Field>
        <Field label={t('common.phone')}>
          <Input type="tel" value={value.phone} onChange={set('phone')} placeholder="0712 345 678" />
        </Field>
        <Field label={t('customers.relation')}>
          <Input value={value.relation ?? ''} onChange={set('relation')} />
        </Field>
        <Field label={t('customers.nationalId')}>
          <Input value={value.nationalId ?? ''} onChange={set('nationalId')} />
        </Field>
      </div>
    </fieldset>
  );
}

const contactOrNull = (c: Contact) => (c.name.trim() || c.phone.trim() ? c : null);

export function CustomerForm({ initial }: { initial?: Customer }) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState({
    firstName: initial?.firstName ?? '',
    lastName: initial?.lastName ?? '',
    phone: initial?.phone ? '+' + initial.phone : '',
    altPhone: initial?.altPhone ? '+' + initial.altPhone : '',
    email: initial?.email ?? '',
    nationalId: initial?.nationalId ?? '',
    gender: initial?.gender ?? '',
    dateOfBirth: initial?.dateOfBirth ?? '',
    address: initial?.address ?? '',
    region: initial?.region ?? '',
    occupation: initial?.occupation ?? '',
    employer: initial?.employer ?? '',
    notes: initial?.notes ?? '',
  });
  const [income, setIncome] = useState<number | ''>(initial?.monthlyIncome ?? '');
  const [kin, setKin] = useState<Contact>(initial?.nextOfKin ?? emptyContact);
  const [guarantor, setGuarantor] = useState<Contact>(initial?.guarantor ?? emptyContact);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const customer = { ...f, monthlyIncome: income === '' ? 0 : income, nextOfKin: contactOrNull(kin), guarantor: contactOrNull(guarantor) };
        try {
          if (initial) {
            await api(`/api/customers/${initial.id}`, { method: 'PATCH', body: { action: 'update', customer } });
            toast(t('customers.saved'));
            router.push(`/customers/${initial.id}`);
          } else {
            const res = await api<{ id: string }>('/api/customers', { body: customer });
            toast(t('customers.saved'));
            router.push(`/customers/${res.id}`);
          }
        } catch (err) {
          setError(err instanceof ApiClientError && err.code === 'duplicate_phone' ? t('customers.duplicatePhone') : errorMessage(err));
          setBusy(false);
        }
      }}
    >
      <Panel title={t('customers.section.personal')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('customers.firstName')}>
            <Input required value={f.firstName} onChange={set('firstName')} autoComplete="off" />
          </Field>
          <Field label={t('customers.lastName')}>
            <Input required value={f.lastName} onChange={set('lastName')} autoComplete="off" />
          </Field>
          <Field label={t('common.phone')}>
            <Input required type="tel" value={f.phone} onChange={set('phone')} placeholder="0712 345 678" />
          </Field>
          <Field label={<>{t('customers.altPhone')} <span className="font-normal text-ink-400">({t('common.optional')})</span></>}>
            <Input type="tel" value={f.altPhone} onChange={set('altPhone')} />
          </Field>
          <Field label={t('customers.nationalId')}>
            <Input value={f.nationalId} onChange={set('nationalId')} placeholder="19900101-12345-00001-12" />
          </Field>
          <Field label={<>{t('common.email')} <span className="font-normal text-ink-400">({t('common.optional')})</span></>}>
            <Input type="email" value={f.email} onChange={set('email')} />
          </Field>
          <Field label={t('customers.gender')}>
            <Select value={f.gender} onChange={set('gender')}>
              <option value="">—</option>
              <option value="female">{t('customers.gender.female')}</option>
              <option value="male">{t('customers.gender.male')}</option>
              <option value="other">{t('customers.gender.other')}</option>
            </Select>
          </Field>
          <Field label={t('customers.dob')}>
            <Input type="date" value={f.dateOfBirth} onChange={set('dateOfBirth')} />
          </Field>
          <Field label={t('customers.region')}>
            <Select value={f.region} onChange={set('region')}>
              <option value="">—</option>
              {REGIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('common.address')}>
            <Input value={f.address} onChange={set('address')} />
          </Field>
        </div>
      </Panel>

      <Panel title={t('customers.section.work')}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t('customers.occupation')}>
            <Input value={f.occupation} onChange={set('occupation')} />
          </Field>
          <Field label={t('customers.employer')}>
            <Input value={f.employer} onChange={set('employer')} />
          </Field>
          <Field label={t('customers.income')}>
            <MoneyInput value={income} onChange={setIncome} />
          </Field>
        </div>
      </Panel>

      <Panel title={t('customers.section.contacts')}>
        <div className="space-y-6">
          <ContactFields title={t('customers.nextOfKin')} value={kin} onChange={setKin} />
          <ContactFields title={t('customers.guarantor')} value={guarantor} onChange={setGuarantor} />
        </div>
      </Panel>

      <Panel title={t('common.notes')}>
        <Textarea value={f.notes} onChange={set('notes')} />
      </Panel>

      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => router.back()}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={busy}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}

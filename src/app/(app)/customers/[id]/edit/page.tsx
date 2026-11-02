'use client';

import { CustomerForm } from '@/components/customer-form';
import { Alert, PageHeader, PageLoader } from '@/components/ui';
import { useOrgDoc } from '@/lib/hooks';
import { useI18n } from '@/lib/i18n';
import type { Customer } from '@/lib/types';

export default function EditCustomerPage({ params }: { params: { id: string } }) {
  const { t } = useI18n();
  const { data, loading } = useOrgDoc<Customer>('customers', params.id);
  if (loading) return <PageLoader />;
  if (!data) return <Alert tone="error">{t('common.noResults')}</Alert>;
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t('customers.edit')} back={{ href: `/customers/${params.id}`, label: data.fullName }} />
      <CustomerForm initial={data} />
    </div>
  );
}

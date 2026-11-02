'use client';

import { CustomerForm } from '@/components/customer-form';
import { PageHeader } from '@/components/ui';
import { useI18n } from '@/lib/i18n';

export default function NewCustomerPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t('customers.new')} back={{ href: '/customers', label: t('customers.title') }} />
      <CustomerForm />
    </div>
  );
}

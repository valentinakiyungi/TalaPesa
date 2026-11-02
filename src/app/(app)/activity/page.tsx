'use client';

import { History } from 'lucide-react';
import { Alert, EmptyState, PageHeader, PageLoader, Panel } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useOrgCollection } from '@/lib/hooks';
import { useI18n } from '@/lib/i18n';
import { can } from '@/lib/plans';
import type { AuditEntry } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';

export default function ActivityPage() {
  const { t, locale } = useI18n();
  const { role } = useAuth();
  const allowed = can(role, 'team.manage');
  const { data, loading } = useOrgCollection<AuditEntry>(allowed ? 'audit' : null, { orderBy: ['createdAt', 'desc'], limit: 300 });
  if (!allowed) return <Alert tone="warn">403</Alert>;
  if (loading) return <PageLoader />;
  return (
    <>
      <PageHeader title={t('activity.title')} />
      <Panel padded={false}>
        {data.length === 0 ? (
          <EmptyState icon={<History className="h-8 w-8" />} title={t('activity.empty')} />
        ) : (
          <ul className="divide-y divide-ink-100">
            {data.map((a) => (
              <li key={a.id} className="flex flex-wrap gap-x-4 gap-y-0.5 px-5 py-3 text-sm">
                <span className="w-40 shrink-0 text-ink-500">{formatDateTime(a.createdAt, locale)}</span>
                <span className="w-36 shrink-0 font-medium text-ink-900">{a.actorName}</span>
                <span className="min-w-0 flex-1 text-ink-700">
                  {a.targetType === 'loan' && a.targetId ? (
                    <Link href={`/loans/${a.targetId}`} className="hover:text-brand-800 hover:underline">
                      {a.summary}
                    </Link>
                  ) : a.targetType === 'customer' && a.targetId ? (
                    <Link href={`/customers/${a.targetId}`} className="hover:text-brand-800 hover:underline">
                      {a.summary}
                    </Link>
                  ) : (
                    a.summary
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

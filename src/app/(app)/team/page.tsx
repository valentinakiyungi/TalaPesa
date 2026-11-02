'use client';

import { useState } from 'react';
import { Copy, UserPlus } from 'lucide-react';
import { Alert, Badge, Button, Field, Input, Modal, PageHeader, PageLoader, Panel, Select, Table, Td, Th, useToast } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useOrgCollection } from '@/lib/hooks';
import { useI18n, type MessageKey } from '@/lib/i18n';
import { can, PLANS } from '@/lib/plans';
import type { Invite, Member, Role } from '@/lib/types';
import { formatDate, initials } from '@/lib/utils';

const ASSIGNABLE: Role[] = ['admin', 'officer', 'viewer'];

export default function TeamPage() {
  const { t, locale } = useI18n();
  const { org, role, user, writable } = useAuth();
  const toast = useToast();
  const members = useOrgCollection<Member>('members');
  const invites = useOrgCollection<Invite>(can(role, 'team.manage') ? 'invites' : null, { where: [['status', '==', 'pending']] });
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('officer');
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!org || members.loading) return <PageLoader />;
  if (!can(role, 'team.manage')) return <Alert tone="warn">403</Alert>;

  const limit = PLANS[org.plan].maxMembers;
  const activeCount = members.data.filter((m) => m.status === 'active').length;

  const update = async (uid: string, body: Record<string, string>) => {
    try {
      await api(`/api/team/members/${uid}`, { method: 'PATCH', body });
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  return (
    <>
      <PageHeader
        title={t('team.title')}
        description={limit < 1000 ? `${activeCount + invites.data.length} / ${limit}` : undefined}
        actions={
          <Button
            onClick={() => {
              setOpen(true);
              setLink(null);
              setEmail('');
              setError(null);
            }}
            disabled={!writable}
          >
            <UserPlus className="h-4 w-4" /> {t('team.invite')}
          </Button>
        }
      />

      <Panel padded={false}>
        <Table>
          <thead>
            <tr>
              <Th>{t('common.name')}</Th>
              <Th>{t('team.inviteRole')}</Th>
              <Th>{t('common.status')}</Th>
              <Th>{t('common.created')}</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {[...members.data]
              .sort((a, b) => (a.role === 'owner' ? -1 : b.role === 'owner' ? 1 : a.name.localeCompare(b.name)))
              .map((m) => {
                const self = m.uid === user?.uid;
                const editable = !self && m.role !== 'owner' && !(role === 'admin' && m.role === 'admin');
                return (
                  <tr key={m.uid}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-800">{initials(m.name)}</span>
                        <div>
                          <p className="font-medium text-ink-950">
                            {m.name} {self && <span className="font-normal text-ink-400">({t('team.you')})</span>}
                          </p>
                          <p className="text-xs text-ink-500">{m.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      {editable ? (
                        <Select value={m.role} onChange={(e) => update(m.uid, { role: e.target.value })} className="h-8 w-40" aria-label={t('team.changeRole')}>
                          {ASSIGNABLE.map((r) => (
                            <option key={r} value={r}>
                              {t(`role.${r}` as MessageKey)}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        t(`role.${m.role}` as MessageKey)
                      )}
                    </Td>
                    <Td>{m.status === 'active' ? <Badge className="bg-brand-50 text-brand-800 ring-brand-200">{t('status.active')}</Badge> : <Badge className="bg-ink-100 text-ink-600 ring-ink-200">{t('team.disable')}</Badge>}</Td>
                    <Td className="text-ink-500">{formatDate(m.createdAt, locale)}</Td>
                    <Td align="right">
                      {editable && (
                        <Button size="sm" variant="ghost" onClick={() => update(m.uid, { status: m.status === 'active' ? 'disabled' : 'active' })}>
                          {m.status === 'active' ? t('team.disable') : t('team.enable')}
                        </Button>
                      )}
                    </Td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
      </Panel>

      {invites.data.length > 0 && (
        <Panel title={t('team.pending')} padded={false} className="mt-6">
          <ul className="divide-y divide-ink-100">
            {invites.data.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <span className="flex-1 font-medium text-ink-900">{inv.email}</span>
                <span className="text-ink-500">{t(`role.${inv.role}` as MessageKey)}</span>
                <span className="text-ink-400">→ {formatDate(inv.expiresAt, locale)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/invite/${org.id}/${inv.id}`);
                    toast(t('common.copied'));
                  }}
                >
                  <Copy className="h-3.5 w-3.5" /> {t('common.copy')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-700"
                  onClick={async () => {
                    try {
                      await api(`/api/team/invites/${inv.id}`, { method: 'DELETE' });
                    } catch (err) {
                      toast(errorMessage(err), 'error');
                    }
                  }}
                >
                  {t('team.revoke')}
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('team.invite')}
        footer={
          link ? (
            <Button onClick={() => setOpen(false)}>{t('common.close')}</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                loading={busy}
                disabled={!email}
                onClick={async () => {
                  setBusy(true);
                  setError(null);
                  try {
                    const res = await api<{ link: string }>('/api/team/invites', { body: { email, role: inviteRole } });
                    setLink(res.link);
                  } catch (err) {
                    setError(errorMessage(err));
                  }
                  setBusy(false);
                }}
              >
                {t('team.inviteSend')}
              </Button>
            </>
          )
        }
      >
        {link ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-600">{t('team.inviteLink')}</p>
            <div className="flex gap-2">
              <Input readOnly value={link} onFocus={(e) => e.target.select()} />
              <Button
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(link);
                  toast(t('common.copied'));
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <a
              className="inline-block text-sm font-medium text-brand-800 underline underline-offset-4"
              href={`https://wa.me/?text=${encodeURIComponent(`${t('invite.title', { org: org.name })}: ${link}`)}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label={t('team.inviteEmail')}>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label={t('team.inviteRole')}>
              <div className="space-y-2">
                {ASSIGNABLE.map((r) => (
                  <label key={r} className="flex cursor-pointer items-start gap-3 rounded-lg border border-ink-200 p-3 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50">
                    <input type="radio" name="role" value={r} checked={inviteRole === r} onChange={() => setInviteRole(r)} className="mt-0.5 accent-brand-700" />
                    <span className="text-sm">
                      <span className="font-medium text-ink-900">{t(`role.${r}` as MessageKey)}</span>
                      <span className="block text-ink-500">{t(`team.roleHelp.${r}` as MessageKey)}</span>
                    </span>
                  </label>
                ))}
              </div>
            </Field>
            {error && <Alert tone="error">{error}</Alert>}
          </div>
        )}
      </Modal>
    </>
  );
}

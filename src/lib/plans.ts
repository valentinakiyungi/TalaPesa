import type { PlanId, Role } from './types';

export interface PlanDef {
  id: PlanId;
  name: string;
  /** Monthly price in TZS. */
  price: number;
  maxMembers: number;
  maxActiveLoans: number;
  sms: boolean;
  mobileMoney: boolean;
  highlight?: boolean;
}

export const TRIAL_DAYS = 14;

export const PLANS: Record<PlanId, PlanDef> = {
  trial: { id: 'trial', name: 'Trial', price: 0, maxMembers: 5, maxActiveLoans: 200, sms: true, mobileMoney: true },
  starter: { id: 'starter', name: 'Starter', price: 35_000, maxMembers: 2, maxActiveLoans: 150, sms: false, mobileMoney: true },
  growth: { id: 'growth', name: 'Growth', price: 85_000, maxMembers: 8, maxActiveLoans: 1_500, sms: true, mobileMoney: true, highlight: true },
  pro: { id: 'pro', name: 'Pro', price: 200_000, maxMembers: 1_000, maxActiveLoans: 1_000_000, sms: true, mobileMoney: true },
};

export const PAID_PLANS: PlanId[] = ['starter', 'growth', 'pro'];

export const ROLES: Role[] = ['owner', 'admin', 'officer', 'viewer'];

/** What each role may do. Server checks these; the UI uses them to hide controls. */
export const PERMISSIONS = {
  'customers.write': ['owner', 'admin', 'officer'],
  'loans.create': ['owner', 'admin', 'officer'],
  'loans.approve': ['owner', 'admin'],
  'loans.disburse': ['owner', 'admin'],
  'loans.writeoff': ['owner', 'admin'],
  'payments.record': ['owner', 'admin', 'officer'],
  'payments.reverse': ['owner', 'admin'],
  'sms.send': ['owner', 'admin', 'officer'],
  'settings.manage': ['owner', 'admin'],
  'team.manage': ['owner', 'admin'],
  'billing.manage': ['owner'],
  'reports.view': ['owner', 'admin', 'officer', 'viewer'],
} satisfies Record<string, Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | null | undefined, permission: Permission): boolean {
  return !!role && (PERMISSIONS[permission] as Role[]).includes(role);
}

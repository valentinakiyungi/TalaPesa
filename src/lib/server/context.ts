import 'server-only';
import type { NextRequest } from 'next/server';
import type { DocumentReference, Timestamp } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { can, type Permission } from '@/lib/plans';
import type { Member, Organization, Role } from '@/lib/types';
import { ApiError, forbidden } from './http';

export interface AuthedUser {
  uid: string;
  email: string;
  name: string;
}

export interface OrgContext extends AuthedUser {
  orgId: string;
  role: Role;
  org: Organization;
  orgRef: DocumentReference;
  member: Member;
}

export async function requireUser(req: NextRequest): Promise<AuthedUser> {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'unauthenticated', 'Sign in required');
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: (decoded.email || '').toLowerCase(),
      name: (decoded.name as string | undefined) || decoded.email?.split('@')[0] || 'User',
    };
  } catch {
    throw new ApiError(401, 'invalid_token', 'Session expired, sign in again');
  }
}

function tsMillis(v: unknown): number {
  if (!v) return 0;
  const t = v as Timestamp;
  if (typeof t.toMillis === 'function') return t.toMillis();
  const d = new Date(v as string);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

/** True while the org may create and change data (trial running or subscription paid). */
export function orgIsWritable(org: Organization, now = Date.now()): boolean {
  if (org.disabled) return false;
  if (org.planStatus === 'trialing') return tsMillis(org.trialEndsAt) > now;
  if (org.planStatus === 'active') return tsMillis(org.currentPeriodEnd) > now;
  return false;
}

interface Options {
  permission?: Permission;
  /** Set false for read-only endpoints and billing (which must work when expired). */
  write?: boolean;
}

export async function requireOrg(req: NextRequest, opts: Options = {}): Promise<OrgContext> {
  const user = await requireUser(req);
  const userSnap = await adminDb.doc(`users/${user.uid}`).get();
  const orgId = userSnap.get('orgId') as string | undefined;
  if (!orgId) throw forbidden('no_org', 'You are not part of a workspace yet');

  const orgRef = adminDb.doc(`orgs/${orgId}`);
  const [orgSnap, memberSnap] = await Promise.all([orgRef.get(), orgRef.collection('members').doc(user.uid).get()]);
  if (!orgSnap.exists || !memberSnap.exists) throw forbidden('no_org', 'Workspace not found');
  const member = memberSnap.data() as Member;
  if (member.status !== 'active') throw forbidden('member_disabled', 'Your access to this workspace was disabled');

  const org = { id: orgSnap.id, ...orgSnap.data() } as Organization;
  if (org.disabled) throw forbidden('org_suspended', 'This workspace is suspended. Contact support.');
  if (opts.permission && !can(member.role, opts.permission)) {
    throw forbidden('permission_denied', 'Your role does not allow this action');
  }
  if (opts.write !== false && !orgIsWritable(org)) {
    throw new ApiError(402, 'subscription_inactive', 'Subscription inactive. Choose a plan to continue.');
  }
  return { ...user, name: member.name || user.name, orgId, role: member.role, org, orgRef, member };
}

export function isPlatformAdmin(email: string): boolean {
  const list = (process.env.PLATFORM_ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function requirePlatformAdmin(req: NextRequest): Promise<AuthedUser> {
  const user = await requireUser(req);
  if (!isPlatformAdmin(user.email)) throw forbidden();
  return user;
}

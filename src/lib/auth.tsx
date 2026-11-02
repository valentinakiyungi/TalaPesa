'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut as fbSignOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import type { Member, Organization, Role, UserProfile } from '@/lib/types';

interface AuthState {
  /** Still resolving the Firebase session or profile. */
  loading: boolean;
  user: User | null;
  profile: UserProfile | null;
  org: Organization | null;
  member: Member | null;
  role: Role | null;
  /** Trial running or subscription paid. */
  writable: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function millis(v: unknown): number {
  if (!v) return 0;
  const t = v as { toMillis?: () => number };
  if (typeof t.toMillis === 'function') return t.toMillis();
  const d = new Date(v as string);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

export function orgWritable(org: Organization | null): boolean {
  if (!org || org.disabled) return false;
  if (org.planStatus === 'trialing') return millis(org.trialEndsAt) > Date.now();
  if (org.planStatus === 'active') return millis(org.currentPeriodEnd) > Date.now();
  return false;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [org, setOrg] = useState<Organization | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [orgReady, setOrgReady] = useState(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setAuthReady(true);
      }),
    [],
  );

  useEffect(() => {
    setProfile(null);
    setProfileReady(false);
    if (!user) {
      setProfileReady(true);
      return;
    }
    return onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        setProfile(snap.exists() ? ({ uid: snap.id, ...snap.data() } as UserProfile) : null);
        setProfileReady(true);
      },
      () => setProfileReady(true),
    );
  }, [user]);

  const orgId = profile?.orgId ?? null;
  useEffect(() => {
    setOrg(null);
    setMember(null);
    setOrgReady(false);
    if (!user || !orgId) {
      setOrgReady(true);
      return;
    }
    let gotOrg = false;
    let gotMember = false;
    const done = () => gotOrg && gotMember && setOrgReady(true);
    const u1 = onSnapshot(
      doc(db, 'orgs', orgId),
      (s) => {
        setOrg(s.exists() ? ({ id: s.id, ...s.data() } as Organization) : null);
        gotOrg = true;
        done();
      },
      () => {
        gotOrg = true;
        setOrg(null);
        done();
      },
    );
    const u2 = onSnapshot(
      doc(db, 'orgs', orgId, 'members', user.uid),
      (s) => {
        setMember(s.exists() ? (s.data() as Member) : null);
        gotMember = true;
        done();
      },
      () => {
        gotMember = true;
        setMember(null);
        done();
      },
    );
    return () => {
      u1();
      u2();
    };
  }, [user, orgId]);

  const signOut = useCallback(async () => {
    await fbSignOut(auth);
  }, []);

  const value = useMemo<AuthState>(() => {
    const activeMember = member && member.status === 'active' ? member : null;
    return {
      loading: !authReady || !profileReady || (!!orgId && !orgReady),
      user,
      profile,
      org: activeMember ? org : null,
      member: activeMember,
      role: activeMember?.role ?? null,
      writable: orgWritable(org),
      signOut,
    };
  }, [authReady, profileReady, orgReady, orgId, user, profile, org, member, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

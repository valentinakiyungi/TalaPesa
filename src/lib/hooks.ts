'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  limit as qLimit,
  onSnapshot,
  orderBy,
  query,
  where,
  type QueryConstraint,
  type WhereFilterOp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/lib/auth';

export type Filter = [string, WhereFilterOp, unknown];

interface CollectionOptions {
  where?: Filter[];
  orderBy?: [string, 'asc' | 'desc'];
  limit?: number;
}

/** Live list of docs in orgs/{orgId}/{name}. Pass `null` to skip. */
export function useOrgCollection<T>(name: string | null, opts: CollectionOptions = {}) {
  const { org } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify([org?.id, name, opts]);

  useEffect(() => {
    if (!org || !name) {
      setData([]);
      setLoading(!org);
      return;
    }
    setLoading(true);
    const constraints: QueryConstraint[] = [];
    for (const [f, op, v] of opts.where ?? []) constraints.push(where(f, op, v));
    if (opts.orderBy) constraints.push(orderBy(opts.orderBy[0], opts.orderBy[1]));
    if (opts.limit) constraints.push(qLimit(opts.limit));
    const q = query(collection(db, 'orgs', org.id, name), ...constraints);
    return onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`[firestore] ${name}`, err);
        setError(err.message);
        setLoading(false);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, loading, error };
}

/** Live single doc at orgs/{orgId}/{name}/{id}. */
export function useOrgDoc<T>(name: string, id: string | null | undefined) {
  const { org } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  const orgId = org?.id;
  useEffect(() => {
    if (!orgId || !id) return;
    setLoading(true);
    return onSnapshot(
      doc(db, 'orgs', orgId, name, id),
      (snap) => {
        setData(snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null);
        setMissing(!snap.exists());
        setLoading(false);
      },
      () => {
        setMissing(true);
        setLoading(false);
      },
    );
  }, [orgId, name, id]);

  return { data, loading, missing };
}

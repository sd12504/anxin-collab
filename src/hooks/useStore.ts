import { useState, useCallback, useEffect } from 'react';
import type { AppState, CaseData, Asset, BrandSettings } from '../types';
import { defaultBrandSettings } from '../data/store';
import { getAuthToken } from './useAuth';

const CASE_API_URL = (import.meta.env.VITE_AI_PROXY_URL || '').replace(/\/$/, '');

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function fetchBackendCases(): Promise<CaseData[]> {
  if (!CASE_API_URL) return [];
  const res = await fetch(`${CASE_API_URL}/api/cases`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`讀取案件失敗：${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data as CaseData[] : [];
}

async function upsertBackendCase(c: CaseData): Promise<void> {
  if (!CASE_API_URL) throw new Error('未設定後端 API 網址');
  const res = await fetch(`${CASE_API_URL}/api/cases/${encodeURIComponent(c.id)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(c),
  });
  if (!res.ok) throw new Error(`同步案件失敗：${res.status}`);
}

async function deleteBackendCase(id: string): Promise<void> {
  if (!CASE_API_URL) throw new Error('未設定後端 API 網址');
  const res = await fetch(`${CASE_API_URL}/api/cases/${encodeURIComponent(id)}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok && res.status !== 404) throw new Error(`刪除案件失敗：${res.status}`);
}

// In-memory state only — no localStorage cache
let globalState: AppState = { cases: [], assets: [], brandSettings: { ...defaultBrandSettings }, editingId: null };
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

async function loadCasesFromBackend(): Promise<void> {
  if (!CASE_API_URL) return;
  try {
    const remote = await fetchBackendCases();
    globalState.cases = remote;
    if (globalState.editingId && !remote.some(c => c.id === globalState.editingId)) {
      globalState.editingId = remote[0]?.id || null;
    }
    notify();
  } catch (err) {
    console.warn('讀取後端案件失敗：', (err as Error).message);
  }
}

let initialLoadDone = false;

export function useStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    listeners.add(fn);
    if (!initialLoadDone) {
      initialLoadDone = true;
      loadCasesFromBackend();
    }
    return () => { listeners.delete(fn); };
  }, []);

  const updateCase = useCallback(async (id: string, patch: Partial<CaseData>) => {
    const idx = globalState.cases.findIndex(c => c.id === id);
    if (idx >= 0) {
      const updated = { ...globalState.cases[idx], ...patch, updatedAt: new Date().toISOString() };
      globalState.cases[idx] = updated;
      notify();
      await upsertBackendCase(updated);
    }
  }, []);

  const addCase = useCallback(async (c: CaseData) => {
    globalState.cases.push(c);
    notify();
    await upsertBackendCase(c);
  }, []);

  const deleteCase = useCallback(async (id: string) => {
    globalState.cases = globalState.cases.filter(c => c.id !== id);
    if (globalState.editingId === id) globalState.editingId = null;
    notify();
    await deleteBackendCase(id);
  }, []);

  const setEditingId = useCallback((id: string | null) => {
    globalState.editingId = id;
    notify();
  }, []);

  const updateBrandSettings = useCallback((patch: Partial<BrandSettings>) => {
    globalState.brandSettings = { ...globalState.brandSettings, ...patch };
    notify();
  }, []);

  const addAsset = useCallback((a: Asset) => {
    globalState.assets.push(a);
    notify();
  }, []);

  const updateAsset = useCallback((id: string, patch: Partial<Asset>) => {
    const idx = globalState.assets.findIndex(a => a.id === id);
    if (idx >= 0) {
      globalState.assets[idx] = { ...globalState.assets[idx], ...patch };
      notify();
    }
  }, []);

  const deleteAsset = useCallback((id: string) => {
    globalState.assets = globalState.assets.filter(a => a.id !== id);
    notify();
  }, []);

  const getCase = useCallback((id: string): CaseData | undefined => {
    return globalState.cases.find(c => c.id === id);
  }, []);

  return {
    cases: globalState.cases,
    assets: globalState.assets,
    brandSettings: globalState.brandSettings,
    editingId: globalState.editingId,
    updateCase,
    addCase,
    deleteCase,
    setEditingId,
    updateBrandSettings,
    addAsset,
    updateAsset,
    deleteAsset,
    getCase,
  };
}

import { useState, useCallback, useEffect } from 'react';
import type { AppState, CaseData, Asset, BrandSettings } from '../types';
import { loadState, saveState, defaultBrandSettings } from '../data/store';
import { createDemoCases } from '../data/mockData';

let globalState: AppState | null = null;
const listeners = new Set<() => void>();
let backendSyncStarted = false;
const CASE_API_URL = (import.meta.env.VITE_AI_PROXY_URL || '').replace(/\/$/, '');

function isDemoCase(c: CaseData): boolean {
  return c.id.startsWith('demo-');
}

async function fetchBackendCases(): Promise<CaseData[]> {
  if (!CASE_API_URL) return [];
  const res = await fetch(`${CASE_API_URL}/api/cases`);
  if (!res.ok) throw new Error(`讀取 Postgres 案件失敗：${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data as CaseData[] : [];
}

async function upsertBackendCase(c: CaseData): Promise<void> {
  if (!CASE_API_URL || isDemoCase(c)) return;
  const res = await fetch(`${CASE_API_URL}/api/cases/${encodeURIComponent(c.id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(c),
  });
  if (!res.ok) throw new Error(`同步 Postgres 案件失敗：${res.status}`);
}

async function deleteBackendCase(id: string): Promise<void> {
  if (!CASE_API_URL || id.startsWith('demo-')) return;
  const res = await fetch(`${CASE_API_URL}/api/cases/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) throw new Error(`刪除 Postgres 案件失敗：${res.status}`);
}

function getState(): AppState {
  if (!globalState) {
    globalState = loadState();
    if (globalState.cases.length === 0) {
      globalState.cases = createDemoCases();
    }
    if (!globalState.brandSettings) {
      globalState.brandSettings = { ...defaultBrandSettings };
    }
    if (!globalState.assets) globalState.assets = [];
    if (globalState.editingId === undefined) globalState.editingId = null;
  }
  return globalState;
}

function notify() {
  saveState(globalState!);
  listeners.forEach(fn => fn());
}

async function syncCasesFromBackend(): Promise<void> {
  if (backendSyncStarted || !CASE_API_URL) return;
  backendSyncStarted = true;

  const s = getState();
  const localUserCases = s.cases.filter(c => !isDemoCase(c));

  try {
    const remoteCases = await fetchBackendCases();
    if (remoteCases.length > 0) {
      s.cases = remoteCases;
      if (s.editingId && !s.cases.some(c => c.id === s.editingId)) s.editingId = s.cases[0]?.id || null;
      notify();
      return;
    }

    if (localUserCases.length > 0) {
      s.cases = localUserCases;
      await Promise.all(localUserCases.map(c => upsertBackendCase(c)));
      notify();
      return;
    }

    s.cases = [];
    s.editingId = null;
    notify();
  } catch (err) {
    console.warn('Postgres 案件同步失敗，暫用 localStorage：', (err as Error).message);
  }
}

export function useStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    listeners.add(fn);
    void syncCasesFromBackend();
    return () => { listeners.delete(fn); };
  }, []);

  const state = getState();

  const updateCase = useCallback((id: string, patch: Partial<CaseData>) => {
    const s = getState();
    const idx = s.cases.findIndex(c => c.id === id);
    if (idx >= 0) {
      const updated = { ...s.cases[idx], ...patch, updatedAt: new Date().toISOString() };
      s.cases[idx] = updated;
      notify();
      void upsertBackendCase(updated).catch(err => console.warn(err.message));
    }
  }, []);

  const addCase = useCallback((c: CaseData) => {
    const s = getState();
    s.cases.push(c);
    notify();
    void upsertBackendCase(c).catch(err => console.warn(err.message));
  }, []);

  const deleteCase = useCallback((id: string) => {
    const s = getState();
    s.cases = s.cases.filter(c => c.id !== id);
    if (s.editingId === id) s.editingId = null;
    notify();
    void deleteBackendCase(id).catch(err => console.warn(err.message));
  }, []);

  const setEditingId = useCallback((id: string | null) => {
    const s = getState();
    s.editingId = id;
    notify();
  }, []);

  const updateBrandSettings = useCallback((patch: Partial<BrandSettings>) => {
    const s = getState();
    s.brandSettings = { ...s.brandSettings, ...patch };
    notify();
  }, []);

  const addAsset = useCallback((a: Asset) => {
    const s = getState();
    s.assets.push(a);
    notify();
  }, []);

  const updateAsset = useCallback((id: string, patch: Partial<Asset>) => {
    const s = getState();
    const idx = s.assets.findIndex(a => a.id === id);
    if (idx >= 0) {
      s.assets[idx] = { ...s.assets[idx], ...patch };
      notify();
    }
  }, []);

  const deleteAsset = useCallback((id: string) => {
    const s = getState();
    s.assets = s.assets.filter(a => a.id !== id);
    notify();
  }, []);

  const getCase = useCallback((id: string): CaseData | undefined => {
    return getState().cases.find(c => c.id === id);
  }, []);

  return {
    cases: state.cases,
    assets: state.assets,
    brandSettings: state.brandSettings,
    editingId: state.editingId,
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

import { useState, useCallback, useEffect } from 'react';
import type { AppState, CaseData, Asset, BrandSettings } from '../types';
import { loadState, saveState, defaultBrandSettings } from '../data/store';
import { createDemoCases } from '../data/mockData';

let globalState: AppState | null = null;
const listeners = new Set<() => void>();

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

export function useStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  const state = getState();

  const updateCase = useCallback((id: string, patch: Partial<CaseData>) => {
    const s = getState();
    const idx = s.cases.findIndex(c => c.id === id);
    if (idx >= 0) {
      s.cases[idx] = { ...s.cases[idx], ...patch, updatedAt: new Date().toISOString() };
      notify();
    }
  }, []);

  const addCase = useCallback((c: CaseData) => {
    const s = getState();
    s.cases.push(c);
    notify();
  }, []);

  const deleteCase = useCallback((id: string) => {
    const s = getState();
    s.cases = s.cases.filter(c => c.id !== id);
    if (s.editingId === id) s.editingId = null;
    notify();
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
    getCase,
  };
}

import { create } from 'zustand';

interface SyncStore {
  isOffline: boolean;
  setOffline: (offline: boolean) => Promise<void>;
  toggleOffline: () => Promise<void>;
  initializeOfflineState: () => Promise<void>;
}

export const useSyncStore = create<SyncStore>()((set, get) => ({
  isOffline: localStorage.getItem('lims-work-offline') === 'true',
  
  setOffline: async (offline: boolean) => {
    localStorage.setItem('lims-work-offline', offline ? 'true' : 'false');
    set({ isOffline: offline });
    if (window.electronAPI?.setForcedOffline) {
      await window.electronAPI.setForcedOffline(offline);
    }
  },
  
  toggleOffline: async () => {
    const nextState = !get().isOffline;
    await get().setOffline(nextState);
  },
  
  initializeOfflineState: async () => {
    const stored = localStorage.getItem('lims-work-offline') === 'true';
    set({ isOffline: stored });
    if (window.electronAPI?.setForcedOffline) {
      await window.electronAPI.setForcedOffline(stored);
    }
  }
}));

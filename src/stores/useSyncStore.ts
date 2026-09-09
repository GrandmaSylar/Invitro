import { create } from 'zustand';

interface SyncStore {
  isOffline: boolean;
  setOffline: (offline: boolean) => Promise<void>;
  toggleOffline: () => Promise<void>;
  initializeOfflineState: () => Promise<void>;
}

export const useSyncStore = create<SyncStore>()((_set) => ({
  isOffline: false,
  setOffline: async () => {},
  toggleOffline: async () => {},
  initializeOfflineState: async () => {}
}));

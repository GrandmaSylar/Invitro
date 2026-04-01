import { create } from 'zustand';
import { AuditEvent } from '../lib/types';

interface AuditStore {
  events: AuditEvent[];
  addEvent: (event: Omit<AuditEvent, 'id' | 'timestamp'>) => void;
}

export const useAuditStore = create<AuditStore>((set) => ({
  events: [],
  addEvent: (event) => set((state) => ({
    events: [
      {
        ...event,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
      ...state.events,
    ],
  })),
}));

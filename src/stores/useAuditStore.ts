import { create } from 'zustand';
import { AuditEvent } from '../lib/types';
import { auditService } from '../services/auditService';

interface AuditStore {
  events: AuditEvent[];
  addEvent: (event: Omit<AuditEvent, 'id' | 'timestamp'>) => void;
}

export const useAuditStore = create<AuditStore>(() => ({
  events: [], // Deprecated, but keeping to satisfy interface
  addEvent: (event) => {
    // Send event directly to Supabase via auditService
    // We don't await this because Zustand actions are synchronous and audit logging should happen in the background
    auditService.logEvent(event).catch(console.error);
  },
}));

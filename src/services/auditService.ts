/**
 * Audit Service — Writes audit events to the database
 * and provides paginated retrieval.
 * Refactored to route queries through the dbAdapter to support offline SQLite capability.
 */
import { dbAdapter } from './dbAdapter';
import type { AuditEvent, AuditFilters } from '../lib/types';

export const auditService = {
  logEvent: async (event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> => {
    return dbAdapter.audit.logEvent(event);
  },

  getEvents: async (filters?: AuditFilters): Promise<AuditEvent[]> => {
    return dbAdapter.audit.getEvents(filters);
  },

  getEventsByActor: async (actorId: string, limit = 50): Promise<AuditEvent[]> => {
    return dbAdapter.audit.getEventsByActor(actorId, limit);
  },
};

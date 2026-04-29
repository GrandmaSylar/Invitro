/**
 * Audit Service — Writes audit events to the database
 * and provides paginated retrieval.
 *
 * Replaces the old local-only useAuditStore approach.
 */
import { supabase } from '../lib/supabase';
import { mapAuditEventRow } from '../lib/mappers';
import type { AuditEvent, AuditFilters } from '../lib/types';

export const auditService = {
  logEvent: async (event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> => {
    const { error } = await supabase
      .from('audit_events')
      .insert({
        actor_id: event.actorId,
        actor_name: event.actorName,
        action: event.action,
        target_type: event.targetType,
        target_id: event.targetId,
        target_name: event.targetName,
        detail: event.detail ?? '',
      });

    if (error) {
      // Audit failures should not crash the app — log and continue
      console.error(`Audit log failed: ${error.message}`);
    }
  },

  getEvents: async (filters?: AuditFilters): Promise<AuditEvent[]> => {
    let query = supabase
      .from('audit_events')
      .select('*')
      .order('timestamp', { ascending: false });

    if (filters?.actorId) {
      query = query.eq('actor_id', filters.actorId);
    }
    if (filters?.action) {
      query = query.eq('action', filters.action);
    }
    if (filters?.targetType) {
      query = query.eq('target_type', filters.targetType);
    }
    if (filters?.dateFrom) {
      query = query.gte('timestamp', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('timestamp', filters.dateTo);
    }

    const limit = filters?.limit ?? 100;
    const offset = filters?.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch audit events: ${error.message}`);
    return (data ?? []).map(mapAuditEventRow);
  },

  getEventsByActor: async (actorId: string, limit = 50): Promise<AuditEvent[]> => {
    return auditService.getEvents({ actorId, limit });
  },
};

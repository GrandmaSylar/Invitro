import { useState, useEffect } from 'react';
import { auditService } from '../services/auditService';
import { AuditEvent, AuditFilters } from '../lib/types';

export function useAuditLog(filters?: AuditFilters) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await auditService.getEvents(filters);
      setEvents(data);
    } catch (e) {
      console.error('Failed to fetch audit events', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  const addEvent = async (event: Omit<AuditEvent, 'id' | 'timestamp'>) => {
    await auditService.logEvent(event);
    fetchEvents();
  };

  return {
    events,
    loading,
    addEvent,
    refresh: fetchEvents,
  };
}

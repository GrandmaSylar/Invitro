import { useAuditStore } from '../stores/useAuditStore';

export function useAuditLog() {
  const events = useAuditStore((state) => state.events);
  const addEvent = useAuditStore((state) => state.addEvent);

  return {
    events,
    addEvent,
  };
}

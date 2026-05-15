import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService } from '../services/patientService';
import type { Patient, PatientFilters } from '../lib/types';

export const patientKeys = {
  search: (query: string) => ['patients', 'search', query] as const,
  list: (filters: PatientFilters) => ['patients', 'list', filters] as const,
};

export function usePatientSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: patientKeys.search(debouncedQuery),
    queryFn: () => patientService.searchPatients(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  return { patients: data ?? [], isLoading, isError, error };
}

export function usePatientsList(filters: PatientFilters) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: patientKeys.list(filters),
    queryFn: () => patientService.getPatients(filters),
  });

  return { patients: data ?? [], isLoading, isError, error };
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Parameters<typeof patientService.updatePatient>[1] }) =>
      patientService.updatePatient(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: patientKeys.search('') });
      // Depending on structure, you might invalidate more
      qc.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

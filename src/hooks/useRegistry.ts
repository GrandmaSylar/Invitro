/**
 * React Query hooks for hospitals and doctors.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { registryService } from '../services/registryService';
import type { Hospital, Doctor } from '../lib/types';

export const registryKeys = {
  hospitals: ['hospitals'] as const,
  doctors: (hospitalId?: string) => ['doctors', hospitalId] as const,
};

// ── Hospitals ──────────────────────────────────────────────────

export function useHospitals() {
  return useQuery({
    queryKey: registryKeys.hospitals,
    queryFn: () => registryService.getHospitals(),
  });
}

export function useCreateHospital() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Hospital, 'id' | 'createdAt'>) => registryService.createHospital(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospitals'] }),
  });
}

export function useUpdateHospital() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Hospital, 'id' | 'createdAt'>> }) =>
      registryService.updateHospital(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospitals'] }),
  });
}

export function useDeleteHospital() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => registryService.deleteHospital(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospitals'] }),
  });
}

// ── Doctors ────────────────────────────────────────────────────

export function useDoctors(hospitalId?: string) {
  return useQuery({
    queryKey: registryKeys.doctors(hospitalId),
    queryFn: () => registryService.getDoctors(hospitalId),
  });
}

export function useCreateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Doctor, 'id' | 'createdAt'>) => registryService.createDoctor(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctors'] }),
  });
}

export function useUpdateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Doctor, 'id' | 'createdAt'>> }) =>
      registryService.updateDoctor(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctors'] }),
  });
}

export function useDeleteDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => registryService.deleteDoctor(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctors'] }),
  });
}

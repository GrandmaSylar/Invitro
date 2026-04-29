/**
 * React Query hooks for the test catalog (tests, parameters, antibiotics).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogService } from '../services/catalogService';
import type { Test, Parameter, Antibiotic, TestFilters } from '../lib/types';

// ── Query Keys ─────────────────────────────────────────────────

export const catalogKeys = {
  tests: (filters?: TestFilters) => ['tests', filters] as const,
  testDetail: (id: string) => ['tests', id] as const,
  parameters: ['parameters'] as const,
  antibiotics: ['antibiotics'] as const,
  departments: ['departments'] as const,
};

// ── Tests ──────────────────────────────────────────────────────

export function useTests(filters?: TestFilters) {
  return useQuery({
    queryKey: catalogKeys.tests(filters),
    queryFn: () => catalogService.getTests(filters),
  });
}

export function useCreateTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Test, 'id' | 'createdAt'>) => catalogService.createTest(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tests'] }),
  });
}

export function useUpdateTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Test, 'id' | 'createdAt'>> }) =>
      catalogService.updateTest(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tests'] }),
  });
}

export function useDeleteTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => catalogService.deleteTest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tests'] }),
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: catalogKeys.departments,
    queryFn: () => catalogService.getDepartments(),
    staleTime: 1000 * 60 * 10, // departments change rarely
  });
}

// ── Parameters ─────────────────────────────────────────────────

export function useParameters() {
  return useQuery({
    queryKey: catalogKeys.parameters,
    queryFn: () => catalogService.getParameters(),
  });
}

export function useCreateParameter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Parameter, 'id' | 'createdAt'>) => catalogService.createParameter(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parameters'] }),
  });
}

export function useDeleteParameter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => catalogService.deleteParameter(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parameters'] }),
  });
}

// ── Antibiotics ────────────────────────────────────────────────

export function useAntibiotics() {
  return useQuery({
    queryKey: catalogKeys.antibiotics,
    queryFn: () => catalogService.getAntibiotics(),
  });
}

export function useCreateAntibiotic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => catalogService.createAntibiotic(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['antibiotics'] }),
  });
}

export function useDeleteAntibiotic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => catalogService.deleteAntibiotic(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['antibiotics'] }),
  });
}

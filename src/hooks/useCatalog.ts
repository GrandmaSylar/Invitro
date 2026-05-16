/**
 * React Query hooks for the test catalog (tests, parameters, antibiotics).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogService } from '../services/catalogService';
import type { Test, Parameter, Antibiotic, TestFilters } from '../lib/types';

// ── Query Keys ─────────────────────────────────────────────────

export const catalogKeys = {
  tests: (filters?: TestFilters) => ['tests', filters] as const,
  testDetail: (id: string) => ['testDetail', id] as const,
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

export function useTestDetail(id: string | null) {
  return useQuery({
    queryKey: catalogKeys.testDetail(id!),
    queryFn: () => catalogService.getTestById(id!),
    enabled: !!id,
  });
}

export function useCreateTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Test, 'id' | 'createdAt'>) => catalogService.createTest(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tests'] });
      qc.invalidateQueries({ queryKey: ['departments'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      qc.invalidateQueries({ queryKey: ['dashboard-charts'] });
    },
  });
}

export function useUpdateTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Test, 'id' | 'createdAt'>> }) =>
      catalogService.updateTest(id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['tests'] });
      qc.invalidateQueries({ queryKey: ['testDetail', variables.id] });
      qc.invalidateQueries({ queryKey: ['departments'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      qc.invalidateQueries({ queryKey: ['dashboard-charts'] });
    },
  });
}

export function useDeleteTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => catalogService.deleteTest(id),
    onSuccess: (_, deletedId) => {
      qc.invalidateQueries({ queryKey: ['tests'] });
      qc.removeQueries({ queryKey: ['testDetail', deletedId] });
      qc.invalidateQueries({ queryKey: ['departments'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      qc.invalidateQueries({ queryKey: ['dashboard-charts'] });
    },
  });
}

// ── Departments (derived from tests.department column) ─────────

export function useLinkParameter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ testId, parameterId, sortOrder = 0 }: { testId: string; parameterId: string; sortOrder?: number }) =>
      catalogService.linkParameter(testId, parameterId, sortOrder),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: catalogKeys.testDetail(variables.testId) });
      qc.invalidateQueries({ queryKey: ['tests'] }); // parameter count may be shown in tests list
    },
  });
}

export function useUnlinkParameter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ testId, parameterId }: { testId: string; parameterId: string }) =>
      catalogService.unlinkParameter(testId, parameterId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: catalogKeys.testDetail(variables.testId) });
      qc.invalidateQueries({ queryKey: ['tests'] });
    },
  });
}

// ── Departments ────────────────────────────────────────────────

export function useDepartments() {
  return useQuery({
    queryKey: catalogKeys.departments,
    queryFn: () => catalogService.getDepartments(),
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => catalogService.createDepartment(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => catalogService.updateDepartment(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => catalogService.deleteDepartment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });
}

// ── Parameters ─────────────────────────────────────────────────

export function useParameters() {
  return useQuery({
    queryKey: catalogKeys.parameters,
    queryFn: () => catalogService.getParameters(),
  });
}

export function usePreviewParameterCode() {
  return useQuery({
    queryKey: ['parameter-code-preview'],
    queryFn: () => catalogService.previewParameterCode(),
    staleTime: 0, // Always want fresh
  });
}

export function useCreateParameter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Parameter, 'id' | 'createdAt'>) => catalogService.createParameter(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parameters'] });
      qc.invalidateQueries({ queryKey: ['parameter-code-preview'] });
    },
  });
}

export function useUpdateParameter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Parameter, 'id' | 'createdAt'>> }) =>
      catalogService.updateParameter(id, data),
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

export function useUpdateAntibiotic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => catalogService.updateAntibiotic(id, name),
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

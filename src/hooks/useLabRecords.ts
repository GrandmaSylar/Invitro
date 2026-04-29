import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { labRecordService } from '../services/labRecordService';
import type { LabRecordFilters } from '../lib/types';

export const labRecordKeys = {
  all: ['labRecords'] as const,
  lists: () => [...labRecordKeys.all, 'list'] as const,
  list: (filters: LabRecordFilters) => [...labRecordKeys.lists(), filters] as const,
  details: () => [...labRecordKeys.all, 'detail'] as const,
  detail: (id: string) => [...labRecordKeys.details(), id] as const,
  byLabNumber: (labNumber: string) => [...labRecordKeys.all, 'byLabNumber', labNumber] as const,
  tests: (id: string) => [...labRecordKeys.detail(id), 'tests'] as const,
};

export function useLabRecords(filters?: LabRecordFilters) {
  return useQuery({
    queryKey: labRecordKeys.list(filters || {}),
    queryFn: () => labRecordService.getLabRecords(filters),
  });
}

export function useLabRecord(id: string) {
  return useQuery({
    queryKey: labRecordKeys.detail(id),
    queryFn: () => labRecordService.getLabRecordById(id),
    enabled: !!id,
  });
}

export function useLabRecordByNumber(labNumber: string) {
  return useQuery({
    queryKey: labRecordKeys.byLabNumber(labNumber),
    queryFn: () => labRecordService.getLabRecordByLabNumber(labNumber),
    enabled: !!labNumber,
    retry: false, // Don't retry if patient not found for instant feedback
  });
}

export function useLabRecordTests(labRecordId: string) {
  return useQuery({
    queryKey: labRecordKeys.tests(labRecordId),
    queryFn: () => labRecordService.getTestsForRecord(labRecordId),
    enabled: !!labRecordId,
  });
}

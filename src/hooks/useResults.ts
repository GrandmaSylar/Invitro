import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resultService } from '../services/resultService';
import type { TestResult, ResultFlag } from '../lib/types';

export const resultKeys = {
  all: ['results'] as const,
  byRecord: (recordId: string) => [...resultKeys.all, 'record', recordId] as const,
  byRecordTest: (recordTestId: string) => [...resultKeys.all, 'test', recordTestId] as const,
};

export function useResultsByRecord(labRecordId: string) {
  return useQuery({
    queryKey: resultKeys.byRecord(labRecordId),
    queryFn: () => resultService.getResultsByLabRecord(labRecordId),
    enabled: !!labRecordId,
  });
}

export function useEnterResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof resultService.enterResult>[0]) => 
      resultService.enterResult(data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: resultKeys.all });
    },
  });
}

export function useUpdateResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof resultService.updateResult>[1] }) => 
      resultService.updateResult(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: resultKeys.all });
    },
  });
}

export function useBulkEnterResults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (results: Parameters<typeof resultService.bulkEnterResults>[0]) => 
      resultService.bulkEnterResults(results),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: resultKeys.all });
    },
  });
}

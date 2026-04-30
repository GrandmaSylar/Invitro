import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { labRecordService } from '../services/labRecordService';
import type { LabRecordFilters, TestItem } from '../lib/types';

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

// ── Structured result for bulk-add mutation ────────────────────

export interface AddTestsResult {
  /** Total number of tests attempted */
  total: number;
  /** Number of tests successfully attached */
  completedCount: number;
  /** Tests that were successfully added (in order) */
  completedTests: TestItem[];
  /** Tests that were NOT added (remaining after failure) */
  remainingTests: TestItem[];
  /** If a failure occurred, the error from the first failing test */
  error?: Error;
}

export class PartialAddTestsError extends Error {
  public readonly result: AddTestsResult;

  constructor(result: AddTestsResult) {
    const msg = `Failed after attaching ${result.completedCount} of ${result.total} tests: ${result.error?.message ?? 'unknown error'}`;
    super(msg);
    this.name = 'PartialAddTestsError';
    this.result = result;
  }
}

export function useAddTestsToRecord() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ labRecordId, tests }: { labRecordId: string; tests: TestItem[] }): Promise<AddTestsResult> => {
      const completedTests: TestItem[] = [];

      for (let i = 0; i < tests.length; i++) {
        try {
          await labRecordService.addTestToRecord(labRecordId, tests[i]);
          completedTests.push(tests[i]);
        } catch (err) {
          const remainingTests = tests.slice(i);
          const result: AddTestsResult = {
            total: tests.length,
            completedCount: completedTests.length,
            completedTests,
            remainingTests,
            error: err instanceof Error ? err : new Error(String(err)),
          };

          // Throw structured error so callers can inspect partial progress
          throw new PartialAddTestsError(result);
        }
      }

      return {
        total: tests.length,
        completedCount: completedTests.length,
        completedTests,
        remainingTests: [],
      };
    },

    // Invalidate on both success and partial failure so the UI always
    // reflects the true state of the record after any writes occurred.
    onSettled: (_, __, variables) => {
      if (variables) {
        qc.invalidateQueries({ queryKey: labRecordKeys.tests(variables.labRecordId) });
        qc.invalidateQueries({ queryKey: labRecordKeys.detail(variables.labRecordId) });
      }
    },
  });
}

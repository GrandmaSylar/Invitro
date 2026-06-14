/**
 * Result Service — Test result entry, flagging, and approval.
 * Refactored to route queries through the dbAdapter to support offline SQLite capability.
 */
import { dbAdapter } from './dbAdapter';
import type { TestResult, ResultFlag } from '../lib/types';

export const resultService = {
  getResultsByLabRecordTest: async (labRecordTestId: string): Promise<TestResult[]> => {
    return dbAdapter.results.getResultsByLabRecordTest(labRecordTestId);
  },

  getResultsByLabRecord: async (labRecordId: string): Promise<TestResult[]> => {
    return dbAdapter.results.getResultsByLabRecord(labRecordId);
  },

  enterResult: async (resultData: {
    labRecordTestId: string;
    testName: string;
    department: string;
    referenceRange?: string;
    unit?: string;
    result?: string;
    flag?: ResultFlag;
    enteredById?: string;
  }): Promise<TestResult> => {
    return dbAdapter.results.enterResult(resultData);
  },

  updateResult: async (
    id: string,
    updates: Partial<{
      result: string;
      flag: ResultFlag;
      referenceRange: string;
      unit: string;
    }>
  ): Promise<TestResult> => {
    return dbAdapter.results.updateResult(id, updates);
  },

  bulkEnterResults: async (
    results: Array<{
      labRecordTestId: string;
      testName: string;
      department: string;
      referenceRange?: string;
      unit?: string;
      result?: string;
      flag?: ResultFlag;
      enteredById?: string;
    }>
  ): Promise<TestResult[]> => {
    return dbAdapter.results.bulkEnterResults(results);
  },

  deleteResult: async (id: string): Promise<void> => {
    return dbAdapter.results.deleteResult(id);
  },
};

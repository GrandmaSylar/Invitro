/**
 * Result Service — Test result entry, flagging, and approval.
 */
import { supabase } from '../lib/supabase';
import { mapTestResultRow } from '../lib/mappers';
import type { TestResult, ResultFlag } from '../lib/types';

export const resultService = {
  getResultsByLabRecordTest: async (labRecordTestId: string): Promise<TestResult[]> => {
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('lab_record_test_id', labRecordTestId)
      .order('entered_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch results: ${error.message}`);
    return (data ?? []).map(mapTestResultRow);
  },

  getResultsByLabRecord: async (labRecordId: string): Promise<TestResult[]> => {
    // Fetch all lab_record_tests for this record, then get their results
    const { data: recordTests, error: rtError } = await supabase
      .from('lab_record_tests')
      .select('id')
      .eq('lab_record_id', labRecordId);

    if (rtError) throw new Error(`Failed to fetch record tests: ${rtError.message}`);
    if (!recordTests || recordTests.length === 0) return [];

    const ids = recordTests.map((rt: any) => rt.id);
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .in('lab_record_test_id', ids)
      .order('entered_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch results: ${error.message}`);
    return (data ?? []).map(mapTestResultRow);
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
    const { data, error } = await supabase
      .from('test_results')
      .insert({
        lab_record_test_id: resultData.labRecordTestId,
        test_name: resultData.testName,
        department: resultData.department,
        reference_range: resultData.referenceRange ?? null,
        unit: resultData.unit ?? null,
        result: resultData.result ?? null,
        flag: resultData.flag ?? 'Normal',
        entered_by_id: resultData.enteredById ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to enter result: ${error.message}`);
    return mapTestResultRow(data);
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
    const dbUpdates: Record<string, any> = {};
    if (updates.result !== undefined) dbUpdates.result = updates.result;
    if (updates.flag !== undefined) dbUpdates.flag = updates.flag;
    if (updates.referenceRange !== undefined) dbUpdates.reference_range = updates.referenceRange;
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit;

    const { data, error } = await supabase
      .from('test_results')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update result: ${error.message}`);
    return mapTestResultRow(data);
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
    const rows = results.map((r) => ({
      lab_record_test_id: r.labRecordTestId,
      test_name: r.testName,
      department: r.department,
      reference_range: r.referenceRange ?? null,
      unit: r.unit ?? null,
      result: r.result ?? null,
      flag: r.flag ?? 'Normal',
      entered_by_id: r.enteredById ?? null,
    }));

    const { data, error } = await supabase
      .from('test_results')
      .insert(rows)
      .select();

    if (error) throw new Error(`Failed to bulk enter results: ${error.message}`);
    return (data ?? []).map(mapTestResultRow);
  },

  deleteResult: async (id: string): Promise<void> => {
    const { error } = await supabase.from('test_results').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete result: ${error.message}`);
  },
};

/**
 * Catalog Service — CRUD for test catalog, parameters, and antibiotics.
 */
import { supabase } from '../lib/supabase';
import { mapTestRow, mapParameterRow, mapAntibioticRow } from '../lib/mappers';
import type { Test, Parameter, Antibiotic, TestFilters } from '../lib/types';

export const catalogService = {
  // ── TESTS ────────────────────────────────────────────────────

  getTests: async (filters?: TestFilters): Promise<Test[]> => {
    let query = supabase
      .from('tests')
      .select('*')
      .order('test_name', { ascending: true });

    if (filters?.department) {
      query = query.eq('department', filters.department);
    }
    if (filters?.search) {
      query = query.ilike('test_name', `%${filters.search}%`);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch tests: ${error.message}`);
    return (data ?? []).map(mapTestRow);
  },

  getTestById: async (id: string): Promise<Test> => {
    const { data, error } = await supabase
      .from('tests')
      .select('*, test_parameters(sort_order, parameter_id, parameters(*))')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Failed to fetch test: ${error.message}`);

    const test = mapTestRow(data);
    // Flatten joined parameters
    test.parameters = (data.test_parameters ?? [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((tp: any) => mapParameterRow(tp.parameters));

    return test;
  },

  createTest: async (testData: Omit<Test, 'id' | 'createdAt'>): Promise<Test> => {
    const { data, error } = await supabase
      .from('tests')
      .insert({
        test_name: testData.testName,
        department: testData.department,
        test_cost: testData.testCost,
        result_header: testData.resultHeader ?? null,
        reference_range: testData.referenceRange ?? null,
        include_comprehensive: testData.includeComprehensive ?? false,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create test: ${error.message}`);
    return mapTestRow(data);
  },

  updateTest: async (
    id: string,
    testData: Partial<Omit<Test, 'id' | 'createdAt'>>
  ): Promise<Test> => {
    const updates: Record<string, any> = {};
    if (testData.testName !== undefined) updates.test_name = testData.testName;
    if (testData.department !== undefined) updates.department = testData.department;
    if (testData.testCost !== undefined) updates.test_cost = testData.testCost;
    if (testData.resultHeader !== undefined) updates.result_header = testData.resultHeader;
    if (testData.referenceRange !== undefined) updates.reference_range = testData.referenceRange;
    if (testData.includeComprehensive !== undefined) updates.include_comprehensive = testData.includeComprehensive;

    const { data, error } = await supabase
      .from('tests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update test: ${error.message}`);
    return mapTestRow(data);
  },

  deleteTest: async (id: string): Promise<void> => {
    const { error } = await supabase.from('tests').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete test: ${error.message}`);
  },

  // ── DEPARTMENTS ──────────────────────────────────────────────
  // Departments are stored as plain TEXT on the tests.department column.
  // These helpers derive the distinct department list from existing tests.

  getDepartments: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from('tests')
      .select('department')
      .order('department', { ascending: true });

    if (error) throw new Error(`Failed to fetch departments: ${error.message}`);
    // Return unique department names
    const unique = [...new Set((data ?? []).map((r: any) => r.department as string).filter(Boolean))];
    return unique;
  },

  // ── TEST ↔ PARAMETER LINKS ──────────────────────────────────

  linkParameter: async (testId: string, parameterId: string, sortOrder: number): Promise<void> => {
    const { error } = await supabase
      .from('test_parameters')
      .insert({ test_id: testId, parameter_id: parameterId, sort_order: sortOrder });

    if (error) throw new Error(`Failed to link parameter: ${error.message}`);
  },

  unlinkParameter: async (testId: string, parameterId: string): Promise<void> => {
    const { error } = await supabase
      .from('test_parameters')
      .delete()
      .eq('test_id', testId)
      .eq('parameter_id', parameterId);

    if (error) throw new Error(`Failed to unlink parameter: ${error.message}`);
  },

  // ── PARAMETERS ───────────────────────────────────────────────

  getParameters: async (): Promise<Parameter[]> => {
    const { data, error } = await supabase
      .from('parameters')
      .select('*')
      .order('parameter_name', { ascending: true });

    if (error) throw new Error(`Failed to fetch parameters: ${error.message}`);
    return (data ?? []).map(mapParameterRow);
  },

  createParameter: async (paramData: Omit<Parameter, 'id' | 'createdAt'>): Promise<Parameter> => {
    const { data, error } = await supabase
      .from('parameters')
      .insert({
        parameter_name: paramData.parameterName,
        units: paramData.units ?? null,
        reference_range: paramData.referenceRange ?? null,
        parameter_order_id: paramData.parameterOrderId ?? null,
        trimester_type: paramData.trimesterType ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create parameter: ${error.message}`);
    return mapParameterRow(data);
  },

  updateParameter: async (
    id: string,
    paramData: Partial<Omit<Parameter, 'id' | 'createdAt'>>
  ): Promise<Parameter> => {
    const updates: Record<string, any> = {};
    if (paramData.parameterName !== undefined) updates.parameter_name = paramData.parameterName;
    if (paramData.units !== undefined) updates.units = paramData.units;
    if (paramData.referenceRange !== undefined) updates.reference_range = paramData.referenceRange;
    if (paramData.parameterOrderId !== undefined) updates.parameter_order_id = paramData.parameterOrderId;
    if (paramData.trimesterType !== undefined) updates.trimester_type = paramData.trimesterType;

    const { data, error } = await supabase
      .from('parameters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update parameter: ${error.message}`);
    return mapParameterRow(data);
  },

  deleteParameter: async (id: string): Promise<void> => {
    const { error } = await supabase.from('parameters').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete parameter: ${error.message}`);
  },

  // ── ANTIBIOTICS ──────────────────────────────────────────────

  getAntibiotics: async (): Promise<Antibiotic[]> => {
    const { data, error } = await supabase
      .from('antibiotics')
      .select('*')
      .order('antibiotic_name', { ascending: true });

    if (error) throw new Error(`Failed to fetch antibiotics: ${error.message}`);
    return (data ?? []).map(mapAntibioticRow);
  },

  createAntibiotic: async (name: string): Promise<Antibiotic> => {
    const { data, error } = await supabase
      .from('antibiotics')
      .insert({ antibiotic_name: name })
      .select()
      .single();

    if (error) throw new Error(`Failed to create antibiotic: ${error.message}`);
    return mapAntibioticRow(data);
  },

  updateAntibiotic: async (id: string, name: string): Promise<Antibiotic> => {
    const { data, error } = await supabase
      .from('antibiotics')
      .update({ antibiotic_name: name })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update antibiotic: ${error.message}`);
    return mapAntibioticRow(data);
  },

  deleteAntibiotic: async (id: string): Promise<void> => {
    const { error } = await supabase.from('antibiotics').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete antibiotic: ${error.message}`);
  },
};

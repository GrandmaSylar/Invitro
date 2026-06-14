/**
 * Catalog Service — CRUD for test catalog, parameters, and antibiotics.
 * Refactored to route queries through the dbAdapter to support offline SQLite capability.
 */
import { dbAdapter } from './dbAdapter';
import type { Test, Parameter, Antibiotic, Department, TestFilters } from '../lib/types';

export const catalogService = {
  // ── TESTS ────────────────────────────────────────────────────

  getTests: async (filters?: TestFilters): Promise<Test[]> => {
    return dbAdapter.catalog.getTests(filters);
  },

  getTestById: async (id: string): Promise<Test> => {
    return dbAdapter.catalog.getTestById(id);
  },

  createTest: async (testData: Omit<Test, 'id' | 'createdAt'>): Promise<Test> => {
    return dbAdapter.catalog.createTest(testData);
  },

  updateTest: async (
    id: string,
    testData: Partial<Omit<Test, 'id' | 'createdAt'>>
  ): Promise<Test> => {
    return dbAdapter.catalog.updateTest(id, testData);
  },

  deleteTest: async (id: string): Promise<void> => {
    return dbAdapter.catalog.deleteTest(id);
  },

  // ── DEPARTMENTS ──────────────────────────────────────────────

  getDepartments: async (): Promise<Department[]> => {
    return dbAdapter.catalog.getDepartments();
  },

  createDepartment: async (name: string): Promise<Department> => {
    return dbAdapter.catalog.createDepartment(name);
  },

  updateDepartment: async (id: string, name: string): Promise<Department> => {
    return dbAdapter.catalog.updateDepartment(id, name);
  },

  deleteDepartment: async (id: string): Promise<void> => {
    return dbAdapter.catalog.deleteDepartment(id);
  },

  // ── TEST ↔ PARAMETER LINKS ──────────────────────────────────

  linkParameter: async (testId: string, parameterId: string, sortOrder: number): Promise<void> => {
    return dbAdapter.catalog.linkParameter(testId, parameterId, sortOrder);
  },

  unlinkParameter: async (testId: string, parameterId: string): Promise<void> => {
    return dbAdapter.catalog.unlinkParameter(testId, parameterId);
  },

  // ── TEST CODE ────────────────────────────────────────────────
  previewTestCode: async (): Promise<string> => {
    return dbAdapter.catalog.previewTestCode();
  },

  // ── PARAMETERS ───────────────────────────────────────────────
  previewParameterCode: async (): Promise<string> => {
    return dbAdapter.catalog.previewParameterCode();
  },

  getParameters: async (): Promise<Parameter[]> => {
    return dbAdapter.catalog.getParameters();
  },

  createParameter: async (paramData: Omit<Parameter, 'id' | 'createdAt'>): Promise<Parameter> => {
    return dbAdapter.catalog.createParameter(paramData);
  },

  updateParameter: async (
    id: string,
    paramData: Partial<Omit<Parameter, 'id' | 'createdAt'>>
  ): Promise<Parameter> => {
    return dbAdapter.catalog.updateParameter(id, paramData);
  },

  deleteParameter: async (id: string): Promise<void> => {
    return dbAdapter.catalog.deleteParameter(id);
  },

  // ── ANTIBIOTICS ──────────────────────────────────────────────

  getAntibiotics: async (): Promise<Antibiotic[]> => {
    return dbAdapter.catalog.getAntibiotics();
  },

  createAntibiotic: async (name: string): Promise<Antibiotic> => {
    return dbAdapter.catalog.createAntibiotic(name);
  },

  updateAntibiotic: async (id: string, name: string): Promise<Antibiotic> => {
    return dbAdapter.catalog.updateAntibiotic(id, name);
  },

  deleteAntibiotic: async (id: string): Promise<void> => {
    return dbAdapter.catalog.deleteAntibiotic(id);
  },
};

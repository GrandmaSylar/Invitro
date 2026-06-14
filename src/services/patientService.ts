/**
 * Patient Service — CRUD + search for the patients table.
 * Refactored to route queries through the dbAdapter to support offline SQLite capability.
 */
import { dbAdapter } from './dbAdapter';
import type { Patient, PatientFilters } from '../lib/types';

export const patientService = {
  getPatients: async (filters?: PatientFilters): Promise<Patient[]> => {
    return dbAdapter.patients.getPatients(filters);
  },

  getPatientById: async (id: string): Promise<Patient> => {
    return dbAdapter.patients.getPatientById(id);
  },

  createPatient: async (
    patientData: Omit<Patient, 'id' | 'createdAt'>
  ): Promise<Patient> => {
    return dbAdapter.patients.createPatient(patientData);
  },

  updatePatient: async (
    id: string,
    patientData: Partial<Omit<Patient, 'id' | 'createdAt'>>
  ): Promise<Patient> => {
    return dbAdapter.patients.updatePatient(id, patientData);
  },

  searchPatients: async (query: string): Promise<Patient[]> => {
    return dbAdapter.patients.searchPatients(query);
  },
};

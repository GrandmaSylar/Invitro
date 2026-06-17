/**
 * Registry Service — CRUD for hospitals and doctors (referral entities).
 * Refactored to route queries through the dbAdapter to support offline SQLite capability.
 */
import { dbAdapter } from './dbAdapter';
import type { Hospital, Doctor } from '../lib/types';

export const registryService = {
  // ── HOSPITALS ────────────────────────────────────────────────

  getHospitals: async (): Promise<Hospital[]> => {
    return dbAdapter.registry.getHospitals();
  },

  createHospital: async (
    hospitalData: Omit<Hospital, 'id' | 'createdAt'>
  ): Promise<Hospital> => {
    return dbAdapter.registry.createHospital(hospitalData);
  },

  updateHospital: async (
    id: string,
    hospitalData: Partial<Omit<Hospital, 'id' | 'createdAt'>>
  ): Promise<Hospital> => {
    return dbAdapter.registry.updateHospital(id, hospitalData);
  },

  deleteHospital: async (id: string): Promise<void> => {
    return dbAdapter.registry.deleteHospital(id);
  },

  // ── DOCTORS ──────────────────────────────────────────────────

  getDoctors: async (hospitalId?: string): Promise<Doctor[]> => {
    return dbAdapter.registry.getDoctors(hospitalId);
  },

  createDoctor: async (doctorData: Omit<Doctor, 'id' | 'createdAt'>): Promise<Doctor> => {
    return dbAdapter.registry.createDoctor(doctorData);
  },

  updateDoctor: async (
    id: string,
    doctorData: Partial<Omit<Doctor, 'id' | 'createdAt'>>
  ): Promise<Doctor> => {
    return dbAdapter.registry.updateDoctor(id, doctorData);
  },

  deleteDoctor: async (id: string): Promise<void> => {
    return dbAdapter.registry.deleteDoctor(id);
  },
};

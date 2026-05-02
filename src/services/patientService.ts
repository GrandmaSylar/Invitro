/**
 * Patient Service — CRUD + search for the patients table.
 */
import { supabase } from '../lib/supabase';
import { mapPatientRow } from '../lib/mappers';
import type { Patient, PatientFilters } from '../lib/types';

export const patientService = {
  getPatients: async (filters?: PatientFilters): Promise<Patient[]> => {
    let query = supabase
      .from('patients')
      .select('*')
      .order(filters?.sortBy ?? 'created_at', { ascending: filters?.sortDirection === 'asc' });

    if (filters?.search) {
      query = query.or(
        `patient_name.ilike.%${filters.search}%,telephone.ilike.%${filters.search}%`
      );
    }
    if (filters?.gender) {
      query = query.eq('gender', filters.gender);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch patients: ${error.message}`);
    return (data ?? []).map(mapPatientRow);
  },

  getPatientById: async (id: string): Promise<Patient> => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Failed to fetch patient: ${error.message}`);
    return mapPatientRow(data);
  },

  createPatient: async (
    patientData: Omit<Patient, 'id' | 'createdAt'>
  ): Promise<Patient> => {
    const { data, error } = await supabase
      .from('patients')
      .insert({
        patient_name: patientData.patientName,
        gender: patientData.gender ?? null,
        dob: patientData.dob ?? null,
        age: patientData.age ?? null,
        telephone: patientData.telephone ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create patient: ${error.message}`);
    return mapPatientRow(data);
  },

  updatePatient: async (
    id: string,
    patientData: Partial<Omit<Patient, 'id' | 'createdAt'>>
  ): Promise<Patient> => {
    const updates: Record<string, any> = {};
    if (patientData.patientName !== undefined) updates.patient_name = patientData.patientName;
    if (patientData.gender !== undefined) updates.gender = patientData.gender;
    if (patientData.dob !== undefined) updates.dob = patientData.dob;
    if (patientData.age !== undefined) updates.age = patientData.age;
    if (patientData.telephone !== undefined) updates.telephone = patientData.telephone;

    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update patient: ${error.message}`);
    return mapPatientRow(data);
  },

  searchPatients: async (query: string): Promise<Patient[]> => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .or(`patient_name.ilike.%${query}%,telephone.ilike.%${query}%,id.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(25);

    if (error) throw new Error(`Failed to search patients: ${error.message}`);
    return (data ?? []).map(mapPatientRow);
  },
};

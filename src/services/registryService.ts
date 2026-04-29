/**
 * Registry Service — CRUD for hospitals and doctors (referral entities).
 */
import { supabase } from '../lib/supabase';
import { mapHospitalRow, mapDoctorRow } from '../lib/mappers';
import type { Hospital, Doctor } from '../lib/types';

export const registryService = {
  // ── HOSPITALS ────────────────────────────────────────────────

  getHospitals: async (): Promise<Hospital[]> => {
    const { data, error } = await supabase
      .from('hospitals')
      .select('*')
      .order('hospital_name', { ascending: true });

    if (error) throw new Error(`Failed to fetch hospitals: ${error.message}`);
    return (data ?? []).map(mapHospitalRow);
  },

  createHospital: async (
    hospitalData: Omit<Hospital, 'id' | 'createdAt'>
  ): Promise<Hospital> => {
    const { data, error } = await supabase
      .from('hospitals')
      .insert({
        hospital_name: hospitalData.hospitalName,
        location: hospitalData.location ?? null,
        phone_number: hospitalData.phoneNumber ?? null,
        address: hospitalData.address ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create hospital: ${error.message}`);
    return mapHospitalRow(data);
  },

  updateHospital: async (
    id: string,
    hospitalData: Partial<Omit<Hospital, 'id' | 'createdAt'>>
  ): Promise<Hospital> => {
    const updates: Record<string, any> = {};
    if (hospitalData.hospitalName !== undefined) updates.hospital_name = hospitalData.hospitalName;
    if (hospitalData.location !== undefined) updates.location = hospitalData.location;
    if (hospitalData.phoneNumber !== undefined) updates.phone_number = hospitalData.phoneNumber;
    if (hospitalData.address !== undefined) updates.address = hospitalData.address;

    const { data, error } = await supabase
      .from('hospitals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update hospital: ${error.message}`);
    return mapHospitalRow(data);
  },

  deleteHospital: async (id: string): Promise<void> => {
    const { error } = await supabase.from('hospitals').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete hospital: ${error.message}`);
  },

  // ── DOCTORS ──────────────────────────────────────────────────

  getDoctors: async (hospitalId?: string): Promise<Doctor[]> => {
    let query = supabase
      .from('doctors')
      .select('*')
      .order('doctor_name', { ascending: true });

    if (hospitalId) {
      query = query.eq('affiliate_hospital_id', hospitalId);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch doctors: ${error.message}`);
    return (data ?? []).map(mapDoctorRow);
  },

  createDoctor: async (doctorData: Omit<Doctor, 'id' | 'createdAt'>): Promise<Doctor> => {
    const { data, error } = await supabase
      .from('doctors')
      .insert({
        doctor_name: doctorData.doctorName,
        speciality: doctorData.speciality ?? null,
        phone_number: doctorData.phoneNumber ?? null,
        email: doctorData.email ?? null,
        affiliate_hospital_id: doctorData.affiliateHospitalId ?? null,
        location: doctorData.location ?? null,
        address: doctorData.address ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create doctor: ${error.message}`);
    return mapDoctorRow(data);
  },

  updateDoctor: async (
    id: string,
    doctorData: Partial<Omit<Doctor, 'id' | 'createdAt'>>
  ): Promise<Doctor> => {
    const updates: Record<string, any> = {};
    if (doctorData.doctorName !== undefined) updates.doctor_name = doctorData.doctorName;
    if (doctorData.speciality !== undefined) updates.speciality = doctorData.speciality;
    if (doctorData.phoneNumber !== undefined) updates.phone_number = doctorData.phoneNumber;
    if (doctorData.email !== undefined) updates.email = doctorData.email;
    if (doctorData.affiliateHospitalId !== undefined) updates.affiliate_hospital_id = doctorData.affiliateHospitalId;
    if (doctorData.location !== undefined) updates.location = doctorData.location;
    if (doctorData.address !== undefined) updates.address = doctorData.address;

    const { data, error } = await supabase
      .from('doctors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update doctor: ${error.message}`);
    return mapDoctorRow(data);
  },

  deleteDoctor: async (id: string): Promise<void> => {
    const { error } = await supabase.from('doctors').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete doctor: ${error.message}`);
  },
};

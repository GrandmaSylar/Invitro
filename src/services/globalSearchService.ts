import { supabase } from '../lib/supabase';

export interface GlobalSearchResult {
  id: string;
  type: 'patient' | 'doctor' | 'hospital' | 'test';
  title: string;
  subtitle?: string;
  url: string;
}

export const globalSearchService = {
  searchAll: async (query: string): Promise<GlobalSearchResult[]> => {
    if (!query || query.trim().length < 2) return [];

    const searchQuery = `%${query.trim()}%`;
    const results: GlobalSearchResult[] = [];

    // Run parallel queries against the 4 tables
    const [
      patientsRes,
      hospitalsRes,
      doctorsRes,
      testsRes
    ] = await Promise.all([
      supabase
        .from('patients')
        .select('id, patient_name, telephone')
        .or(`patient_name.ilike.${searchQuery},telephone.ilike.${searchQuery},id.ilike.${searchQuery}`)
        .limit(5),
      
      supabase
        .from('hospitals')
        .select('id, hospital_name, phone_number')
        .or(`hospital_name.ilike.${searchQuery},phone_number.ilike.${searchQuery}`)
        .limit(5),

      supabase
        .from('doctors')
        .select('id, doctor_name, speciality, phone_number')
        .or(`doctor_name.ilike.${searchQuery},speciality.ilike.${searchQuery},phone_number.ilike.${searchQuery}`)
        .limit(5),

      supabase
        .from('tests')
        .select('id, test_name, department')
        .or(`test_name.ilike.${searchQuery},department.ilike.${searchQuery}`)
        .eq('is_active', true)
        .limit(5)
    ]);

    // Map Patients
    if (patientsRes.data) {
      patientsRes.data.forEach(p => {
        results.push({
          id: p.id,
          type: 'patient',
          title: p.patient_name,
          subtitle: p.telephone || 'No phone',
          url: `/patients?search=${encodeURIComponent(p.patient_name)}`
        });
      });
    }

    // Map Hospitals
    if (hospitalsRes.data) {
      hospitalsRes.data.forEach(h => {
        results.push({
          id: h.id,
          type: 'hospital',
          title: h.hospital_name,
          subtitle: h.phone_number || 'Hospital',
          url: '/hospital-records' 
        });
      });
    }

    // Map Doctors
    if (doctorsRes.data) {
      doctorsRes.data.forEach(d => {
        results.push({
          id: d.id,
          type: 'doctor',
          title: d.doctor_name,
          subtitle: d.speciality || 'Doctor',
          url: '/hospital-records' 
        });
      });
    }

    // Map Tests
    if (testsRes.data) {
      testsRes.data.forEach(t => {
        results.push({
          id: t.id,
          type: 'test',
          title: t.test_name,
          subtitle: t.department || 'Lab Test',
          url: `/test-register?search=${encodeURIComponent(t.test_name)}`
        });
      });
    }

    return results;
  }
};

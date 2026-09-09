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

    const results: GlobalSearchResult[] = [];

    if (window.electronAPI && (window.electronAPI as any).db) {
      const q = query.trim();
      const lowerQ = q.toLowerCase();
      const db = (window.electronAPI as any).db;

      const [patients, hospitals, doctors, tests] = await Promise.all([
        db.patients ? db.patients.searchPatients(q) : db.searchPatients(q),
        db.registry ? db.registry.getHospitals() : db.getHospitals(),
        db.registry ? db.registry.getDoctors() : db.getDoctors(),
        db.catalog ? db.catalog.getTests() : db.getTests(),
      ]);

      (patients || []).slice(0, 5).forEach((p: any) => {
        const name = p.patientName || p.patient_name || 'Patient';
        results.push({
          id: p.id,
          type: 'patient',
          title: name,
          subtitle: p.telephone || 'No phone',
          url: `/patients?search=${encodeURIComponent(name)}`
        });
      });

      (hospitals || [])
        .filter((h: any) => (h.hospitalName || h.hospital_name || '').toLowerCase().includes(lowerQ))
        .slice(0, 5)
        .forEach((h: any) => {
          results.push({
            id: h.id,
            type: 'hospital',
            title: h.hospitalName || h.hospital_name,
            subtitle: h.phoneNumber || h.phone_number || 'Hospital',
            url: '/hospital-records'
          });
        });

      (doctors || [])
        .filter((d: any) => 
          (d.doctorName || d.doctor_name || '').toLowerCase().includes(lowerQ) ||
          (d.speciality || '').toLowerCase().includes(lowerQ)
        )
        .slice(0, 5)
        .forEach((d: any) => {
          results.push({
            id: d.id,
            type: 'doctor',
            title: d.doctorName || d.doctor_name,
            subtitle: d.speciality || 'Doctor',
            url: '/hospital-records'
          });
        });

      (tests || [])
        .filter((t: any) => (t.testName || t.test_name || '').toLowerCase().includes(lowerQ))
        .slice(0, 5)
        .forEach((t: any) => {
          const name = t.testName || t.test_name || 'Test';
          results.push({
            id: t.id,
            type: 'test',
            title: name,
            subtitle: t.department || 'Lab Test',
            url: `/test-register?search=${encodeURIComponent(name)}`
          });
        });

      return results;
    }

    const searchQuery = `%${query.trim()}%`;
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

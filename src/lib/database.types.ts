/**
 * Supabase Database type definitions for the Bloo LIMS schema.
 * Regenerate: npx supabase gen types typescript --project-id <ID> > src/lib/database.types.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      roles: {
        Row: { id: string; name: string; label: string; description: string | null; is_system: boolean; permissions: Json; created_at: string };
        Insert: { id: string; name: string; label: string; description?: string | null; is_system?: boolean; permissions?: Json; created_at?: string };
        Update: { id?: string; name?: string; label?: string; description?: string | null; is_system?: boolean; permissions?: Json; created_at?: string };
      };
      users: {
        Row: { id: string; full_name: string; email: string; username: string; password_hash: string; phone: string | null; role_id: string; permission_overrides: Json; two_factor_enabled: boolean; two_factor_method: string | null; status: string; last_login: string | null; created_at: string };
        Insert: { id: string; full_name: string; email: string; username: string; password_hash: string; phone?: string | null; role_id: string; permission_overrides?: Json; two_factor_enabled?: boolean; two_factor_method?: string | null; status?: string; last_login?: string | null; created_at?: string };
        Update: { id?: string; full_name?: string; email?: string; username?: string; password_hash?: string; phone?: string | null; role_id?: string; permission_overrides?: Json; two_factor_enabled?: boolean; two_factor_method?: string | null; status?: string; last_login?: string | null; created_at?: string };
      };
      audit_events: {
        Row: { id: string; timestamp: string; actor_id: string; actor_name: string; action: string; target_type: string; target_id: string; target_name: string; detail: string };
        Insert: { id?: string; timestamp?: string; actor_id: string; actor_name: string; action: string; target_type: string; target_id: string; target_name: string; detail?: string };
        Update: { id?: string; timestamp?: string; actor_id?: string; actor_name?: string; action?: string; target_type?: string; target_id?: string; target_name?: string; detail?: string };
      };
      app_settings: {
        Row: { id: number; general: Json; notifications: Json; security: Json; smtp: Json; updated_at: string };
        Insert: { id?: number; general?: Json; notifications?: Json; security?: Json; smtp?: Json; updated_at?: string };
        Update: { id?: number; general?: Json; notifications?: Json; security?: Json; smtp?: Json; updated_at?: string };
      };
      api_keys: {
        Row: { id: string; name: string; key: string; created_at: string; last_used: string | null; permissions: Json };
        Insert: { id?: string; name: string; key: string; created_at?: string; last_used?: string | null; permissions?: Json };
        Update: { id?: string; name?: string; key?: string; created_at?: string; last_used?: string | null; permissions?: Json };
      };
      hospitals: {
        Row: { id: string; hospital_name: string; location: string | null; phone_number: string | null; address: string | null; created_at: string };
        Insert: { id?: string; hospital_name: string; location?: string | null; phone_number?: string | null; address?: string | null; created_at?: string };
        Update: { id?: string; hospital_name?: string; location?: string | null; phone_number?: string | null; address?: string | null; created_at?: string };
      };
      doctors: {
        Row: { id: string; doctor_name: string; speciality: string | null; phone_number: string | null; email: string | null; affiliate_hospital_id: string | null; location: string | null; address: string | null; created_at: string };
        Insert: { id?: string; doctor_name: string; speciality?: string | null; phone_number?: string | null; email?: string | null; affiliate_hospital_id?: string | null; location?: string | null; address?: string | null; created_at?: string };
        Update: { id?: string; doctor_name?: string; speciality?: string | null; phone_number?: string | null; email?: string | null; affiliate_hospital_id?: string | null; location?: string | null; address?: string | null; created_at?: string };
      };
      parameters: {
        Row: { id: string; parameter_name: string; units: string | null; reference_range: string | null; parameter_order_id: number | null; trimester_type: string | null; created_at: string };
        Insert: { id?: string; parameter_name: string; units?: string | null; reference_range?: string | null; parameter_order_id?: number | null; trimester_type?: string | null; created_at?: string };
        Update: { id?: string; parameter_name?: string; units?: string | null; reference_range?: string | null; parameter_order_id?: number | null; trimester_type?: string | null; created_at?: string };
      };
      tests: {
        Row: { id: string; test_name: string; department: string; test_cost: number; result_header: string | null; reference_range: string | null; include_comprehensive: boolean; created_at: string };
        Insert: { id?: string; test_name: string; department: string; test_cost?: number; result_header?: string | null; reference_range?: string | null; include_comprehensive?: boolean; created_at?: string };
        Update: { id?: string; test_name?: string; department?: string; test_cost?: number; result_header?: string | null; reference_range?: string | null; include_comprehensive?: boolean; created_at?: string };
      };
      test_parameters: {
        Row: { test_id: string; parameter_id: string; sort_order: number };
        Insert: { test_id: string; parameter_id: string; sort_order?: number };
        Update: { test_id?: string; parameter_id?: string; sort_order?: number };
      };
      antibiotics: {
        Row: { id: string; antibiotic_name: string; created_at: string };
        Insert: { id?: string; antibiotic_name: string; created_at?: string };
        Update: { id?: string; antibiotic_name?: string; created_at?: string };
      };
      patients: {
        Row: { id: string; patient_name: string; gender: string | null; dob: string | null; age: number | null; telephone: string | null; created_at: string };
        Insert: { id?: string; patient_name: string; gender?: string | null; dob?: string | null; age?: number | null; telephone?: string | null; created_at?: string };
        Update: { id?: string; patient_name?: string; gender?: string | null; dob?: string | null; age?: number | null; telephone?: string | null; created_at?: string };
      };
      lab_records: {
        Row: { id: string; lab_number: string; patient_id: string; record_date: string; status: string; referral_option: string | null; referral_doctor_id: string | null; referral_hospital_id: string | null; subtotal: number; total_cost: number; amount_paid: number; arrears: number; created_by_id: string | null; created_at: string };
        Insert: { id?: string; lab_number: string; patient_id: string; record_date?: string; status?: string; referral_option?: string | null; referral_doctor_id?: string | null; referral_hospital_id?: string | null; subtotal?: number; total_cost?: number; amount_paid?: number; arrears?: number; created_by_id?: string | null; created_at?: string };
        Update: { id?: string; lab_number?: string; patient_id?: string; record_date?: string; status?: string; referral_option?: string | null; referral_doctor_id?: string | null; referral_hospital_id?: string | null; subtotal?: number; total_cost?: number; amount_paid?: number; arrears?: number; created_by_id?: string | null; created_at?: string };
      };
      lab_record_tests: {
        Row: { id: string; lab_record_id: string; test_id: string; test_name: string; department: string; test_cost: number; total_cost: number; amount_paid: number; arrears: number };
        Insert: { id?: string; lab_record_id: string; test_id: string; test_name: string; department: string; test_cost?: number; total_cost?: number; amount_paid?: number; arrears?: number };
        Update: { id?: string; lab_record_id?: string; test_id?: string; test_name?: string; department?: string; test_cost?: number; total_cost?: number; amount_paid?: number; arrears?: number };
      };
      test_results: {
        Row: { id: string; lab_record_test_id: string; test_name: string; department: string; reference_range: string | null; unit: string | null; result: string | null; flag: string; entered_by_id: string | null; entered_at: string };
        Insert: { id?: string; lab_record_test_id: string; test_name: string; department: string; reference_range?: string | null; unit?: string | null; result?: string | null; flag?: string; entered_by_id?: string | null; entered_at?: string };
        Update: { id?: string; lab_record_test_id?: string; test_name?: string; department?: string; reference_range?: string | null; unit?: string | null; result?: string | null; flag?: string; entered_by_id?: string | null; entered_at?: string };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

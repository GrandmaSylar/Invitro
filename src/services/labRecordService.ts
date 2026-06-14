/**
 * Lab Record Service — Lab record lifecycle, attached tests, and payments.
 * Refactored to route queries through the dbAdapter to support offline SQLite capability.
 */
import { dbAdapter } from './dbAdapter';
import type { LabRecord, LabRecordTest, LabRecordFilters, Payment } from '../lib/types';

export const generateLabNumber = async (): Promise<string> => {
  return dbAdapter.labRecords.generateLabNumber();
};

export const previewLabNumber = async (): Promise<string> => {
  return dbAdapter.labRecords.previewLabNumber();
};

export const labRecordService = {
  getLabRecords: async (filters?: LabRecordFilters): Promise<LabRecord[]> => {
    return dbAdapter.labRecords.getLabRecords(filters);
  },

  getLabRecordById: async (id: string): Promise<LabRecord> => {
    return dbAdapter.labRecords.getLabRecordById(id);
  },

  getLabRecordByLabNumber: async (labNumber: string): Promise<LabRecord> => {
    return dbAdapter.labRecords.getLabRecordByLabNumber(labNumber);
  },

  checkLabNumberExists: async (labNumber: string): Promise<boolean> => {
    return dbAdapter.labRecords.checkLabNumberExists(labNumber);
  },

  createLabRecord: async (recordData: {
    patientId: string;
    labNumber?: string;
    referralOption?: string;
    referralDoctorId?: string;
    referralHospitalId?: string;
    createdById?: string;
  }): Promise<LabRecord> => {
    return dbAdapter.labRecords.createLabRecord(recordData);
  },

  updateLabRecord: async (
    id: string,
    updates: Partial<{
      status: string;
      referralOption: string;
      referralDoctorId: string;
      referralHospitalId: string;
    }>
  ): Promise<LabRecord> => {
    return dbAdapter.labRecords.updateLabRecord(id, updates);
  },

  getTestsForRecord: async (labRecordId: string): Promise<LabRecordTest[]> => {
    return dbAdapter.labRecords.getTestsForRecord(labRecordId);
  },

  addTestToRecord: async (
    labRecordId: string,
    test: { testId: string; testName: string; department: string; testCost: number }
  ): Promise<LabRecordTest> => {
    return dbAdapter.labRecords.addTestToRecord(labRecordId, test);
  },

  removeTestFromRecord: async (labRecordTestId: string, labRecordId: string): Promise<void> => {
    return dbAdapter.labRecords.removeTestFromRecord(labRecordTestId, labRecordId);
  },

  getPayments: async (labRecordId: string): Promise<Payment[]> => {
    return dbAdapter.labRecords.getPayments(labRecordId);
  },

  recordPayment: async (labRecordId: string, amount: number, receivedById?: string): Promise<Payment> => {
    return dbAdapter.labRecords.recordPayment(labRecordId, amount, receivedById);
  },

  recalculateStatusAndTotals: async (labRecordId: string): Promise<void> => {
    return dbAdapter.labRecords.recalculateStatusAndTotals(labRecordId);
  },
};

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-available', (_event, info) => callback(info));
    return () => ipcRenderer.removeAllListeners('update-available');
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update-downloaded', callback);
    return () => ipcRenderer.removeAllListeners('update-downloaded');
  },
  onUpdateNotAvailable: (callback: () => void) => {
    ipcRenderer.on('update-not-available', callback);
    return () => ipcRenderer.removeAllListeners('update-not-available');
  },
  onUpdateError: (callback: (error: string) => void) => {
    ipcRenderer.on('update-error', (_event, error) => callback(error));
    return () => ipcRenderer.removeAllListeners('update-error');
  },
  onDownloadProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('download-progress', (_event, progress) => callback(progress));
    return () => ipcRenderer.removeAllListeners('download-progress');
  },
  installUpdate: () => ipcRenderer.invoke('install-update'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  onMaximizeChange: (callback: (event: any, maximized: boolean) => void) => {
    ipcRenderer.on('maximize-change', callback);
  },
  offMaximizeChange: (callback: (event: any, maximized: boolean) => void) => {
    ipcRenderer.removeListener('maximize-change', callback);
  },
  exportPDF: (options: { title: string; paperSize: string }) => ipcRenderer.invoke('export-pdf', options),
  previewPDF: (options: { title: string; paperSize: string }) => ipcRenderer.invoke('preview-pdf', options),
  cacheUserCredentials: (userRow: any, roleRow: any) => ipcRenderer.invoke('cache-user-credentials', { userRow, roleRow }),
  offlineLogin: (options: { login: string; password: string }) => ipcRenderer.invoke('offline-login', options),
  updateSupabaseSession: (session: { access_token: string; refresh_token: string }) => ipcRenderer.invoke('update-supabase-session', session),

  db: {
    // Flat methods for dbAdapter compatibility
    getPatients: (filters: any) => ipcRenderer.invoke('db:call', 'patients', 'getPatients', filters),
    getPatientById: (id: string) => ipcRenderer.invoke('db:call', 'patients', 'getPatientById', id),
    createPatient: (patientData: any) => ipcRenderer.invoke('db:call', 'patients', 'createPatient', patientData),
    updatePatient: (id: string, patientData: any) => ipcRenderer.invoke('db:call', 'patients', 'updatePatient', id, patientData),
    searchPatients: (query: string) => ipcRenderer.invoke('db:call', 'patients', 'searchPatients', query),

    getLabRecords: (filters: any) => ipcRenderer.invoke('db:call', 'labRecords', 'getLabRecords', filters),
    getLabRecordById: (id: string) => ipcRenderer.invoke('db:call', 'labRecords', 'getLabRecordById', id),
    getLabRecordByLabNumber: (labNumber: string) => ipcRenderer.invoke('db:call', 'labRecords', 'getLabRecordByLabNumber', labNumber),
    checkLabNumberExists: (labNumber: string) => ipcRenderer.invoke('db:call', 'labRecords', 'checkLabNumberExists', labNumber),
    createLabRecord: (recordData: any) => ipcRenderer.invoke('db:call', 'labRecords', 'createLabRecord', recordData),
    updateLabRecord: (id: string, updates: any) => ipcRenderer.invoke('db:call', 'labRecords', 'updateLabRecord', id, updates),
    getTestsForRecord: (labRecordId: string) => ipcRenderer.invoke('db:call', 'labRecords', 'getTestsForRecord', labRecordId),
    addTestToRecord: (labRecordId: string, test: any) => ipcRenderer.invoke('db:call', 'labRecords', 'addTestToRecord', labRecordId, test),
    removeTestFromRecord: (labRecordTestId: string, labRecordId: string) => ipcRenderer.invoke('db:call', 'labRecords', 'removeTestFromRecord', labRecordTestId, labRecordId),
    getPayments: (labRecordId: string) => ipcRenderer.invoke('db:call', 'labRecords', 'getPayments', labRecordId),
    recordPayment: (labRecordId: string, amount: number, receivedById?: string) => ipcRenderer.invoke('db:call', 'labRecords', 'recordPayment', labRecordId, amount, receivedById),
    recalculateStatusAndTotals: (labRecordId: string) => ipcRenderer.invoke('db:call', 'labRecords', 'recalculateStatusAndTotals', labRecordId),
    generateLabNumber: () => ipcRenderer.invoke('db:call', 'labRecords', 'generateLabNumber'),
    previewLabNumber: () => ipcRenderer.invoke('db:call', 'labRecords', 'previewLabNumber'),

    getResultsByLabRecordTest: (labRecordTestId: string) => ipcRenderer.invoke('db:call', 'results', 'getResultsByLabRecordTest', labRecordTestId),
    getResultsByLabRecord: (labRecordId: string) => ipcRenderer.invoke('db:call', 'results', 'getResultsByLabRecord', labRecordId),
    enterResult: (resultData: any) => ipcRenderer.invoke('db:call', 'results', 'enterResult', resultData),
    updateResult: (id: string, updates: any) => ipcRenderer.invoke('db:call', 'results', 'updateResult', id, updates),
    bulkEnterResults: (results: any[]) => ipcRenderer.invoke('db:call', 'results', 'bulkEnterResults', results),
    deleteResult: (id: string) => ipcRenderer.invoke('db:call', 'results', 'deleteResult', id),

    logEvent: (event: any) => ipcRenderer.invoke('db:call', 'audit', 'logEvent', event),
    getEvents: (filters: any) => ipcRenderer.invoke('db:call', 'audit', 'getEvents', filters),

    getSettings: () => ipcRenderer.invoke('db:call', 'settings', 'getSettings'),
    updateSettings: (section: string, sectionData: any) => ipcRenderer.invoke('db:call', 'settings', 'updateSettings', section, sectionData),
    patchSettings: (section: string, partialData: any) => ipcRenderer.invoke('db:call', 'settings', 'patchSettings', section, partialData),
    getApiKeys: () => ipcRenderer.invoke('db:call', 'settings', 'getApiKeys'),
    createApiKey: (keyData: any) => ipcRenderer.invoke('db:call', 'settings', 'createApiKey', keyData),
    revokeApiKey: (id: string) => ipcRenderer.invoke('db:call', 'settings', 'revokeApiKey', id),
    getSyncStatus: () => ipcRenderer.invoke('db:call', 'settings', 'getSyncStatus'),

    getTests: (filters: any) => ipcRenderer.invoke('db:call', 'catalog', 'getTests', filters),
    getTestById: (id: string) => ipcRenderer.invoke('db:call', 'catalog', 'getTestById', id),
    createTest: (testData: any) => ipcRenderer.invoke('db:call', 'catalog', 'createTest', testData),
    updateTest: (id: string, testData: any) => ipcRenderer.invoke('db:call', 'catalog', 'updateTest', id, testData),
    deleteTest: (id: string) => ipcRenderer.invoke('db:call', 'catalog', 'deleteTest', id),
    getDepartments: () => ipcRenderer.invoke('db:call', 'catalog', 'getDepartments'),
    createDepartment: (name: string) => ipcRenderer.invoke('db:call', 'catalog', 'createDepartment', name),
    updateDepartment: (id: string, name: string) => ipcRenderer.invoke('db:call', 'catalog', 'updateDepartment', id, name),
    deleteDepartment: (id: string) => ipcRenderer.invoke('db:call', 'catalog', 'deleteDepartment', id),
    linkParameter: (testId: string, parameterId: string, sortOrder: number) => ipcRenderer.invoke('db:call', 'catalog', 'linkParameter', testId, parameterId, sortOrder),
    unlinkParameter: (testId: string, parameterId: string) => ipcRenderer.invoke('db:call', 'catalog', 'unlinkParameter', testId, parameterId),
    previewTestCode: () => ipcRenderer.invoke('db:call', 'catalog', 'previewTestCode'),
    previewParameterCode: () => ipcRenderer.invoke('db:call', 'catalog', 'previewParameterCode'),
    getParameters: () => ipcRenderer.invoke('db:call', 'catalog', 'getParameters'),
    createParameter: (paramData: any) => ipcRenderer.invoke('db:call', 'catalog', 'createParameter', paramData),
    updateParameter: (id: string, paramData: any) => ipcRenderer.invoke('db:call', 'catalog', 'updateParameter', id, paramData),
    deleteParameter: (id: string) => ipcRenderer.invoke('db:call', 'catalog', 'deleteParameter', id),
    getAntibiotics: () => ipcRenderer.invoke('db:call', 'catalog', 'getAntibiotics'),
    createAntibiotic: (name: string) => ipcRenderer.invoke('db:call', 'catalog', 'createAntibiotic', name),
    updateAntibiotic: (id: string, name: string) => ipcRenderer.invoke('db:call', 'catalog', 'updateAntibiotic', id, name),
    deleteAntibiotic: (id: string) => ipcRenderer.invoke('db:call', 'catalog', 'deleteAntibiotic', id),

    // Nested categories for complete backward compatibility
    patients: {
      getPatients: (filters: any) => ipcRenderer.invoke('db:call', 'patients', 'getPatients', filters),
      getPatientById: (id: string) => ipcRenderer.invoke('db:call', 'patients', 'getPatientById', id),
      createPatient: (patientData: any) => ipcRenderer.invoke('db:call', 'patients', 'createPatient', patientData),
      updatePatient: (id: string, patientData: any) => ipcRenderer.invoke('db:call', 'patients', 'updatePatient', id, patientData),
      searchPatients: (query: string) => ipcRenderer.invoke('db:call', 'patients', 'searchPatients', query),
    },
    labRecords: {
      getLabRecords: (filters: any) => ipcRenderer.invoke('db:call', 'labRecords', 'getLabRecords', filters),
      getLabRecordById: (id: string) => ipcRenderer.invoke('db:call', 'labRecords', 'getLabRecordById', id),
      getLabRecordByLabNumber: (labNumber: string) => ipcRenderer.invoke('db:call', 'labRecords', 'getLabRecordByLabNumber', labNumber),
      checkLabNumberExists: (labNumber: string) => ipcRenderer.invoke('db:call', 'labRecords', 'checkLabNumberExists', labNumber),
      createLabRecord: (recordData: any) => ipcRenderer.invoke('db:call', 'labRecords', 'createLabRecord', recordData),
      updateLabRecord: (id: string, updates: any) => ipcRenderer.invoke('db:call', 'labRecords', 'updateLabRecord', id, updates),
      getTestsForRecord: (labRecordId: string) => ipcRenderer.invoke('db:call', 'labRecords', 'getTestsForRecord', labRecordId),
      addTestToRecord: (labRecordId: string, test: any) => ipcRenderer.invoke('db:call', 'labRecords', 'addTestToRecord', labRecordId, test),
      removeTestFromRecord: (labRecordTestId: string, labRecordId: string) => ipcRenderer.invoke('db:call', 'labRecords', 'removeTestFromRecord', labRecordTestId, labRecordId),
      getPayments: (labRecordId: string) => ipcRenderer.invoke('db:call', 'labRecords', 'getPayments', labRecordId),
      recordPayment: (labRecordId: string, amount: number, receivedById?: string) => ipcRenderer.invoke('db:call', 'labRecords', 'recordPayment', labRecordId, amount, receivedById),
      recalculateStatusAndTotals: (labRecordId: string) => ipcRenderer.invoke('db:call', 'labRecords', 'recalculateStatusAndTotals', labRecordId),
      generateLabNumber: () => ipcRenderer.invoke('db:call', 'labRecords', 'generateLabNumber'),
      previewLabNumber: () => ipcRenderer.invoke('db:call', 'labRecords', 'previewLabNumber'),
    },
    results: {
      getResultsByLabRecordTest: (labRecordTestId: string) => ipcRenderer.invoke('db:call', 'results', 'getResultsByLabRecordTest', labRecordTestId),
      getResultsByLabRecord: (labRecordId: string) => ipcRenderer.invoke('db:call', 'results', 'getResultsByLabRecord', labRecordId),
      enterResult: (resultData: any) => ipcRenderer.invoke('db:call', 'results', 'enterResult', resultData),
      updateResult: (id: string, updates: any) => ipcRenderer.invoke('db:call', 'results', 'updateResult', id, updates),
      bulkEnterResults: (results: any[]) => ipcRenderer.invoke('db:call', 'results', 'bulkEnterResults', results),
      deleteResult: (id: string) => ipcRenderer.invoke('db:call', 'results', 'deleteResult', id),
    },
    audit: {
      logEvent: (event: any) => ipcRenderer.invoke('db:call', 'audit', 'logEvent', event),
      getEvents: (filters: any) => ipcRenderer.invoke('db:call', 'audit', 'getEvents', filters),
    },
    settings: {
      getSettings: () => ipcRenderer.invoke('db:call', 'settings', 'getSettings'),
      updateSettings: (section: string, sectionData: any) => ipcRenderer.invoke('db:call', 'settings', 'updateSettings', section, sectionData),
      patchSettings: (section: string, partialData: any) => ipcRenderer.invoke('db:call', 'settings', 'patchSettings', section, partialData),
      getApiKeys: () => ipcRenderer.invoke('db:call', 'settings', 'getApiKeys'),
      createApiKey: (keyData: any) => ipcRenderer.invoke('db:call', 'settings', 'createApiKey', keyData),
      revokeApiKey: (id: string) => ipcRenderer.invoke('db:call', 'settings', 'revokeApiKey', id),
      getSyncStatus: () => ipcRenderer.invoke('db:call', 'settings', 'getSyncStatus'),
    },
    catalog: {
      getTests: (filters: any) => ipcRenderer.invoke('db:call', 'catalog', 'getTests', filters),
      getTestById: (id: string) => ipcRenderer.invoke('db:call', 'catalog', 'getTestById', id),
      createTest: (testData: any) => ipcRenderer.invoke('db:call', 'catalog', 'createTest', testData),
      updateTest: (id: string, testData: any) => ipcRenderer.invoke('db:call', 'catalog', 'updateTest', id, testData),
      deleteTest: (id: string) => ipcRenderer.invoke('db:call', 'catalog', 'deleteTest', id),
      getDepartments: () => ipcRenderer.invoke('db:call', 'catalog', 'getDepartments'),
      createDepartment: (name: string) => ipcRenderer.invoke('db:call', 'catalog', 'createDepartment', name),
      updateDepartment: (id: string, name: string) => ipcRenderer.invoke('db:call', 'catalog', 'updateDepartment', id, name),
      deleteDepartment: (id: string) => ipcRenderer.invoke('db:call', 'catalog', 'deleteDepartment', id),
      linkParameter: (testId: string, parameterId: string, sortOrder: number) => ipcRenderer.invoke('db:call', 'catalog', 'linkParameter', testId, parameterId, sortOrder),
      unlinkParameter: (testId: string, parameterId: string) => ipcRenderer.invoke('db:call', 'catalog', 'unlinkParameter', testId, parameterId),
      previewTestCode: () => ipcRenderer.invoke('db:call', 'catalog', 'previewTestCode'),
      previewParameterCode: () => ipcRenderer.invoke('db:call', 'catalog', 'previewParameterCode'),
      getParameters: () => ipcRenderer.invoke('db:call', 'catalog', 'getParameters'),
      createParameter: (paramData: any) => ipcRenderer.invoke('db:call', 'catalog', 'createParameter', paramData),
      updateParameter: (id: string, paramData: any) => ipcRenderer.invoke('db:call', 'catalog', 'updateParameter', id, paramData),
      deleteParameter: (id: string) => ipcRenderer.invoke('db:call', 'catalog', 'deleteParameter', id),
      getAntibiotics: () => ipcRenderer.invoke('db:call', 'catalog', 'getAntibiotics'),
      createAntibiotic: (name: string) => ipcRenderer.invoke('db:call', 'catalog', 'createAntibiotic', name),
      updateAntibiotic: (id: string, name: string) => ipcRenderer.invoke('db:call', 'catalog', 'updateAntibiotic', id, name),
      deleteAntibiotic: (id: string) => ipcRenderer.invoke('db:call', 'catalog', 'deleteAntibiotic', id),
    }
  }
});

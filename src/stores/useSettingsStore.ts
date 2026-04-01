import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings, DatabaseConfig } from '../lib/types';
import { DEFAULT_APP_SETTINGS, SEED_DB_CONFIGS } from '../lib/mockData';

interface SettingsStore {
  settings: AppSettings;
  dbConfigs: DatabaseConfig[];
  updateSection: <K extends keyof AppSettings>(section: K, data: AppSettings[K]) => void;
  patchSection: <K extends keyof AppSettings>(section: K, data: Partial<AppSettings[K]>) => void;
  addDbConfig: (config: Omit<DatabaseConfig, 'id'>) => void;
  setActiveDbConfig: (id: string) => void;
  deleteDbConfig: (id: string) => void;
  updateDbConfig: (id: string, data: Partial<DatabaseConfig>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_APP_SETTINGS,
      dbConfigs: SEED_DB_CONFIGS,
      
      updateSection: (section, data) => set((state) => ({
        settings: {
          ...state.settings,
          [section]: data,
        }
      })),

      patchSection: (section, data) => set((state) => ({
        settings: {
          ...state.settings,
          [section]: {
            ...state.settings[section],
            ...data,
          }
        }
      })),
      
      addDbConfig: (config) => set((state) => ({
        dbConfigs: [...state.dbConfigs, { ...config, id: `db_${crypto.randomUUID()}` }]
      })),
      
      setActiveDbConfig: (id) => set((state) => ({
        dbConfigs: state.dbConfigs.map(cfg => ({ ...cfg, isActive: cfg.id === id }))
      })),
      
      deleteDbConfig: (id) => set((state) => ({
        dbConfigs: state.dbConfigs.filter(cfg => cfg.id !== id)
      })),
      
      updateDbConfig: (id, data) => set((state) => ({
        dbConfigs: state.dbConfigs.map(cfg => cfg.id === id ? { ...cfg, ...data } : cfg)
      })),
    }),
    {
      name: 'lims-settings',
    }
  )
);

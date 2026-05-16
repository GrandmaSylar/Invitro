import { create } from 'zustand';
import { ReactNode } from 'react';

type DialogOptions = {
  title: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'success';
};

type SuccessOptions = {
  title: string;
  description?: ReactNode;
  actionText?: string;
};

interface DialogStore {
  // Confirm Dialog State
  confirmOpen: boolean;
  confirmOptions: DialogOptions | null;
  confirmResolver: ((value: boolean) => void) | null;

  // Success Dialog State
  successOpen: boolean;
  successOptions: SuccessOptions | null;

  // Actions
  confirm: (options: DialogOptions) => Promise<boolean>;
  closeConfirm: () => void;
  resolveConfirm: (value: boolean) => void;

  success: (options: SuccessOptions) => void;
  closeSuccess: () => void;
}

export const useDialogStore = create<DialogStore>((set, get) => ({
  confirmOpen: false,
  confirmOptions: null,
  confirmResolver: null,

  successOpen: false,
  successOptions: null,

  confirm: (options) => {
    return new Promise<boolean>((resolve) => {
      set({
        confirmOpen: true,
        confirmOptions: options,
        confirmResolver: resolve,
      });
    });
  },

  closeConfirm: () => {
    const { confirmResolver } = get();
    if (confirmResolver) {
      confirmResolver(false);
    }
    set({ confirmOpen: false, confirmOptions: null, confirmResolver: null });
  },

  resolveConfirm: (value: boolean) => {
    const { confirmResolver } = get();
    if (confirmResolver) {
      confirmResolver(value);
    }
    set({ confirmOpen: false, confirmOptions: null, confirmResolver: null });
  },

  success: (options) => {
    set({
      successOpen: true,
      successOptions: options,
    });
  },

  closeSuccess: () => {
    set({ successOpen: false, successOptions: null });
  },
}));

export const showConfirm = (options: DialogOptions) => useDialogStore.getState().confirm(options);
export const showSuccess = (options: SuccessOptions) => useDialogStore.getState().success(options);

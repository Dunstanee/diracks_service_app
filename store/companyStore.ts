/**
 * Zustand store for company details state
 */
import { create } from "zustand";
import { Company } from "./types";

interface CompanyStore {
  company: Company | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCompany: (company: Company) => void;
  updateCompany: (updates: Partial<Company>) => void;
  clearCompany: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const initialState = {
  company: null,
  isLoading: false,
  error: null,
};

export const useCompanyStore = create<CompanyStore>((set) => ({
  ...initialState,

  setCompany: (company: Company) =>
    set({
      company,
      error: null,
    }),

  updateCompany: (updates: Partial<Company>) =>
    set((state) => ({
      company: state.company ? { ...state.company, ...updates } : null,
    })),

  clearCompany: () =>
    set({
      company: null,
      error: null,
    }),

  setLoading: (loading: boolean) =>
    set({
      isLoading: loading,
    }),

  setError: (error: string | null) =>
    set({
      error,
    }),
}));


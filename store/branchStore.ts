/**
 * Zustand store for branch details state
 */
import { create } from "zustand";

export interface Branch {
  id: string;
  organizationId: string;
  isMain: boolean;
  name: string;
  longitude: number;
  latitude: number;
  accuracy: number | null;
  contact: number;
  description: string;
  email: string;
  stateProvince: string;
  city: string;
  location: string;
  slotsId: string | null;
  createdAt: number;
  updatedAt: number;
}

interface BranchStore {
  branch: Branch | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setBranch: (branch: Branch) => void;
  updateBranch: (updates: Partial<Branch>) => void;
  clearBranch: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const initialState = {
  branch: null,
  isLoading: false,
  error: null,
};

export const useBranchStore = create<BranchStore>((set) => ({
  ...initialState,

  setBranch: (branch: Branch) =>
    set({
      branch,
      error: null,
    }),

  updateBranch: (updates: Partial<Branch>) =>
    set((state) => ({
      branch: state.branch ? { ...state.branch, ...updates } : null,
    })),

  clearBranch: () =>
    set({
      branch: null,
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


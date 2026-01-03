/**
 * Zustand store for user permissions state
 */
import { create } from 'zustand';

interface PermissionsStore {
  permissions: string[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setPermissions: (permissions: string[]) => void;
  clearPermissions: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  hasPermission: (permission: string) => boolean;
}

const initialState = {
  permissions: [],
  isLoading: false,
  error: null,
};

export const usePermissionsStore = create<PermissionsStore>((set, get) => ({
  ...initialState,

  setPermissions: (permissions: string[]) =>
    set({
      permissions,
      error: null,
    }),

  clearPermissions: () =>
    set({
      permissions: [],
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

  hasPermission: (permission: string) => {
    const { permissions } = get();
    return permissions.includes(permission);
  },
}));


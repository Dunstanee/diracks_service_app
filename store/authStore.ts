/**
 * Zustand store for authentication state (token management)
 */
import { create } from "zustand";
import { useCompanyStore } from "./companyStore";
import { usePermissionsStore } from "./permissionsStore";
import { AuthState, User } from "./types";
import { useUserStore } from "./userStore";

interface AuthStore extends AuthState {
  // Actions
  setToken: (token: string, refreshToken: string) => void;
  clearToken: () => void;
  updateToken: (token: string) => void;
  updateRefreshToken: (refreshToken: string) => void;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
}

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,

  setToken: (token: string, refreshToken: string) =>
    set({
      token,
      refreshToken,
      isAuthenticated: true,
    }),

  clearToken: () =>
    set({
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    }),

  updateToken: (token: string) =>
    set((state) => ({
      token,
      isAuthenticated: !!token,
    })),

  updateRefreshToken: (refreshToken: string) =>
    set({
      refreshToken,
    }),

  login: (token: string, refreshToken: string, user: User) => {
    set({
      token,
      refreshToken,
      isAuthenticated: true,
    });
    // Also set the user in the user store
    useUserStore.getState().setUser(user);
  },

  logout: () => {
    set({
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
    // Also clear the user, company, and permissions stores
    useUserStore.getState().clearUser();
    useCompanyStore.getState().clearCompany();
    usePermissionsStore.getState().clearPermissions();
  },
}));


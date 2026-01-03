/**
 * Zustand store for user profile state
 */
import { create } from "zustand";
import { User } from "./types";

interface UserStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const initialState = {
  user: null,
  isLoading: false,
  error: null,
};

export const useUserStore = create<UserStore>((set) => ({
  ...initialState,

  setUser: (user: User) =>
    set({
      user,
      error: null,
    }),

  updateUser: (updates: Partial<User>) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  clearUser: () =>
    set({
      user: null,
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


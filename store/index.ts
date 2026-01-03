/**
 * Main store exports and combined store utilities
 */
export * from "./authStore";
export * from "./branchStore";
export * from "./companyStore";
export * from "./types";
export * from "./userStore";
export * from "./permissionsStore";

/**
 * Combined store hook for convenience
 * Use this when you need to access multiple stores at once
 */
import { useAuthStore } from "./authStore";
import { useCompanyStore } from "./companyStore";
import { useUserStore } from "./userStore";

/**
 * Custom hook to access all stores at once
 * Usage: const { token, user, company, login, logout } = useAppStore();
 */
export const useAppStore = () => {
  const auth = useAuthStore();
  const user = useUserStore();
  const company = useCompanyStore();

  return {
    // Auth state
    token: auth.token,
    refreshToken: auth.refreshToken,
    isAuthenticated: auth.isAuthenticated,

    // User state
    user: user.user,
    userLoading: user.isLoading,
    userError: user.error,

    // Company state
    company: company.company,
    companyLoading: company.isLoading,
    companyError: company.error,

    // Auth actions
    setToken: auth.setToken,
    clearToken: auth.clearToken,
    updateToken: auth.updateToken,
    updateRefreshToken: auth.updateRefreshToken,

    // User actions
    setUser: user.setUser,
    updateUser: user.updateUser,
    clearUser: user.clearUser,

    // Company actions
    setCompany: company.setCompany,
    updateCompany: company.updateCompany,
    clearCompany: company.clearCompany,

    // Combined logout action
    logout: () => {
      auth.clearToken();
      user.clearUser();
      company.clearCompany();
    },
  };
};


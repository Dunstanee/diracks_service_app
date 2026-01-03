/**
 * Type definitions for the application store
 */

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  userNumber: string;
  email: string;
  phone?: string;
  gender?: number;
  country?: string;
  birthDate?: string;
  avatar?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  website?: string;
  logo?: string;
  industry?: string;
  size?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}


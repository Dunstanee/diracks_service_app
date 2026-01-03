/**
 * API service for handling all HTTP requests
 * Supports GET, POST, PUT, PATCH with optional authentication and multipart/form-data
 */

import { useAuthStore } from "@/store/authStore";
import { router } from "expo-router";

// Get API domain from environment variables
// Expo requires EXPO_PUBLIC_ prefix for client-side env vars
const API_DOMAIN = process.env.EXPO_PUBLIC_API_DOMAIN || process.env.API_DOMAIN || "";

if (!API_DOMAIN) {
  console.warn("API_DOMAIN is not set in environment variables");
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRequestOptions {
  /**
   * The endpoint path (e.g., "/users", "/auth/login")
   * Will be appended to API_DOMAIN
   */
  endpoint: string;
  
  /**
   * HTTP method (GET, POST, PUT, PATCH, DELETE)
   */
  method?: HttpMethod;
  
  /**
   * Request body data (automatically stringified for JSON requests)
   */
  data?: any;
  
  /**
   * Query parameters (will be appended to URL)
   */
  params?: Record<string, string | number | boolean | null | undefined>;
  
  /**
   * Whether to include authentication token (default: true)
   */
  requiresAuth?: boolean;
  
  /**
   * Whether the request is multipart/form-data (default: false)
   * When true, data should be FormData or an object that will be converted to FormData
   */
  isMultipart?: boolean;
  
  /**
   * Custom headers to include in the request
   */
  headers?: Record<string, string>;
  
  /**
   * Whether to throw errors on non-2xx responses (default: true)
   */
  throwOnError?: boolean;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export interface ApiError {
  message: string;
  status?: number;
  statusText?: string;
  data?: any;
}

/**
 * Builds query string from params object
 */
function buildQueryString(params: Record<string, string | number | boolean | null | undefined>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Converts an object to FormData
 */
function objectToFormData(obj: Record<string, any>): FormData {
  const formData = new FormData();
  
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (value instanceof File || value instanceof Blob) {
        formData.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (item instanceof File || item instanceof Blob) {
            formData.append(`${key}[${index}]`, item);
          } else {
            formData.append(`${key}[${index}]`, String(item));
          }
        });
      } else if (typeof value === "object") {
        // Handle nested objects
        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
          if (nestedValue instanceof File || nestedValue instanceof Blob) {
            formData.append(`${key}[${nestedKey}]`, nestedValue);
          } else {
            formData.append(`${key}[${nestedKey}]`, String(nestedValue));
          }
        });
      } else {
        formData.append(key, String(value));
      }
    }
  });
  
  return formData;
}

/**
 * Main API request function
 */
export async function apiRequest<T = any>(options: ApiRequestOptions): Promise<ApiResponse<T>> {
  const {
    endpoint,
    method = "GET",
    data,
    params,
    requiresAuth = true,
    isMultipart = false,
    headers = {},
    throwOnError = true,
  } = options;

  // Validate API_DOMAIN is set
  if (!API_DOMAIN || API_DOMAIN.trim() === "") {
    const error: ApiError = {
      message: "API_DOMAIN is not configured. Please set EXPO_PUBLIC_API_DOMAIN in your environment variables.",
      status: 0,
    };
    console.error("API Error:", error.message);
    if (throwOnError) {
      throw error;
    }
    return {
      data: null as T,
      status: 0,
      statusText: "Configuration Error",
      headers: new Headers(),
    };
  }

  // Build URL
  let url = `${API_DOMAIN}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
 
  // Add query parameters for GET requests or if params are provided
  if (params) {
    url += buildQueryString(params);
  }

  // Get auth token if required
  let authToken: string | null = null;
  if (requiresAuth) {
    authToken = useAuthStore.getState().token;
    if (!authToken) {
      const error: ApiError = {
        message: "Authentication token is required but not available",
        status: 401,
      };
      // logout user to Login screen
      useAuthStore.getState().logout();
      router.replace('/');
      if (throwOnError) {
        throw error;
      }
      router.replace('/');
    }
  }

  // Prepare headers
  const requestHeaders: HeadersInit = {
    ...headers,
  };

  // Set content type and authorization
  if (!isMultipart) {
    requestHeaders["Content-Type"] = "application/json";
  }
  
  if (authToken) {
    requestHeaders["Authorization"] = `Bearer ${authToken}`;
  }

  // Prepare body
  let body: string | FormData | undefined;
  if (data !== undefined) {
    if (isMultipart) {
      // Handle FormData or convert object to FormData
      if (data instanceof FormData) {
        body = data;
      } else if (typeof data === "object") {
        body = objectToFormData(data);
      } else {
        body = data as FormData;
      }
    } else {
      // JSON body
      body = JSON.stringify(data);
    }
  }

  // Make the request
  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body,
    });

    // Handle 204 No Content - no response body to parse
    if (response.status === 204) {
      const apiResponse: ApiResponse<T> = {
        data: null as T,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
      return apiResponse;
    }

    // Parse response
    let responseData: T;
    const contentType = response.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      // Try to parse as JSON, fallback to text
      const text = await response.text();
      // If text is empty (e.g., for 204-like responses), return null
      if (!text || text.trim() === '') {
        responseData = null as T;
      } else {
        try {
          responseData = JSON.parse(text) as T;
        } catch {
          responseData = text as T;
        }
      }
    }

    // Extract data - handle both wrapped and unwrapped responses
    // If response has a 'data' property, use it; otherwise use the response directly
    const extractedData = (responseData as any)?.data !== undefined 
      ? (responseData as any).data 
      : responseData;

    const apiResponse: ApiResponse<T> = {
      data: extractedData as T,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    };

  
    // Handle 401 Unauthorized - clear auth token if request required auth
    if (response.status === 401 && requiresAuth) {
      // Clear authentication token on 401 error
      useAuthStore.getState().clearToken();
    }

    // Throw error if status is not ok and throwOnError is true
    // Note: 204 is considered "ok" (successful with no content)
    if (!response.ok && throwOnError) {
      console.log(responseData);
      // Extract error message from various possible response formats
      let errorMessage = 
        (responseData as any)?.message || 
        response.statusText || 
        `Request failed with status ${response.status}`;
      // Capitalize first letter for better UX
      if (errorMessage && errorMessage.length > 0) {
        errorMessage = errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1);
      }
      
      const error: ApiError = {
        message: errorMessage,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      };
      throw error;
    }

    return apiResponse;
  } catch (error) {
    console.log("API Request Error:", error);
    
    // Handle network errors or other exceptions
    if (error instanceof Error && "status" in error) {
      // This is an ApiError we threw
      throw error;
    }

    // Check if it's a network error (TypeError: Network request failed)
    const errorMessage = (error as any)?.message || "";
    if (errorMessage.includes("Network request failed") || errorMessage.includes("Failed to fetch")) {
      const apiError: ApiError = {
        message: API_DOMAIN 
          ? "Network request failed. Please check your internet connection and ensure the API server is running."
          : "Network request failed. API_DOMAIN is not configured. Please set EXPO_PUBLIC_API_DOMAIN in your environment variables.",
        data: (error as any)?.data || null,
      };
      
      if (throwOnError) {
        throw apiError;
      }

      return {
        data: null as T,
        status: 0,
        statusText: "Network Error",
        headers: new Headers(),
      };
    }

    const apiError: ApiError = {
      message: (error as any)?.data?.message || errorMessage || "Network request failed",
      data: (error as any)?.data?.data || null,
    };
    
    if (throwOnError) {
      throw apiError;
    }

    return {
      data: null as T,
      status: 0,
      statusText: "Network Error",
      headers: new Headers(),
    };
  }
}

/**
 * Convenience methods for each HTTP method
 */
export const api = {
  /**
   * GET request
   */
  get: <T = any>(endpoint: string, options?: Omit<ApiRequestOptions, "endpoint" | "method">) =>
    apiRequest<T>({ ...options, endpoint, method: "GET" }),

  /**
   * POST request
   */
  post: <T = any>(endpoint: string, data?: any, options?: Omit<ApiRequestOptions, "endpoint" | "method" | "data">) =>
    apiRequest<T>({ ...options, endpoint, method: "POST", data }),

  /**
   * PUT request
   */
  put: <T = any>(endpoint: string, data?: any, options?: Omit<ApiRequestOptions, "endpoint" | "method" | "data">) =>
    apiRequest<T>({ ...options, endpoint, method: "PUT", data }),

  /**
   * PATCH request
   */
  patch: <T = any>(endpoint: string, data?: any, options?: Omit<ApiRequestOptions, "endpoint" | "method" | "data">) =>
    apiRequest<T>({ ...options, endpoint, method: "PATCH", data }),

  /**
   * DELETE request
   */
  delete: <T = any>(endpoint: string, options?: Omit<ApiRequestOptions, "endpoint" | "method">) =>
    apiRequest<T>({ ...options, endpoint, method: "DELETE" }),
};

export default api;


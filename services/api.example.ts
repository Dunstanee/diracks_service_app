/**
 * Example usage of the API service
 * This file demonstrates how to use the apiRequest function and convenience methods
 */

import api, { apiRequest } from "./api";

// Example 1: GET request without authentication
export async function getPublicData() {
  try {
    const response = await api.get("/public/data", {
      requiresAuth: false,
    });
    console.log("Data:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

// Example 2: GET request with authentication (default)
export async function getUserProfile() {
  try {
    const response = await api.get("/users/profile");
    return response.data;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
}

// Example 3: GET request with query parameters
export async function searchUsers(query: string, page: number = 1) {
  try {
    const response = await api.get("/users/search", {
      params: {
        q: query,
        page,
        limit: 10,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error searching users:", error);
    throw error;
  }
}

// Example 4: POST request (JSON)
export async function login(username: string, password: string) {
  try {
    const response = await api.post(
      "/auth/login",
      {
        username,
        password,
      },
      {
        requiresAuth: false, // Login endpoint doesn't need token
      }
    );
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

// Example 5: POST request with authentication
export async function createPost(title: string, content: string) {
  try {
    const response = await api.post(
      "/posts",
      {
        title,
        content,
      }
      // requiresAuth defaults to true
    );
    return response.data;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
}

// Example 6: PUT request
export async function updateUser(userId: string, updates: { name?: string; email?: string }) {
  try {
    const response = await api.put(`/users/${userId}`, updates);
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

// Example 7: PATCH request
export async function updateUserPartial(userId: string, updates: Partial<{ name: string; email: string }>) {
  try {
    const response = await api.patch(`/users/${userId}`, updates);
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

// Example 8: DELETE request
export async function deletePost(postId: string) {
  try {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
}

// Example 9: Multipart/form-data request (file upload)
export async function uploadAvatar(userId: string, imageFile: File | Blob) {
  try {
    // Option 1: Pass FormData directly
    const formData = new FormData();
    formData.append("avatar", imageFile);
    formData.append("userId", userId);

    const response = await api.post("/users/avatar", formData, {
      isMultipart: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw error;
  }
}

// Example 10: Multipart request with object (automatically converted to FormData)
export async function uploadDocument(file: File | Blob, metadata: { title: string; description: string }) {
  try {
    // Option 2: Pass object, it will be converted to FormData automatically
    const response = await api.post(
      "/documents",
      {
        file,
        title: metadata.title,
        description: metadata.description,
      },
      {
        isMultipart: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error uploading document:", error);
    throw error;
  }
}

// Example 11: Using apiRequest directly for more control
export async function customRequest() {
  try {
    const response = await apiRequest({
      endpoint: "/custom/endpoint",
      method: "POST",
      data: { custom: "data" },
      params: { filter: "active" },
      requiresAuth: true,
      headers: {
        "X-Custom-Header": "custom-value",
      },
      throwOnError: true,
    });
    return response.data;
  } catch (error) {
    console.error("Custom request error:", error);
    throw error;
  }
}

// Example 12: Handling errors without throwing
export async function safeRequest() {
  const response = await api.get("/some/endpoint", {
    throwOnError: false, // Won't throw, returns response even on error
  });

  if (response.status >= 200 && response.status < 300) {
    return response.data;
  } else {
    console.error("Request failed:", response.status, response.statusText);
    return null;
  }
}


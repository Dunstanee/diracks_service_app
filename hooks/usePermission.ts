/**
 * Hook to check if user has a specific permission
 * @param permission - The permission name to check
 * @returns boolean - true if user has the permission, false otherwise
 */
import { usePermissionsStore } from '@/store/permissionsStore';

export function usePermission(permission: string): boolean {
  const hasPermission = usePermissionsStore((state) => state.hasPermission(permission));
  return hasPermission;
}

/**
 * Hook to check multiple permissions
 * @param permissions - Array of permission names to check
 * @param requireAll - If true, user must have all permissions. If false, user needs at least one.
 * @returns boolean - true if permission requirements are met
 */
export function usePermissions(permissions: string[], requireAll: boolean = false): boolean {
  const hasPermission = usePermissionsStore((state) => state.hasPermission);
  
  if (requireAll) {
    return permissions.every((permission) => hasPermission(permission));
  }
  return permissions.some((permission) => hasPermission(permission));
}


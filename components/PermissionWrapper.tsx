/**
 * PermissionWrapper component to conditionally render children based on user permissions
 */
import { usePermission } from '@/hooks/usePermission';
import React from 'react';
import { View, ViewProps } from 'react-native';

interface PermissionWrapperProps extends ViewProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  hideWhenNoPermission?: boolean;
}

/**
 * Wrapper component that conditionally renders children based on user permissions
 * @param permission - The permission name required to show the children
 * @param children - Content to render if user has permission
 * @param fallback - Optional content to render if user doesn't have permission
 * @param hideWhenNoPermission - If true, renders nothing when no permission. If false, renders fallback or empty View.
 */
export default function PermissionWrapper({
  permission,
  children,
  fallback = null,
  hideWhenNoPermission = true,
  ...viewProps
}: PermissionWrapperProps) {
  const hasPermission = usePermission(permission);

  if (hasPermission) {
    return <View {...viewProps}>{children}</View>;
  }

  if (hideWhenNoPermission) {
    return null;
  }

  return <View {...viewProps}>{fallback}</View>;
}


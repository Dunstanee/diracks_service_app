/**
 * PermissionButton component - A button that is disabled/hidden based on permissions
 */
import { usePermission } from '@/hooks/usePermission';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface PermissionButtonProps extends TouchableOpacityProps {
  permission: string;
  children: React.ReactNode;
  hideWhenNoPermission?: boolean;
  disabledWhenNoPermission?: boolean;
}

/**
 * Button component that respects user permissions
 * @param permission - The permission name required to enable/show the button
 * @param children - Button content
 * @param hideWhenNoPermission - If true, button is hidden when no permission. If false, button is disabled.
 * @param disabledWhenNoPermission - If true, button is disabled when no permission (only if hideWhenNoPermission is false)
 */
export default function PermissionButton({
  permission,
  children,
  hideWhenNoPermission = false,
  disabledWhenNoPermission = true,
  ...touchableProps
}: PermissionButtonProps) {
  const hasPermission = usePermission(permission);

  if (hideWhenNoPermission && !hasPermission) {
    return null;
  }

  return (
    <TouchableOpacity
      {...touchableProps}
      disabled={!hasPermission ? disabledWhenNoPermission : touchableProps.disabled}
      style={[
        touchableProps.style,
        !hasPermission && disabledWhenNoPermission && { opacity: 0.5 },
      ]}
    >
      {children}
    </TouchableOpacity>
  );
}


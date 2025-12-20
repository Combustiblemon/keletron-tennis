/* eslint-disable react/jsx-no-useless-fragment */
import { ReactNode } from 'react';

import { useRoles } from '@/hooks/useRoles';

export interface RoleGuardProps {
  children: ReactNode;
  /**
   * Required role to show children
   */
  role?: 'USER' | 'ADMIN' | 'DEVELOPER';
  /**
   * Minimum required role (uses hierarchy: USER < ADMIN < DEVELOPER)
   */
  minRole?: 'USER' | 'ADMIN' | 'DEVELOPER';
  /**
   * If true, requires admin role (ADMIN or DEVELOPER)
   */
  requireAdmin?: boolean;
  /**
   * If true, requires developer role only
   */
  requireDeveloper?: boolean;
  /**
   * Optional fallback to show if role requirement not met
   */
  fallback?: ReactNode;
  /**
   * If true, inverts the logic (shows children if user does NOT have the role)
   */
  invert?: boolean;
}

/**
 * RoleGuard Component
 *
 * Conditionally renders children based on user role.
 * Use this to show/hide UI elements based on permissions.
 *
 * @example
 * ```tsx
 * // Show only for admins
 * <RoleGuard requireAdmin>
 *   <AdminButton />
 * </RoleGuard>
 *
 * // Show only for developers
 * <RoleGuard requireDeveloper>
 *   <DevTools />
 * </RoleGuard>
 *
 * // Show for specific role
 * <RoleGuard role="USER">
 *   <UserOnlyFeature />
 * </RoleGuard>
 *
 * // Show for minimum role (ADMIN or higher)
 * <RoleGuard minRole="ADMIN">
 *   <AdminOrDevFeature />
 * </RoleGuard>
 *
 * // Invert logic (show for non-admins)
 * <RoleGuard requireAdmin invert>
 *   <RegularUserFeature />
 * </RoleGuard>
 *
 * // With fallback
 * <RoleGuard requireAdmin fallback={<UpgradePrompt />}>
 *   <PremiumFeature />
 * </RoleGuard>
 * ```
 */
export const RoleGuard = ({
  children,
  role,
  minRole,
  requireAdmin = false,
  requireDeveloper = false,
  fallback = null,
  invert = false,
}: RoleGuardProps) => {
  const roles = useRoles();

  let hasPermission = false;

  // Check requireDeveloper first (most specific)
  if (requireDeveloper) {
    hasPermission = roles.isDeveloper;
  }
  // Then check requireAdmin
  else if (requireAdmin) {
    hasPermission = roles.isAdmin;
  }
  // Then check minRole
  else if (minRole) {
    hasPermission = roles.hasRoleOrHigher(minRole);
  }
  // Finally check specific role
  else if (role) {
    hasPermission = roles.hasRole(role);
  }
  // If no conditions specified, allow by default
  else {
    hasPermission = true;
  }

  // Invert logic if requested
  if (invert) {
    hasPermission = !hasPermission;
  }

  // Render children or fallback
  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

export default RoleGuard;

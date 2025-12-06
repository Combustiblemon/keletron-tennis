import { useUser } from '@/components/UserProvider/UserProvider';

/**
 * useRoles Hook
 *
 * Provides convenient access to user role information.
 *
 * @returns Object containing role checks and user role data
 *
 * @example
 * ```tsx
 * const { isAdmin, isDeveloper, isUser, role } = useRoles();
 *
 * if (isAdmin) {
 *   return <AdminFeature />;
 * }
 * ```
 */
export const useRoles = () => {
  const { user, userRoles } = useUser();

  return {
    // Role checks
    isAdmin: userRoles.isAdmin,
    isDeveloper: userRoles.isDeveloper,
    isUser: user.role === 'USER',

    // Raw role value
    role: user.role,

    // Helper to check specific role
    hasRole: (role: 'USER' | 'ADMIN' | 'DEVELOPER') => user.role === role,

    // Helper to check if user has at least a certain role level
    // USER < ADMIN < DEVELOPER
    hasRoleOrHigher: (minRole: 'USER' | 'ADMIN' | 'DEVELOPER') => {
      const roleHierarchy = { USER: 0, ADMIN: 1, DEVELOPER: 2 };
      return roleHierarchy[user.role] >= roleHierarchy[minRole];
    },
  };
};

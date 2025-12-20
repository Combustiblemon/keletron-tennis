/* eslint-disable react/jsx-no-useless-fragment */
import { Button, Center, Stack, Text } from '@mantine/core';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { AuthLoading } from '../AuthLoading/AuthLoading';
import { useUser } from '../UserProvider/UserProvider';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
}

/**
 * ProtectedRoute Component
 *
 * Ensures user is authenticated before rendering children.
 * Optionally requires admin role.
 *
 * Features:
 * - Shows loading state while checking auth
 * - Redirects to sign-in if not authenticated
 * - Shows access denied for non-admin users (if requireAdmin=true)
 * - Works with Clerk's server-side middleware
 *
 * Usage:
 * ```tsx
 * <ProtectedRoute>
 *   <YourProtectedContent />
 * </ProtectedRoute>
 *
 * // For admin-only routes:
 * <ProtectedRoute requireAdmin>
 *   <AdminContent />
 * </ProtectedRoute>
 * ```
 */
export const ProtectedRoute = ({
  children,
  requireAdmin = false,
  fallback,
}: ProtectedRouteProps) => {
  const router = useRouter();
  const { isAuthenticated, isUserLoading, userRoles } = useUser();

  useEffect(() => {
    // Don't redirect while still loading
    if (isUserLoading) {
      return;
    }

    // Redirect to sign-in if not authenticated
    if (!isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isAuthenticated, isUserLoading, router]);

  // Show loading state
  if (isUserLoading) {
    return <AuthLoading>{null}</AuthLoading>;
  }

  // Not authenticated - show nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // Check admin requirement
  if (requireAdmin && !userRoles.isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Center w="100%" h="100vh">
        <Stack align="center" gap="md">
          <Text size="xl" fw="bold">
            Access Denied
          </Text>
          <Text size="sm" c="dimmed">
            You don&apos;t have permission to access this page.
          </Text>
          <Button onClick={() => router.push('/')}>Go to Homepage</Button>
        </Stack>
      </Center>
    );
  }

  // User is authenticated (and admin if required), render children
  return children;
};

export default ProtectedRoute;

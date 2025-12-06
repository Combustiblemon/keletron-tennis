import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { useUser } from '../UserProvider/UserProvider';

/**
 * ProfileCheck Component
 *
 * Checks if authenticated user has completed their profile (firstname & lastname).
 * If profile is incomplete, redirects to /settings to complete it.
 *
 * This should be placed in _app.tsx after UserProvider.
 */
export const ProfileCheck = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { isAuthenticated, user, isUserLoading } = useUser();

  useEffect(() => {
    // Don't check if still loading or not authenticated
    if (isUserLoading || !isAuthenticated) {
      return;
    }

    // Don't redirect if already on settings, sign-in, sign-up, or auth pages
    const excludedPaths = ['/settings', '/sign-in', '/sign-up', '/auth'];

    if (excludedPaths.some((path) => router.pathname.startsWith(path))) {
      return;
    }

    // Check if profile is incomplete (missing firstname or lastname)
    const isProfileIncomplete = !user.firstname || !user.lastname;

    if (isProfileIncomplete) {
      // eslint-disable-next-line no-console
      console.log('Profile incomplete, redirecting to settings...');
      router.push('/settings');
    }
  }, [isAuthenticated, user, isUserLoading, router]);

  return children;
};

export default ProfileCheck;

import { LoadingOverlay, Stack } from '@mantine/core';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

/**
 * Legacy auth page - redirects to new Clerk sign-in page
 *
 * This page is kept for backward compatibility with old links.
 * All authentication is now handled by Clerk at /sign-in and /sign-up
 */
const AuthPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new sign-in page
    router.replace('/sign-in');
  }, [router]);

  return (
    <Stack w="100%" h="100%" align="center" justify="center">
      <LoadingOverlay
        visible
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
      />
    </Stack>
  );
};

export default AuthPage;

/*
 * LEGACY CODE REMOVED
 *
 * Old authentication system used email + verification code.
 * Now using Clerk for authentication:
 * - Sign in: /sign-in
 * - Sign up: /sign-up
 *
 * Old functions removed:
 * - login() - Use Clerk's <SignIn /> component
 * - verifyLogin() - Use Clerk's <SignIn /> component
 * - Custom email/code verification UI
 *
 * All authentication is now handled by Clerk.
 */

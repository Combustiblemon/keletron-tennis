import { Center, Loader, Stack, Text } from '@mantine/core';

import { useUser } from '../UserProvider/UserProvider';

/**
 * AuthLoading Component
 *
 * Shows a loading state while authentication is being checked.
 * Only displays when Clerk is still loading or user data is being fetched.
 *
 * Usage: Wrap protected pages with this component
 */
export const AuthLoading = ({ children }: { children: React.ReactNode }) => {
  const { isUserLoading } = useUser();

  // Show loading state while checking authentication
  if (isUserLoading) {
    return (
      <Center w="100%" h="100vh">
        <Stack align="center" gap="md">
          <Loader size="xl" />
          <Text size="sm" c="dimmed">
            Loading...
          </Text>
        </Stack>
      </Center>
    );
  }

  // Once loaded, render children
  return children;
};

export default AuthLoading;

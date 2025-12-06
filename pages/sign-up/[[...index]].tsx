import { SignUp } from '@clerk/nextjs';
import { Stack } from '@mantine/core';

/**
 * Sign-up page using Clerk's pre-built SignUp component
 *
 * The [[...index]].tsx naming allows Clerk to handle all sign-up routes:
 * - /sign-up
 * - /sign-up/verify-email-address
 * - /sign-up/verify-phone-number
 * - etc.
 */
const SignUpPage = () => {
  return (
    <Stack w="100%" h="100%" align="center" justify="center" p="xl">
      <SignUp
        appearance={{
          elements: {
            rootBox: {
              width: '100%',
              maxWidth: '400px',
            },
            card: {
              boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
            },
          },
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/settings"
        redirectUrl="/settings"
      />
    </Stack>
  );
};

export default SignUpPage;

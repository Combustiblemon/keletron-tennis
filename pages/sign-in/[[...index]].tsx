import { SignIn } from '@clerk/nextjs';
import { Stack } from '@mantine/core';

/**
 * Sign-in page using Clerk's pre-built SignIn component
 *
 * The [[...index]].tsx naming allows Clerk to handle all sign-in routes:
 * - /sign-in
 * - /sign-in/factor-one
 * - /sign-in/factor-two
 * - etc.
 */
const SignInPage = () => {
  return (
    <Stack w="100%" h="100%" align="center" justify="center" p="0">
      <SignIn
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
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/"
        redirectUrl="/"
      />
    </Stack>
  );
};

export default SignInPage;

/* eslint-disable no-restricted-exports */
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/auth?type=login',
    signOut: '/',
  },
});

// pages that require authentication
export const config = {
  matcher: ['/reservations', '/admin', '/profile'],
};

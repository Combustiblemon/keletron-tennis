/* eslint-disable no-restricted-exports */
import { withAuth } from 'next-auth/middleware';

// pages that require authentication
export const config = {
  matcher: ['/reservations', '/admin', '/profile'],
};

export default withAuth({
  pages: {
    signIn: '/auth?type=login',
    signOut: '/',
  },
  callbacks: {
    authorized: ({ token, req }) => {
      const hasId = !!token?._id;

      if (!hasId) {
        return false;
      }

      if (req.url.includes('/admin')) {
        return token?.role === 'ADMIN';
      }

      return true;
    },
  },
});

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
      const hasId = !!token?.user?._id;

      if (!hasId) {
        return false;
      }

      if (req.url.includes('/admin')) {
        return token?.user?.role === 'ADMIN';
      }

      return true;
    },
  },
});

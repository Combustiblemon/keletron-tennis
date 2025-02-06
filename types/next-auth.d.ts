import NextAuth from 'next-auth';

import { User } from '@/models/User';

declare module 'next-auth' {
  interface User {
    role?: User['role'];
    _id?: string;
    email?: string;
    name?: string;
    id?: never;
    image?: never;
    FCMToken?: string;
    session?: string;
  }
  interface Session {
    user?: {
      name: string;
      email: string;
      role: User['role'];
      _id: string;
      FCMToken?: string;
      session?: string;
    };
    expires?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user?: {
      role: User['role'];
      _id: string;
      email: string;
      name: string;
      FCMToken?: string;
      session?: string;
    };
  }
}

declare module '@auth/core/adapters' {
  interface AdapterUser {
    role: string;
  }
}

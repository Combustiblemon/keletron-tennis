import NextAuth from 'next-auth';

import { Users } from '@/models/User';

declare module 'next-auth' {
  interface User {
    role?: Users['role'];
    _id?: string;
    email?: string;
    name?: string;
    id?: never;
    image?: never;
    FCMTokens?: Array<string>;
    session?: string;
  }
  interface Session {
    user?: {
      name: string;
      email: string;
      role: Users['role'];
      _id: string;
      FCMTokens?: Array<string>;
      session?: string;
    };
    expires?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user?: {
      role: Users['role'];
      _id: string;
      email: string;
      name: string;
      FCMTokens?: Array<string>;
      session?: string;
    };
  }
}

declare module '@auth/core/adapters' {
  interface AdapterUser {
    role: string;
  }
}

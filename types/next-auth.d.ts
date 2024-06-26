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
  }
  interface Session {
    user: {
      name: string;
      email: string;
      role: Users['role'];
      _id: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: Users['role'];
    _id: string;
    email: string;
    name: string;
    picture?: never;
    sub?: never;
  }
}

declare module '@auth/core/adapters' {
  interface AdapterUser {
    role: string;
  }
}

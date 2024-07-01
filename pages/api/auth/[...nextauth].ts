/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { NextApiRequest, NextApiResponse } from 'next';
import NextAuth, { AuthOptions, User, getServerSession } from 'next-auth';
import { decode, encode } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { z } from 'zod';

import { Errors, onError } from '@/lib/api/common';
import dbConnect from '@/lib/api/dbConnect';
import UserModel, { Users, UserSanitized } from '@/models/User';

type AuthUserHelpersReturnType = (
  | {
      isLoggedIn: true;
      user: User;
    }
  | {
      isLoggedIn: false;
      user: undefined;
    }
) & {
  isAdmin: boolean;
  isUser: boolean;
};

export const authUserHelpers = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const authOpts = authOptions(req, res);
  const session = await getServerSession(req, res, authOpts);

  const isLoggedIn = !!session;

  return {
    isLoggedIn,
    isAdmin: isLoggedIn && session?.user.role === 'ADMIN',
    isUser: isLoggedIn && session?.user.role === 'USER',
    user: isLoggedIn ? session.user : undefined,
  } as AuthUserHelpersReturnType;
};

export const authOptions = (
  req: NextApiRequest,
  res: NextApiResponse
): AuthOptions => ({
  session: {
    strategy: 'jwt',
  },
  jwt: { encode, decode },
  pages: {
    signIn: '/auth?type=login',
    signOut: '/',
    // error: '/auth/error', // Error code passed in query string as ?error=
    // verifyRequest: '/auth/verify-request', // (used for check email message)
    // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out if not of interest)
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      id: 'login',
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        let data: { email: string; password: string };

        try {
          data = z
            .object({
              email: z.string().email(),
              password: z.string().min(6),
            })
            .parse(credentials);
        } catch (error) {
          console.error('Error parsing credentials', error);
          throw new Error(Errors.INVALID_CREDENTIALS);
        }

        const { email, password } = data;

        let user: Users | null;

        try {
          user = await UserModel.findOne({
            email,
          });
        } catch (error) {
          console.error('Error finding user', error);

          res
            .status(500)
            .json(onError(new Error(Errors.INTERNAL_SERVER_ERROR), 'register'));

          return null;
        }

        if (!user) {
          throw new Error(Errors.LOGIN_ERROR);
        }

        const passwordMatch = user.comparePasswords(password);

        if (!passwordMatch) {
          throw new Error(Errors.LOGIN_ERROR);
        }

        console.log('User logged in', user.email);

        // If no error and we have user data, return it
        if (user) {
          return {
            name: user.name,
            email: user.email,
            role: user.role,
            _id: user._id as string,
          };
        }

        // Return null if user data could not be retrieved
        return null;
      },
    }),
    CredentialsProvider({
      id: 'register',
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
        name: { type: 'text' },
      },
      async authorize(credentials) {
        let data: { email: string; password: string; name: string };

        try {
          data = z
            .object({
              email: z.string().email(),
              password: z.string().min(6),
              name: z.string().max(60),
            })
            .parse(credentials);
        } catch (error) {
          console.error('Error parsing credentials', error);
          throw new Error(Errors.INVALID_CREDENTIALS);
        }

        const { email, password, name } = data;

        let userExists: boolean;

        try {
          userExists = Boolean(await UserModel.exists({ email }));
        } catch (error) {
          console.error('Error checking if user exists', error);

          res
            .status(500)
            .json(onError(new Error('internal server error'), 'register'));
          return null;
        }

        if (userExists) {
          throw new Error(Errors.USER_EXISTS);
        }

        let user: UserSanitized;

        try {
          user = (
            await UserModel.create({
              name,
              email,
              password,
              role: 'USER',
            })
          ).sanitize();
        } catch (error) {
          console.error('Error creating user', error);

          res
            .status(500)
            .json(onError(new Error(Errors.INTERNAL_SERVER_ERROR), 'register'));
          return null;
        }

        console.log('User created', user.email);

        // If no error and we have user data, return it
        if (user) {
          return {
            name: user.name,
            email: user.email,
            role: user.role,
            _id: user._id as string,
          };
        }

        // Return null if user data could not be retrieved
        return null;
      },
    }),
  ],
  callbacks: {
    session({ session, user, token }) {
      if (token) {
        session.user = {
          role: token.role || 'USER',
          name: token.name || '',
          email: token.email || '',
          _id: token._id || '',
        };
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role || 'USER';
        token._id = user._id || '';
        token.email = user.email || '';
        token.name = user.name || '';
      }

      return token;
    },
  },
});

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  return NextAuth(req, res, authOptions(req, res));
}

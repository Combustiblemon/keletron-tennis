/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { NextApiRequest, NextApiResponse } from 'next';
import NextAuth, { AuthOptions, User, getServerSession } from 'next-auth';
import { decode, encode } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { z } from 'zod';
import { nanoid } from 'nanoid';

import { Errors, onError } from '@/lib/api/common';
import dbConnect from '@/lib/api/dbConnect';
import UserModel, { Users, UserSanitized } from '@/models/User';
import {
  subscribeToTopic,
  subscribeUser,
  unsubscribeUser,
} from '@/lib/api/notifications';
import { use } from 'react';

type AuthUserHelpersReturnType = (
  | {
      isLoggedIn: true;
      user: NonNullable<User>;
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

  const isLoggedIn = !!session && !!session?.user;
  return {
    isLoggedIn,
    isAdmin: isLoggedIn && session?.user?.role === 'ADMIN',
    isUser: isLoggedIn && session?.user?.role === 'USER',
    user: isLoggedIn ? session.user : undefined,
  } as AuthUserHelpersReturnType;
};

const registerValidator = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().max(60),
  FCMToken: z.string().optional(),
});

const loginValidator = registerValidator.pick({
  email: true,
  password: true,
  FCMToken: true,
});

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
        FCMToken: { type: 'text' },
      },
      type: 'credentials',
      async authorize(credentials) {
        let data: z.infer<typeof loginValidator>;

        try {
          data = loginValidator.parse(credentials);
        } catch (error) {
          console.error('Error parsing credentials', error);
          throw new Error(Errors.INVALID_CREDENTIALS);
        }

        const { email, password, FCMToken } = data;

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
          try {
            user.session = nanoid();

            await user.save();

            return {
              name: user.name,
              email: user.email,
              role: user.role,
              _id: user._id as string,
              FCMToken,
              session: user.session,
            };
          } catch (err) {
            console.error(err);

            return null;
          }
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
        FCMToken: { type: 'text' },
      },
      type: 'credentials',
      async authorize(credentials) {
        let data: z.infer<typeof registerValidator>;

        try {
          data = registerValidator.parse(credentials);
        } catch (error) {
          console.error('Error parsing credentials', error);
          throw new Error(Errors.INVALID_CREDENTIALS);
        }

        const { email, password, name, FCMToken } = data;

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
              FCMToken,
              session: nanoid(),
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
            FCMToken: user.FCMToken,
            session: user.session,
          };
        }

        // Return null if user data could not be retrieved
        return null;
      },
    }),
  ],
  events: {
    signIn: ({ user, account, isNewUser, profile }) => {
      console.log('signIn', { user, account, isNewUser, profile });

      if (user.FCMToken && user.role) {
        subscribeUser(user.role, user.FCMToken);
      }
    },
    signOut: async ({ token, session }) => {
      console.log('signOut', { token, session });

      if (!token.user) {
        return;
      }

      const user = token.user._id;

      if (token.user.FCMToken) {
        unsubscribeUser(token.user.role, token.user.FCMToken);
      }

      UserModel.findByIdAndUpdate(user, { session: '', FCMToken: '' });
    },
  },
  callbacks: {
    async session({ session, user, token }) {
      if (token.user) {
        try {
          const user = await UserModel.findById(session.user?._id);

          if (user?.compareSessions(session.user?.session)) {
            session.user = {
              ...token.user,
            };
          } else {
            if (user) {
              user.session = undefined;
              user.FCMToken = undefined;

              unsubscribeUser(user.role, user.FCMToken);
              user.save();
            }

            session.user = undefined;
            session.expires = new Date().toISOString();
          }
        } catch (error) {
          console.log(error);
          session.user = undefined;
          session.expires = new Date().toISOString();
        }
      } else {
        session.expires = new Date().toISOString();
        session.user = undefined;
      }

      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.user = {
          role: user.role || 'USER',
          _id: user._id || '',
          email: user.email || '',
          name: user.name || '',
          FCMToken: user.FCMToken || '',
          session: user.session || '',
        };
      } else {
        token.user = undefined;
      }

      return token;
    },
  },
});

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  return NextAuth(req, res, authOptions(req, res));
}

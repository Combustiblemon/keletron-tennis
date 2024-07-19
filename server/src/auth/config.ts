/* eslint-disable no-param-reassign */
import type { ExpressAuth, User } from '@auth/express';
import { getSession } from '@auth/express';
import Credentials from '@auth/express/providers/credentials';
import Google from '@auth/express/providers/google';
import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { z } from 'zod';

import { Errors, onError } from '@/server/src/lib/common';
import { subscribeUser, unsubscribeUser } from '@/server/src/lib/notifications';
import UserModel, { Users, UserSanitized } from '@/server/src/models/User';

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

export const getAuthConfig = async (
  req: Request,
  res: Response
): Promise<Parameters<typeof ExpressAuth>['0']> => ({
  session: {
    strategy: 'jwt',
  },
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    Credentials({
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

        console.log(FCMToken);

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
            const session = nanoid();

            user.session = session;

            if (FCMToken) {
              if (user.FCMTokens) {
                user.FCMTokens.push(FCMToken);
              } else {
                user.FCMTokens = [FCMToken];
              }
            }

            await user.save();

            return {
              name: user.name,
              email: user.email,
              role: user.role,
              _id: user._id as string,
              FCMTokens: user.FCMTokens,
              session,
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
    Credentials({
      id: 'register',
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
        name: { type: 'text' },
        FCMTokens: { type: 'text' },
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
        const session = nanoid();

        try {
          user = (
            await UserModel.create({
              name,
              email,
              password,
              role: 'USER',
              FCMTokens: [FCMToken],
              session,
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
            FCMTokens: user.FCMTokens,
            session,
          };
        }

        // Return null if user data could not be retrieved
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/auth?type=login',
    signOut: '/',
    // error: '/auth/error', // Error code passed in query string as ?error=
    // verifyRequest: '/auth/verify-request', // (used for check email message)
    // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out if not of interest)
  },
  events: {
    signIn: ({ user }) => {
      console.log('signIn event');

      if (user.FCMTokens && user.role && user.FCMTokens.length) {
        subscribeUser(user.role, user.FCMTokens);
      }
    },
    signOut: async (event) => {
      console.log('signOut event');
      // Delete auth cookie on signout so it doesn't persist past log out
      res.setHeader('Set-Cookie', '');

      let token = 'token' in event ? event?.token : event.session;

      if (!token) {
        return;
      }

      if (!token.user) {
        token = {};
        session = {};

        return;
      }

      const { FCMTokens, _id, role } = token.user;

      token = {};
      session = {};

      if (FCMTokens && FCMTokens.length) {
        unsubscribeUser(role, FCMTokens);
      }

      UserModel.findByIdAndUpdate(_id, { session: '', FCMToken: '' });
    },
  },
  callbacks: {
    async session({ session, token }) {
      if (token.user) {
        try {
          const dbUser = await UserModel.findById(token.user?._id);

          if (dbUser?.compareSessions(token.user?.session)) {
            session.user = {
              ...token.user,
            };

            return session;
          }

          if (dbUser) {
            dbUser.session = undefined;
            dbUser.FCMTokens = undefined;

            unsubscribeUser(dbUser.role, dbUser.FCMTokens);
            dbUser.save();
          }
        } catch (error) {
          console.log(error);
        }
      }

      token = {};
      session = {};

      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.user = {
          role: user.role || 'USER',
          _id: user._id || '',
          email: user.email || '',
          name: user.name || '',
          FCMTokens: user.FCMTokens || [],
          session: user.session || '',
        };
      } else if (token.user?._id && token.user?.session) {
        const dbUser = await UserModel.findById(token.user._id);

        if (!dbUser?.compareSessions(token.user?.session)) {
          console.log('undefining token user');
          token.user = undefined;
        }
      }

      return token;
    },
  },
});

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

export const authUserHelpers = async (req: Request, res: Response) => {
  const authOpts = await getAuthConfig(req, res);
  const session = await getSession(req, authOpts);

  const isLoggedIn = !!session && !!session?.user;
  return {
    isLoggedIn,
    isAdmin: isLoggedIn && session?.user?.role === 'ADMIN',
    isUser: isLoggedIn && session?.user?.role === 'USER',
    user: isLoggedIn ? session.user : undefined,
  } as AuthUserHelpersReturnType;
};

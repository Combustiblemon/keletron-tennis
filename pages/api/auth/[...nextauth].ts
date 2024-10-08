/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { nanoid } from 'nanoid';
import type { NextApiRequest, NextApiResponse } from 'next';
import NextAuth, { AuthOptions, getServerSession, User } from 'next-auth';
import { decode, encode } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { z } from 'zod';

import { Errors, onError } from '@/lib/api/common';
import dbConnect from '@/lib/api/dbConnect';
import { subscribeUser, unsubscribeUser } from '@/lib/api/notifications';
import UserModel, { Users, UserSanitized } from '@/models/User';

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
      async profile(profile, tokens) {
        let user = await UserModel.findOne({
          email: { $regex: new RegExp(`^${profile.email}`, 'i') },
        });

        const session = nanoid();

        if (user) {
          user.session = session;
          user.save();
        } else {
          user = await UserModel.create({
            name: profile.name,
            email: profile.email,
            password: '',
            role: 'USER',
            FCMTokens: [],
            session,
            accountType: 'GOOGLE',
          });
        }

        return {
          ...profile,
          id: profile.sub,
          user: {
            _id: user._id?.toString() || '',
            email: user.email,
            FCMToken: '',
            name: user.name,
            role: user.role,
            session,
          },
        };
      },
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
          // eslint-disable-next-line no-console
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
          // eslint-disable-next-line no-console
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

        // eslint-disable-next-line no-console
        console.log('User logged in', user.email);

        // If no error and we have user data, return it
        if (user) {
          try {
            const session = nanoid();

            user.session = session;

            if (FCMToken && FCMToken !== 'undefined') {
              if (user.FCMTokens) {
                user.FCMTokens.push(FCMToken);
                user.FCMTokens = Array.from(new Set(user.FCMTokens));
              } else {
                user.FCMTokens = [FCMToken];
              }
            }

            if (FCMToken) {
              subscribeUser(user.role, [FCMToken]);
            }

            await user.save();

            return {
              name: user.name,
              email: user.email,
              role: user.role,
              _id: user._id as string,
              FCMToken: FCMToken || '',
              session,
            };
          } catch (err) {
            // eslint-disable-next-line no-console
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
        FCMTokens: { type: 'text' },
      },
      type: 'credentials',
      async authorize(credentials) {
        let data: z.infer<typeof registerValidator>;

        try {
          data = registerValidator.parse(credentials);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error parsing credentials', error);
          throw new Error(Errors.INVALID_CREDENTIALS);
        }

        const { email, password, name, FCMToken } = data;

        let userExists: boolean;

        try {
          userExists = Boolean(await UserModel.exists({ email }));
        } catch (error) {
          // eslint-disable-next-line no-console
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
              accountType: 'PASSWORD',
            })
          ).sanitize();
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error creating user', error);

          res
            .status(500)
            .json(onError(new Error(Errors.INTERNAL_SERVER_ERROR), 'register'));
          return null;
        }
        // eslint-disable-next-line no-console
        console.log('User created', user.email);

        // If no error and we have user data, return it
        if (user) {
          if (FCMToken) {
            subscribeUser(user.role, [FCMToken]);
          }

          return {
            name: user.name,
            email: user.email,
            role: user.role,
            _id: user._id as string,
            FCMToken: FCMToken || '',
            session,
          };
        }

        // Return null if user data could not be retrieved
        return null;
      },
    }),
  ],
  events: {
    signIn: ({ user }) => {
      if (user.FCMToken && user.role) {
        subscribeUser(user.role, [user.FCMToken]);
      }
    },
    signOut: async ({ token, session }) => {
      // Delete auth cookie on signout so it doesn't persist past log out
      res.setHeader('Set-Cookie', '');

      // Set token/session to {}, that would update the cilentside token/session as well

      if (!token.user) {
        token = {};
        session = {};

        return;
      }

      const { FCMToken, _id, role } = token.user;

      token = {};
      session = {};

      if (FCMToken) {
        unsubscribeUser(role, [FCMToken]);
      }

      if (_id) {
        await UserModel.findByIdAndUpdate(_id, { session: '', FCMToken: '' });
      }
    },
  },
  callbacks: {
    async session({ session, token }) {
      if (token.user) {
        try {
          const dbUser = token.user?._id
            ? await UserModel.findById(token.user?._id)
            : undefined;

          if (dbUser?.compareSessions(token.user?.session)) {
            session.user = {
              ...token.user,
            };

            return session;
          }

          if (dbUser) {
            if (dbUser.FCMTokens) {
              unsubscribeUser(dbUser.role, dbUser.FCMTokens);
            }

            dbUser.session = undefined;
            dbUser.FCMTokens = undefined;

            dbUser.save();
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(error);
        }
      }

      token = {};
      session = {};

      return session;
    },
    async jwt({ token, user: adapterUser, trigger }) {
      const user =
        (adapterUser as unknown as { user: typeof adapterUser })?.user ||
        adapterUser;

      if (user) {
        token.user = {
          role: user.role || 'USER',
          _id: user._id || '',
          email: user.email || '',
          name: user.name || '',
          FCMToken: user.FCMToken || '',
          session: user.session || '',
        };

        return token;
      }

      if (token.user?._id && token.user?.session) {
        const dbUser = await UserModel.findById(token.user._id);

        if (!dbUser) {
          // eslint-disable-next-line no-console
          console.log('undefining token user (no user found)');
          token.user = undefined;
          return token;
        }

        if (
          dbUser?.accountType === 'PASSWORD' &&
          !dbUser?.compareSessions(token.user?.session)
        ) {
          // eslint-disable-next-line no-console
          console.log('undefining token user (passwords don"t match)');
          token.user = undefined;
          return token;
        }

        if (!dbUser?.compareSessions(token.user?.session)) {
          // eslint-disable-next-line no-console
          console.log('undefining token user (sessions don"t match)');
          token.user = undefined;
          return token;
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

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  return NextAuth(req, res, authOptions(req, res));
}

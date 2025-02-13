/* eslint-disable no-param-reassign */
/* eslint-disable func-names */
import bcrypt from 'bcryptjs';
import mongoose, { Model } from 'mongoose';
import z from 'zod';

import { Language } from '@/context/LanguageContext';

export const UserValidator = z.object({
  firstname: z.string().max(60),
  lastname: z.string().max(60),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  accountType: z.enum(['GOOGLE', 'PASSWORD']).optional(),
});

type SanitizedUserFields =
  | 'firstname'
  | 'lastname'
  | 'email'
  | 'role'
  | '_id'
  | 'FCMTokens'
  | 'session'
  | 'language';

export type UserDataType = z.infer<typeof UserValidator>;

export type User = mongoose.Document &
  z.infer<typeof UserValidator> & {
    resetKey?: {
      value: string;
      expiresAt: Date;
    };
    FCMTokens?: Array<string>;
    session?: string;
    language: Language;
    comparePasswords: (candidatePassword?: string) => boolean;
    compareResetKey: (resetKey?: string) => boolean;
    compareSessions: (session?: string) => boolean;
    sanitize: () => Pick<User, SanitizedUserFields>;
    _id: string;
  };

export type UserType = Pick<User, SanitizedUserFields>;

export const UserSchema = new mongoose.Schema<User>({
  role: {
    type: String,
    enum: ['ADMIN', 'USER'],
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Please add a User email'],
    validate: {
      validator(v: string) {
        // check if email is valid
        // eslint-disable-next-line no-useless-escape
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid email!`,
    },
  },
  password: {
    type: String,
  },
  resetKey: {
    _id: false,
    value: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
  },
  FCMTokens: {
    type: [String],
  },
  session: {
    type: String,
  },
  accountType: {
    type: String,
    enum: ['GOOGLE', 'PASSWORD'],
  },
});

UserSchema.methods.comparePasswords = function (candidatePassword?: string) {
  const user = this as User;

  if (!candidatePassword || !user.password) {
    return false;
  }

  return bcrypt.compareSync(candidatePassword, user.password);
};

UserSchema.methods.compareResetKey = function (resetKey?: string) {
  if (!resetKey) {
    return false;
  }

  const user = this as User;
  return (
    resetKey === user.resetKey?.value && new Date() < user.resetKey?.expiresAt
  );
};

UserSchema.methods.compareSessions = function (session?: string) {
  if (!session) {
    return false;
  }

  return bcrypt.compareSync(session, (this as User).session || '');
};

export type UserSanitized = Pick<User, SanitizedUserFields>;

UserSchema.methods.sanitize = function (): UserSanitized {
  return (this as User).toObject({
    transform: (doc, ret) =>
      ({
        email: ret.email,
        role: ret.role,
        _id: ret._id,
        FCMTokens: ret.FCMToken,
        session: ret.session,
        language: ret.language || 'el',
      }) as UserSanitized,
  });
};

UserSchema.pre<User>('save', function (next) {
  if (this.isModified('password') && this.password) {
    this.password = bcrypt.hashSync(this.password, 10);
  }

  if (this.isModified('session') && this.session) {
    this.session = bcrypt.hashSync(this.session, 10);
  }

  next();
});

export default (mongoose.models.User as Model<User>) ||
  mongoose.model<User>('User', UserSchema);

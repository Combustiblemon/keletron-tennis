/* eslint-disable no-param-reassign */
/* eslint-disable func-names */
import bcrypt from 'bcryptjs';
import mongoose, { Model } from 'mongoose';
import z from 'zod';

export const UserValidator = z.object({
  name: z.string().max(60),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
  email: z.string().email(),
  password: z.string().min(6),
});

export type Users = mongoose.Document &
  z.infer<typeof UserValidator> & {
    resetKey?: {
      value: string;
      expiresAt: Date;
    };
    comparePasswords: (candidatePassword: string) => boolean;
    compareResetKey: (resetKey: string) => boolean;
    sanitize: () => Omit<Users, 'password' | 'resetKey'>;
  };

export const UserSchema = new mongoose.Schema<Users>({
  name: {
    type: String,
    maxlength: [60, 'User name cannot be more than 60 characters'],
    required: [true, 'Please add a User name'],
  },
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
    required: [true, 'Please add a User password'],
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
});

UserSchema.methods.comparePasswords = function (candidatePassword: string) {
  const user = this as Users;
  return bcrypt.compareSync(candidatePassword, user.password);
};

UserSchema.methods.compareResetKey = function (resetKey: string) {
  const user = this as Users;

  return (
    resetKey === user.resetKey?.value && new Date() < user.resetKey?.expiresAt
  );
};

export type UserSanitized = Omit<Users, 'password' | 'resetKey'>;

UserSchema.methods.sanitize = function (): UserSanitized {
  const user = (this as Users).toObject<Users>({
    transform: (doc, ret) => {
      delete ret.password;
      delete ret.resetKey;
      return ret;
    },
  });

  return user;
};

UserSchema.pre<Users>('save', function (next) {
  if (!this.isModified('password')) {
    next();
  }

  this.password = bcrypt.hashSync(this.password, 10);
  next();
});

export default (mongoose.models.User as Model<Users>) ||
  mongoose.model<Users>('User', UserSchema);

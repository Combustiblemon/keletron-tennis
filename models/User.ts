import mongoose from 'mongoose';
import z from 'zod';

export const UserValidator = z.object({
  name: z.string().max(60),
  type: z.enum(['ADMIN', 'USER']),
  email: z.string().email(),
  password: z.string().min(6),
});

export type Users = mongoose.Document & z.infer<typeof UserValidator>;

export const UserSchema = new mongoose.Schema<Users>({
  name: {
    type: String,
    maxlength: [60, 'User name cannot be more than 60 characters'],
  },
  type: {
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
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
});

export default mongoose.models.User ||
  mongoose.model<Users>('User', UserSchema);

import z from 'zod';

export const UserValidator = z.object({
  _id: z.string().optional(),
  name: z.string().max(60),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
  email: z.string().email(),
  accountType: z.enum(['GOOGLE', 'PASSWORD']).optional(),
  language: z.enum(['GR', 'EN']).default('EN'),
});

export type UserType = z.infer<typeof UserValidator>;

export const UserValidatorPartial = UserValidator.partial();

export type UserTypePartial = z.infer<typeof UserValidatorPartial>;

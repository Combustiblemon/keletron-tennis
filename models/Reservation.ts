import z from 'zod';

const statusEnumValues = ['PENDING', 'APPROVED', 'REJECTED'] as const;
const typeEnumValues = ['SINGLE', 'DOUBLE', 'TRAINING', 'PERSONAL'] as const;

export const ReservationValidator = z.object({
  _id: z.string().optional(),
  type: z.enum(typeEnumValues),
  datetime: z.string(),
  people: z.array(z.string().max(50)),
  owner: z.string().optional(),
  court: z.string(),
  status: z.enum(statusEnumValues).default('APPROVED'),
  paid: z.boolean().default(false),
  duration: z.number().positive().optional().default(90),
  notes: z.string().max(500).optional(),
});

export type ReservationType = z.infer<typeof ReservationValidator>;

export const ReservationValidatorPartial = ReservationValidator.partial();

export type ReservationTypePartial = z.infer<
  typeof ReservationValidatorPartial
>;

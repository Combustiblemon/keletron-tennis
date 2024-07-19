import mongoose, { Model } from 'mongoose';
import z from 'zod';

export const ReservationValidator = z.object({
  type: z.enum(['SINGLE', 'DOUBLE', 'TRAINING']),
  datetime: z.string(),
  people: z.array(z.string().max(50)),
  owner: z.string().optional(),
  court: z.string(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('APPROVED'),
  paid: z.boolean().default(false),
  duration: z.number().positive().optional().default(90),
  notes: z.string().max(500).optional(),
});

export const ReservationValidatorPartial = ReservationValidator.deepPartial();

type ReservationSanitized = Pick<
  ReservationType,
  'type' | 'court' | 'datetime' | 'duration'
>;

export type ReservationType = mongoose.Document &
  z.infer<typeof ReservationValidator> & {
    sanitize: () => ReservationSanitized;
  };

export const ReservationSchema = new mongoose.Schema<ReservationType>({
  type: {
    type: String,
    enum: ['SINGLE', 'DOUBLE'],
  },
  datetime: {
    // !THIS IS NOT ISO DATE EVEN THOUGH IT IS IN THE SAME FORMAT
    type: String,
    required: [true, 'Please add a date and time'],
  },
  duration: {
    type: Number,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId as unknown as StringConstructor,
    ref: 'User',
  },
  court: {
    type: mongoose.Schema.Types.ObjectId as unknown as StringConstructor,
    ref: 'Court',
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
  },
  paid: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
  },
  people: [String],
});

ReservationSchema.methods.sanitize = function (): ReservationSanitized {
  return (this as ReservationType).toObject({
    transform: (doc, ret) =>
      ({
        court: ret.court,
        datetime: ret.datetime,
        duration: ret.duration,
        type: ret.type,
      }) satisfies ReservationSanitized,
  });
};

export default (mongoose.models.Reservation as Model<ReservationType>) ||
  mongoose.model<ReservationType>('Reservation', ReservationSchema);

import mongoose, { Model } from 'mongoose';
import z from 'zod';

export const ReservationValidator = z.object({
  type: z.enum(['SINGLE', 'DOUBLE']),
  datetime: z.date(),
  people: z.array(z.string()),
  owner: z.string(),
  court: z.string(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('APPROVED'),
  paid: z.boolean().default(false),
});

export const ReservationValidatorPartial = ReservationValidator.deepPartial();

export type Reservations = mongoose.Document &
  z.infer<typeof ReservationValidator>;

export const ReservationSchema = new mongoose.Schema<Reservations>({
  type: {
    type: String,
    enum: ['SINGLE', 'DOUBLE'],
  },
  datetime: {
    type: Date,
    required: [true, 'Please add a date and time'],
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
  people: [String],
});

export default (mongoose.models.Reservation as Model<Reservations>) ||
  mongoose.model<Reservations>('Reservation', ReservationSchema);

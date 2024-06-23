import mongoose from 'mongoose';
import z from 'zod';

export const CourtValidator = z.object({
  name: z.string().max(60),
  type: z.enum(['ASPHALT', 'HARD']),
  reservationsInfo: z.object({
    startTime: z.string(),
    endTime: z.string(),
    reservedTimes: z.array(
      z.object({
        startTime: z.string(),
        endTime: z.string(),
        reason: z.string(),
      })
    ),
    duration: z.number(),
  }),
});

export const CourtValidatorPartial = CourtValidator.deepPartial();

export type Courts = mongoose.Document & z.infer<typeof CourtValidator>;

export const CourtSchema = new mongoose.Schema<Courts>({
  name: {
    type: String,
    maxlength: [60, 'Court name cannot be more than 60 characters'],
  },
  type: {
    type: String,
    enum: ['ASPHALT', 'HARD'],
  },
  reservationsInfo: {
    _id: false,
    startTime: {
      type: String,
      required: [true, 'Please add a start time'],
    },
    endTime: {
      type: String,
      required: [true, 'Please add an end time'],
    },
    reservedTimes: [
      {
        _id: false,
        startTime: {
          type: String,
          required: [true, 'Please add a start time'],
        },
        endTime: {
          type: String,
          required: [true, 'Please add an end time'],
        },
        reason: {
          type: String,
          required: [true, 'Please add a reason'],
        },
      },
    ],
    duration: {
      type: Number,
      required: [true, 'Please add a duration in minutes'],
    },
  },
});

export default (mongoose.models.Court as mongoose.Model<Courts>) ||
  mongoose.model<Courts>('Court', CourtSchema);

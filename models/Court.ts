import z from 'zod';

import { weekDays } from '@/lib/common';

export const CourtValidator = z.object({
  _id: z.string().optional(),
  name: z.string().max(60),
  type: z.enum(['ASPHALT', 'HARD']),
  reservationsInfo: z.object({
    startTime: z.string(),
    endTime: z.string(),
    reservedTimes: z.array(
      z.object({
        startTime: z.string(),
        duration: z.number().positive().default(90),
        type: z.enum(['TRAINING', 'OTHER']),
        repeat: z.enum(['WEEKLY']).optional().default('WEEKLY'),
        days: z.array(z.enum(weekDays)).optional(),
        notes: z.string().max(200).optional(),
        datesNotApplied: z.array(z.string()).optional(),
      })
    ),
    duration: z.number(),
  }),
});

export type CourtType = z.infer<typeof CourtValidator>;

export const CourtValidatorPartial = CourtValidator.deepPartial();

export type CourtTypePartial = z.infer<typeof CourtValidatorPartial>;

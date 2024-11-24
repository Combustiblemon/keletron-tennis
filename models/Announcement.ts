import z from 'zod';

export const AnnouncementValidator = z.object({
  _id: z.string().optional(),
  title: z.string().max(160),
  body: z.string().max(600).optional(),
  validUntil: z.string(),
  visible: z.boolean().optional().default(true),
});

export type AnnouncementType = z.infer<typeof AnnouncementValidator>;

export const AnnouncementValidatorPartial = AnnouncementValidator.deepPartial();

export type AnnouncementTypePartial = z.infer<
  typeof AnnouncementValidatorPartial
>;

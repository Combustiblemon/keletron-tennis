/* eslint-disable consistent-return */
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { Errors, onError, onSuccess } from '@/lib/api/common';
import { sendMessageToTopic, Topics } from '@/lib/api/notifications';
import AnnouncementModel, {
  AnnouncementValidator,
} from '@/models/Announcement';

import dbConnect from '../../../../lib/api/dbConnect';
import { authUserHelpers } from '../../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  await dbConnect();

  const { isAdmin } = await authUserHelpers(req, res);

  if (!isAdmin) {
    return res
      .status(401)
      .json(onError(new Error(Errors.UNAUTHORIZED), 'admin/announcements'));
  }

  switch (method) {
    case 'GET':
      try {
        /* find all the data in our database */
        const announcements = await AnnouncementModel.find({}).lean();

        res
          .status(200)
          .json(onSuccess(announcements, 'admin/announcements', 'GET'));
      } catch (error) {
        res
          .status(400)
          .json(onError(error as Error, 'admin/announcements', 'GET'));
      }
      break;
    case 'POST':
      // create a new announcement
      try {
        let announcementData: z.infer<typeof AnnouncementValidator>;

        try {
          announcementData = AnnouncementValidator.parse(req.body);
        } catch (error) {
          return res
            .status(400)
            .json(onError(error as Error, 'admin/announcements', 'POST'));
        }

        const announcement = await AnnouncementModel.create(announcementData);

        sendMessageToTopic(Topics.User, {
          title: announcementData.title,
          body: announcementData.body || '',
        });

        return res
          .status(201)
          .json(onSuccess(announcement, 'admin/announcements', 'POST'));
      } catch (error) {
        return res
          .status(400)
          .json(onError(error as Error, 'admin/announcements', 'POST'));
      }
    default:
      return res
        .status(400)
        .json(onError(new Error('Invalid method'), 'admin/announcements'));
  }
}

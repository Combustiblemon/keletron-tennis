/* eslint-disable consistent-return */
import { NextApiRequest, NextApiResponse } from 'next';

import { onError, onSuccess } from '@/lib/api/common';
import AnnouncementModel from '@/models/Announcement';

import dbConnect from '../../../lib/api/dbConnect';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  await dbConnect();

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
    default:
      return res
        .status(400)
        .json(onError(new Error('Invalid method'), 'admin/announcements'));
  }
}

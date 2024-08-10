import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { Errors, onError, onSuccess } from '@/lib/api/common';
import AnnouncementModel, {
  AnnouncementValidatorPartial,
} from '@/models/Announcement';

import dbConnect from '../../../../lib/api/dbConnect';
import { authUserHelpers } from '../../auth/[...nextauth]';

// eslint-disable-next-line consistent-return
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    query: { id },
    method,
  } = req;

  await dbConnect();

  const { isAdmin } = await authUserHelpers(req, res);

  if (!isAdmin) {
    return res
      .status(401)
      .json(onError(new Error(Errors.UNAUTHORIZED), 'admin/announcements/id'));
  }

  switch (method) {
    case 'GET' /* Get a model by its ID */:
      try {
        const announcement = await AnnouncementModel.findById(id);

        if (!announcement) {
          return res
            .status(404)
            .json(
              onError(
                new Error(Errors.RESOURCE_NOT_FOUND),
                'admin/announcements/id',
                'GET'
              )
            );
        }

        res
          .status(200)
          .json(onSuccess(announcement, 'admin/announcements/id', 'GET'));
      } catch (error) {
        res
          .status(400)
          .json(onError(error as Error, 'admin/announcements/id', 'GET'));
      }
      break;

    case 'PUT' /* Edit a model by its ID */:
      try {
        let data: z.infer<typeof AnnouncementValidatorPartial>;

        try {
          data = AnnouncementValidatorPartial.parse(req.body);
        } catch (error) {
          return res
            .status(400)
            .json(onError(error as Error, 'admin/announcements/id', 'PUT'));
        }

        const announcement = await AnnouncementModel.findByIdAndUpdate(
          id,
          data,
          {
            new: true,
            runValidators: true,
          }
        );

        if (!announcement) {
          res
            .status(404)
            .json(
              onError(
                new Error('No announcement found'),
                'admin/announcements/id',
                'PUT'
              )
            );
        }

        res
          .status(200)
          .json(onSuccess(announcement, 'admin/announcements/id', 'PUT'));
      } catch (error) {
        res
          .status(400)
          .json(onError(error as Error, 'admin/announcements/id', 'PUT'));
      }
      break;

    case 'DELETE' /* Delete a model by its ID */:
      try {
        if (!id) {
          return res
            .status(404)
            .json(
              onError(new Error('No ID'), 'admin/announcements/id', 'DELETE')
            );
        }

        const deletedAnnouncement = await AnnouncementModel.deleteOne({
          _id: id,
        });

        if (!deletedAnnouncement) {
          return res
            .status(404)
            .json(
              onError(
                new Error('No announcement found'),
                'announcements/id',
                'DELETE'
              )
            );
        }

        res
          .status(200)
          .json(
            onSuccess(deletedAnnouncement, 'admin/announcements/id', 'DELETE')
          );
      } catch (error) {
        res
          .status(400)
          .json(onError(error as Error, 'admin/announcements/id', 'DELETE'));
      }
      break;

    default:
      return res
        .status(400)
        .json(onError(new Error('Invalid method'), 'admin/announcements/id'));
  }
}

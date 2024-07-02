/* eslint-disable consistent-return */
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { Errors, onError, onSuccess } from '@/lib/api/common';

import dbConnect from '../../../lib/api/dbConnect';
import UserModel from '../../../models/User';
import { authUserHelpers } from '../auth/[...nextauth]';
import User from '../../../models/User';

const validator = z.object({
  _id: z.string().length(24).optional(),
  FCMToken: z.string(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  await dbConnect();

  const {
    isLoggedIn,
    isAdmin,
    user: sessionUser,
  } = await authUserHelpers(req, res);

  switch (method) {
    case 'PUT':
      // create a new court
      try {
        if (!isLoggedIn) {
          return res
            .status(401)
            .json(
              onError(new Error(Errors.UNAUTHORIZED), 'notifications', 'PUT')
            );
        }

        let data: z.infer<typeof validator>;

        try {
          data = validator.parse(req.body);
        } catch (error) {
          return res
            .status(400)
            .json(onError(error as Error, 'notifications', 'PUT'));
        }

        const user = await UserModel.findByIdAndUpdate(
          data._id || sessionUser._id,
          {
            FCMToken: data.FCMToken,
          }
        );

        res.status(201).json(onSuccess(user?.sanitize, 'courts', 'PUT'));
      } catch (error) {
        res.status(400).json(onError(error as Error, 'notifications', 'PUT'));
      }
      break;
    default:
      return res
        .status(400)
        .json(onError(new Error('Invalid method'), 'notifications'));
  }
}

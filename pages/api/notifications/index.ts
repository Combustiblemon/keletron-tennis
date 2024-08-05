/* eslint-disable consistent-return */
import mongoose from 'mongoose';
import { NextApiRequest, NextApiResponse } from 'next';
import signale from 'signale';
import { z } from 'zod';

import { Errors, onError, onSuccess } from '@/lib/api/common';

import dbConnect from '../../../lib/api/dbConnect';
import UserModel from '../../../models/User';
import { authUserHelpers } from '../auth/[...nextauth]';

const validator = z.object({
  _id: z.string().length(24).optional(),
  token: z.string(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  await dbConnect();

  const {
    isLoggedIn,
    user: sessionUser,
    isAdmin,
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

        if (data._id && !isAdmin) {
          return res
            .status(401)
            .json(
              onError(new Error(Errors.UNAUTHORIZED), 'notifications', 'PUT')
            );
        }

        const user = await UserModel.findById(
          new mongoose.Types.ObjectId(data._id || sessionUser._id)
        );

        if (!user) {
          return;
        }

        if (data.token !== 'undefined') {
          if (user?.FCMTokens) {
            user.FCMTokens.push(data.token);
            user.FCMTokens = Array.from(new Set(user.FCMTokens));
          } else {
            user.FCMTokens = [data.token];
          }

          await user.save();

          signale.success(
            `token updated for user _id:${user._id} name: ${user.name}`
          );
        } else {
          signale.error('FCMToken is ivalid:', data);
        }

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

import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { Errors, onError, onSuccess } from '@/lib/api/common';
import UserModel from '@/models/User';

import dbConnect from '../../../lib/api/dbConnect';
import { authUserHelpers } from '../auth/[...nextauth]';

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

  const { isLoggedIn, user } = await authUserHelpers(req, res);

  switch (method) {
    case 'PUT' /* Get a model by its ID */:
      try {
        if (!isLoggedIn || (user.id && id !== user.id)) {
          return res
            .status(401)
            .json(onError(new Error(Errors.UNAUTHORIZED), 'user/id', 'PUT'));
        }

        let name: string;

        try {
          name = z.string().min(1).max(60).parse(req.body);
        } catch (error) {
          return res
            .status(400)
            .json(onError(error as Error, 'user/id', 'PUT'));
        }

        await UserModel.findByIdAndUpdate(id, { name });

        res.status(200).json(onSuccess({ _id: id, name }, 'user/id', 'PUT'));
      } catch (error) {
        res.status(400).json(onError(error as Error, 'user/id', 'PUT'));
      }
      break;
    default:
      return res
        .status(400)
        .json(onError(new Error('Invalid method'), 'user/id'));
  }
}

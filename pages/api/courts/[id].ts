import { NextApiRequest, NextApiResponse } from 'next';

import { Errors, onError, onSuccess } from '@/lib/api/common';

import dbConnect from '../../../lib/api/dbConnect';
import Court from '../../../models/Court';
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

  const { isLoggedIn } = await authUserHelpers(req, res);

  switch (method) {
    case 'GET' /* Get a model by its ID */:
      try {
        if (!isLoggedIn) {
          res
            .status(400)
            .json(onError(new Error(Errors.UNAUTHORIZED), 'courts/id', 'GET'));
        }

        const court = await Court.findById(id);

        if (!court) {
          return res
            .status(404)
            .json(
              onError(new Error(Errors.RESOURCE_NOT_FOUND), 'courts/id', 'GET')
            );
        }

        res.status(200).json(onSuccess(court, 'courts/id', 'GET'));
      } catch (error) {
        res.status(400).json(onError(error as Error, 'courts/id', 'GET'));
      }
      break;
    default:
      return res
        .status(400)
        .json(onError(new Error('Invalid method'), 'courts/id'));
  }
}

/* eslint-disable consistent-return */
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { Errors, onError, onSuccess } from '@/lib/api/common';

import dbConnect from '../../../../lib/api/dbConnect';
import Court, { CourtValidator } from '../../../../models/Court';
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
      .json(onError(new Error(Errors.UNAUTHORIZED), 'admin/courts'));
  }

  switch (method) {
    case 'GET':
      try {
        /* find all the data in our database */
        const courts = await Court.find({}).lean();

        res.status(200).json(onSuccess(courts, 'courts', 'GET'));
      } catch (error) {
        res.status(400).json(onError(error as Error, 'courts', 'GET'));
      }
      break;
    case 'POST':
      // create a new court
      try {
        let courtData: z.infer<typeof CourtValidator>;

        try {
          courtData = CourtValidator.parse(req.body);
        } catch (error) {
          return res
            .status(400)
            .json(onError(error as Error, 'courts', 'POST'));
        }

        const court = await Court.create(courtData);

        res.status(201).json(onSuccess(court, 'courts', 'POST'));
      } catch (error) {
        res.status(400).json(onError(error as Error, 'courts', 'POST'));
      }
      break;
    default:
      return res
        .status(400)
        .json(onError(new Error('Invalid method'), 'courts'));
  }
}

/* eslint-disable consistent-return */
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { onError, onSuccess } from '@/lib/api/common';

import dbConnect from '../../../lib/api/dbConnect';
import { authUserHelpers } from '../auth/nextauth';
import Court, { CourtValidator } from '../models/Court';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  await dbConnect();

  const { isAdmin } = await authUserHelpers(req, res);

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
        if (!isAdmin) {
          return res.status(401).json({ success: false });
        }

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

/* eslint-disable consistent-return */
import { NextApiRequest, NextApiResponse } from 'next';

import { onError, onSuccess } from '@/lib/api/common';

import dbConnect from '../../../lib/api/dbConnect';
import Court from '../../../models/Court';

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
        const courts = await Court.find({}).lean();

        res.status(200).json(onSuccess(courts, 'courts', 'GET'));
      } catch (error) {
        res.status(400).json(onError(error as Error, 'courts', 'GET'));
      }
      break;
    default:
      return res
        .status(400)
        .json(onError(new Error('Invalid method'), 'courts'));
  }
}

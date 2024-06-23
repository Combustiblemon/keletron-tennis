/* eslint-disable consistent-return */
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { onError, onSuccess } from '@/lib/api/common';
import { getUser, isAdmin, isLoggedIn } from '@/lib/api/utils';
import Court from '@/models/Court';

import dbConnect from '../../../lib/api/dbConnect';
import Reservation, { ReservationValidator } from '../../../models/Reservation';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        if (!isAdmin()) {
          return res
            .status(401)
            .json(onError(new Error('Unauthorized'), 'reservations', 'GET'));
        }

        /* find all the data in our database */
        const reservations = await Reservation.find({}).lean();

        res.status(200).json(onSuccess(reservations, 'reservations', 'GET'));
      } catch (error) {
        res.status(400).json(onError(error as Error, 'reservations', 'GET'));
      }
      break;
    case 'POST':
      // create a new court
      try {
        if (!isLoggedIn()) {
          return res
            .status(401)
            .json(onError(new Error('Unauthorized'), 'reservations', 'POST'));
        }

        const validator = ReservationValidator.pick({
          type: true,
          court: true,
          datetime: true,
          people: true,
          ...(isAdmin() ? { owner: true } : {}),
        });

        let data: z.infer<typeof validator>;

        try {
          data = validator.parse(req.body);
        } catch (error) {
          return res
            .status(400)
            .json(onError(error as Error, 'reservations', 'POST'));
        }

        if (!(await Court.exists({ _id: data.court }))) {
          return res
            .status(404)
            .json(
              onError(
                new Error('Court does not exist'),
                'reservations',
                'POST',
                { _id: data.court }
              )
            );
        }

        const reservation = await Reservation.create(data);

        res.status(201).json(onSuccess(reservation, 'reservations', 'POST'));
      } catch (error) {
        res.status(400).json(onError(error as Error, 'reservations', 'POST'));
      }
      break;

    case 'DELETE':
      try {
        if (!isLoggedIn()) {
          return res
            .status(401)
            .json(onError(new Error('Unauthorized'), 'reservations', 'DELETE'));
        }

        const user = getUser();

        const { ids } = req.body;

        if (!ids || !Array.isArray(ids)) {
          return res
            .status(400)
            .json(
              onError(
                new Error('Please provide an array of reservation IDs'),
                'reservations',
                'DELETE'
              )
            );
        }

        if (ids.length === 0) {
          return res.status(200).json(onSuccess([], 'reservations', 'DELETE'));
        }

        const reservations = await Reservation.find({
          _id: { $in: ids },
          ...(isAdmin() ? {} : { owner: user.id }),
        });

        for (let i = 0; i < reservations.length; i += 1) {
          const reservation = reservations[i];

          if (!isAdmin() && reservation.owner !== user.id) {
            return res
              .status(401)
              .json(
                onError(new Error('Unauthorized'), 'reservations', 'DELETE')
              );
          }
        }

        const deletedCount = await Reservation.deleteMany({
          _id: { $in: reservations.map((r) => r._id) },
        });

        res.status(200).json(onSuccess(deletedCount, 'reservations', 'DELETE'));
      } catch (error) {
        res.status(400).json(onError(error as Error, 'reservations', 'DELETE'));
      }

      break;
    default:
      return res
        .status(400)
        .json(onError(new Error('Invalid method'), 'reservations'));
  }
}

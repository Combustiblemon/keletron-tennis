import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { Errors, onError, onSuccess } from '@/lib/api/common';

import dbConnect from '../../../lib/api/dbConnect';
import { authUserHelpers } from '../auth/nextauth';
import Reservation, {
  ReservationValidatorPartial,
} from '../models/Reservation';

// eslint-disable-next-line consistent-return
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const {
    query: { id },
    method,
  } = req;

  await dbConnect();

  const { user, isAdmin, isLoggedIn } = await authUserHelpers(req, res);

  switch (method) {
    case 'GET' /* Get a model by its ID */:
      try {
        if (!isLoggedIn) {
          return res
            .status(401)
            .json(
              onError(new Error(Errors.UNAUTHORIZED), 'reservations/id', 'GET')
            );
        }

        const ids = (id as string).split(',');

        if (!ids.length) {
          return res.status(200).json(onSuccess([], 'reservations/id', 'GET'));
        }

        const reservations = await Reservation.find({
          id: { $in: ids },
        });

        if (reservations.length !== ids.length) {
          return res
            .status(404)
            .json(
              onError(
                new Error('No reservation found'),
                'reservations/id',
                'GET'
              )
            );
        }

        if (
          !isAdmin &&
          reservations.some(
            (reservation) =>
              reservation.owner !== user._id &&
              !reservation.people.includes(user._id || '')
          )
        ) {
          return res
            .status(401)
            .json(onError(new Error('Unauthorized'), 'reservations/id', 'GET'));
        }

        res.status(200).json(onSuccess(reservations, 'reservations/id', 'GET'));
      } catch (error) {
        res.status(400).json(onError(error as Error, 'reservations/id', 'GET'));
      }
      break;

    case 'PUT' /* Edit a model by its ID */:
      try {
        if (!isLoggedIn) {
          return res
            .status(401)
            .json(onError(new Error('Unauthorized'), 'reservations/id', 'PUT'));
        }

        let data: z.infer<typeof ReservationValidatorPartial>;

        try {
          data = ReservationValidatorPartial.parse(req.body);
        } catch (error) {
          return res
            .status(400)
            .json(onError(error as Error, 'reservations/id', 'PUT'));
        }

        const reservation = await Reservation.findOne({ _id: id });

        if (!reservation) {
          return res
            .status(404)
            .json(
              onError(
                new Error('No reservation found'),
                'reservations/id',
                'PUT',
                { _id: id }
              )
            );
        }

        if (reservation.owner !== user.id && isAdmin) {
          return res
            .status(401)
            .json(onError(new Error('Unauthorized'), 'reservations/id', 'PUT'));
        }

        // TODO: send notification to the admins if the reservation is edited

        reservation.set(data);

        await reservation.save();

        res.status(200).json(onSuccess(reservation, 'reservations/id', 'PUT'));
      } catch (error) {
        res.status(400).json(onError(error as Error, 'reservations/id', 'PUT'));
      }
      break;

    default:
      return res
        .status(400)
        .json(onError(new Error('Invalid method'), 'reservations/id'));
  }
}

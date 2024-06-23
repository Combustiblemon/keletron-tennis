import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { onError, onSuccess } from '@/lib/api/common';

import dbConnect from '../../../lib/api/dbConnect';
import { getUser, isAdmin, isLoggedIn } from '../../../lib/api/utils';
import Reservation, {
  ReservationValidatorPartial,
} from '../../../models/Reservation';

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

  switch (method) {
    case 'GET' /* Get a model by its ID */:
      try {
        if (!isLoggedIn()) {
          return res
            .status(401)
            .json(onError(new Error('Unauthorized'), 'reservations/id', 'GET'));
        }

        const user = getUser();

        const reservation = await Reservation.findById(id);

        if (!reservation) {
          return res
            .status(404)
            .json(
              onError(
                new Error('No resrvation found'),
                'reservations/id',
                'GET'
              )
            );
        }

        if (
          reservation.owner !== user.id &&
          !reservation.people.includes(user.id) &&
          !isAdmin()
        ) {
          return res
            .status(401)
            .json(onError(new Error('Unauthorized'), 'reservations/id', 'GET'));
        }

        res.status(200).json(onSuccess(reservation, 'reservations/id', 'GET'));
      } catch (error) {
        res.status(400).json(onError(error as Error, 'reservations/id', 'GET'));
      }
      break;

    case 'PUT' /* Edit a model by its ID */:
      try {
        if (!isLoggedIn()) {
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

        if (reservation.owner !== getUser().id && !isAdmin()) {
          return res
            .status(401)
            .json(onError(new Error('Unauthorized'), 'reservations/id', 'PUT'));
        }

        reservation.set(data);

        await reservation.save();

        res.status(200).json(onSuccess(reservation, 'reservations/id', 'PUT'));
      } catch (error) {
        res.status(400).json(onError(error as Error, 'reservations/id', 'PUT'));
      }
      break;

    case 'DELETE' /* Delete a model by its ID */:
      try {
        if (!isLoggedIn()) {
          return res
            .status(401)
            .json(
              onError(new Error('Unauthorized'), 'reservations/id', 'DELETE')
            );
        }

        if (!id) {
          return res
            .status(404)
            .json(onError(new Error('No ID'), 'reservations/id', 'DELETE'));
        }

        const reservation = await Reservation.findOne({ _id: id });

        if (!reservation) {
          return res
            .status(404)
            .json(
              onError(
                new Error('No reservation found'),
                'reservations/id',
                'DELETE'
              )
            );
        }

        if (reservation.owner !== getUser().id && !isAdmin()) {
          return res
            .status(401)
            .json(
              onError(new Error('Unauthorized'), 'reservations/id', 'DELETE')
            );
        }

        await reservation.deleteOne();

        res
          .status(200)
          .json(onSuccess(reservation, 'reservations/id', 'DELETE'));
      } catch (error) {
        res
          .status(400)
          .json(onError(error as Error, 'reservations/id', 'DELETE'));
      }
      break;

    default:
      return res
        .status(400)
        .json(onError(new Error('Invalid method'), 'reservations/id'));
  }
}

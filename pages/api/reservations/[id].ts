import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { Errors, onError, onSuccess } from '@/lib/api/common';
import { sendMessageToTopic, Topics } from '@/lib/api/notifications';
import { isReservationTimeFree } from '@/lib/common';
import CourtModel from '@/models/Court';

import dbConnect from '../../../lib/api/dbConnect';
import ReservationModel, {
  ReservationValidatorPartial,
} from '../../../models/Reservation';
import { authUserHelpers } from '../auth/[...nextauth]';

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

        const ids = Array.isArray(id) ? id : id?.split(',');

        if (!ids || !ids.length) {
          return res.status(200).json(onSuccess([], 'reservations/id', 'GET'));
        }

        const reservations = await ReservationModel.find({
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

        const reservation = await ReservationModel.findOne({ _id: id });
        const court = await CourtModel.findOne({ _id: reservation?.court });

        if (!court) {
          return res.status(404).json(
            onError(new Error('No court found'), 'reservations/id', 'PUT', {
              _id: id,
            })
          );
        }

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

        if (reservation.owner !== user.id && !isAdmin) {
          return res
            .status(401)
            .json(onError(new Error('Unauthorized'), 'reservations/id', 'PUT'));
        }

        // check if the new reservation conflicts with an existing one
        if (data.datetime || data.duration) {
          const courtReservations = await ReservationModel.find({
            datetime: {
              $regex: `^${(data.datetime || reservation.datetime).split('T')[0]}`,
            },
            court: reservation.court,
          });

          if (
            !isReservationTimeFree(
              courtReservations,
              data.datetime || reservation.datetime,
              data.duration || reservation.duration
            )
          ) {
            return res.status(400).json(
              onError(new Error('time_conflict'), 'reservations', 'POST', {
                _id: data.court,
              })
            );
          }
        }

        reservation.set(data);

        sendMessageToTopic(Topics.Admin, {
          title: 'Αλλαγή κράτησης',
          body: `${reservation.datetime.split('T')[0]} - ${reservation.datetime.split('T')[1]}\nΓήπεδο: ${court.name}\nΌνομα: ${user.name || ''}`,
        });

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

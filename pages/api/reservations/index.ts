/* eslint-disable consistent-return */
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { Errors, onError, onSuccess } from '@/lib/api/common';
import Court from '@/models/Court';

import dbConnect from '../../../lib/api/dbConnect';
import Reservation, { ReservationValidator } from '../../../models/Reservation';
import signale from 'signale';
import { authUserHelpers } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    method,
    query: { date },
  } = req;

  await dbConnect();

  const { user, isAdmin, isLoggedIn } = await authUserHelpers(req, res);

  switch (method) {
    case 'GET':
      try {
        if (!isLoggedIn) {
          return res
            .status(401)
            .json(
              onError(new Error(Errors.UNAUTHORIZED), 'reservations', 'GET')
            );
        }

        let lookupDate: Date | undefined;
        let lookupDate2: Date | undefined;

        try {
          if (Array.isArray(date)) {
            lookupDate = new Date(z.date().parse(date[0]));
            lookupDate2 = new Date(z.date().parse(date[1]));
          } else {
            lookupDate = new Date(z.date().parse(date));
          }
        } catch {
          lookupDate = new Date();
        }

        let gtDate = new Date(lookupDate);
        gtDate.setHours(0, 0, 0, 0);

        let ltDate = new Date(lookupDate2 || lookupDate);
        ltDate.setHours(23, 59, 0, 0);

        /* find all the data in our database */
        const reservations = await Reservation.find({
          $and: [
            { datetime: { $gt: gtDate.toISOString() } },
            { datetime: { $lt: ltDate.toISOString() } },
          ],
          ...(user.role !== 'ADMIN' ? { owner: user._id } : {}),
        }).lean();

        res.status(200).json(onSuccess(reservations, 'reservations', 'GET'));
      } catch (error) {
        signale.error(error);
        res.status(400).json(onError(error as Error, 'reservations', 'GET'));
      }
      break;
    case 'POST':
      // create a new reservation
      try {
        if (!isLoggedIn) {
          return res
            .status(401)
            .json(
              onError(new Error(Errors.UNAUTHORIZED), 'reservations', 'POST')
            );
        }

        const validator = ReservationValidator.pick({
          type: true,
          court: true,
          datetime: true,
          people: true,
          duration: true,
          ...(isAdmin ? { owner: true } : {}),
        });

        let data: z.infer<typeof validator>;

        try {
          data = validator.parse(req.body);
        } catch (error) {
          return res
            .status(400)
            .json(onError(error as Error, 'reservations', 'POST'));
        }

        const court = await Court.findOne({ _id: data.court });

        if (!court) {
          return res
            .status(404)
            .json(
              onError(
                new Error(Errors.RESOURCE_NOT_FOUND),
                'reservations',
                'POST',
                { _id: data.court }
              )
            );
        }

        const courtReservations = await Reservation.find({
          datetime: { $regex: `^${data.datetime.substring(0, 10)}` },
          court: court._id,
        });

        const startTime = new Date(data.datetime);
        const endTime = new Date(data.datetime);
        endTime.setMinutes(endTime.getMinutes() + data.duration);

        // check if the new reservation conflicts with an existing one
        if (
          !courtReservations.every((res) => {
            const sTime = new Date(res.datetime);
            const eTime = new Date(res.datetime);
            eTime.setMinutes(eTime.getMinutes() + res.duration);

            let validDate = true;

            if (sTime < startTime && startTime < eTime) {
              validDate = false;
            }

            if (validDate && sTime < endTime && endTime < eTime) {
              validDate = false;
            }

            return validDate;
          })
        ) {
          return res.status(400).json(
            onError(new Error('time_conflict'), 'reservations', 'POST', {
              _id: data.court,
            })
          );
        }

        const reservation = await Reservation.create({
          ...data,
          owner: isAdmin ? data.owner : user._id,
        });

        // TODO: send notification to the admins

        res.status(201).json(onSuccess(reservation, 'reservations', 'POST'));
      } catch (error) {
        res.status(400).json(onError(error as Error, 'reservations', 'POST'));
      }
      break;

    case 'DELETE':
      try {
        if (!isLoggedIn) {
          return res
            .status(401)
            .json(
              onError(new Error(Errors.UNAUTHORIZED), 'reservations', 'DELETE')
            );
        }

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
          ...(isAdmin ? {} : { owner: user.id }),
        });

        for (let i = 0; i < reservations.length; i += 1) {
          const reservation = reservations[i];

          if (!isAdmin && reservation.owner !== user.id) {
            return res
              .status(401)
              .json(
                onError(
                  new Error(Errors.UNAUTHORIZED),
                  'reservations',
                  'DELETE'
                )
              );
          }

          if (new Date(reservation.datetime) < new Date()) {
            return res
              .status(400)
              .json(
                onError(
                  new Error('Cannot delete past reservations'),
                  'reservations',
                  'DELETE'
                )
              );
          }
        }

        const deletedCount = await Reservation.deleteMany({
          _id: { $in: reservations.map((r) => r._id) },
        });

        // TODO: send notification to the admins

        res.status(200).json(onSuccess(deletedCount, 'reservations', 'DELETE'));
      } catch (error) {
        res.status(400).json(onError(error as Error, 'reservations', 'DELETE'));
      }

      break;
    default:
      return res
        .status(400)
        .json(onError(new Error(Errors.INTERNAL_SERVER_ERROR), 'reservations'));
  }
}

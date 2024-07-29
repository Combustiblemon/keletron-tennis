/* eslint-disable consistent-return */
import { NextApiRequest, NextApiResponse } from 'next';
import signale from 'signale';
import { z } from 'zod';

import { Errors, onError, onSuccess } from '@/lib/api/common';
import { sendMessageToTopic, Topics } from '@/lib/api/notifications';
import { formatDate, isReservationTimeFree } from '@/lib/common';
import Court from '@/models/Court';

import dbConnect from '../../../../lib/api/dbConnect';
import ReservationModel, {
  ReservationValidator,
} from '../../../../models/Reservation';
import { authUserHelpers } from '../../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    method,
    query: { date, offset },
  } = req;

  await dbConnect();

  const { user, isAdmin, isLoggedIn } = await authUserHelpers(req, res);

  if (!isAdmin) {
    return res
      .status(401)
      .json(onError(new Error(Errors.UNAUTHORIZED), 'admin/courts/id'));
  }

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

        let lookupDate: string;
        let lookupDate2: string | undefined;

        try {
          if (date) {
            if (Array.isArray(date)) {
              [lookupDate, lookupDate2] = date;
            } else {
              lookupDate = date;
            }
          } else {
            lookupDate = formatDate(new Date());
          }
        } catch {
          lookupDate = formatDate(new Date());
        }

        const dateQuery = {
          $and: [
            {
              datetime: {
                $gt: `${lookupDate.split('T')[0]}T00:00`,
              },
            },
            {
              datetime: {
                $lt: `${(lookupDate2 || lookupDate).split('T')[0]}T23:59`,
              },
            },
          ],
        };

        const offsetNumber = Number(offset);

        if (offset && !isNaN(offsetNumber)) {
          const reservations = await ReservationModel.find({
            owner: user._id,
            ...(Array.isArray(date)
              ? dateQuery
              : {
                  datetime: {
                    $gte: formatDate(
                      new Date(new Date().getTime() - 20 * 60 * 1000)
                    ),
                  },
                }),
          })
            .sort({
              datetime: -1,
            })
            .skip(offsetNumber >= 0 ? offsetNumber : 0)
            .limit(10);

          return res
            .status(200)
            .json(onSuccess(reservations, 'reservations', 'GET'));
        }

        /* find all the data in our database */
        const reservationsData = await ReservationModel.find({
          ...(date ? dateQuery : {}),
        })
          .populate('owner', 'name email _id role')
          .populate('court')
          .lean();

        return res
          .status(200)
          .json(onSuccess(reservationsData, 'reservations', 'GET'));
      } catch (error) {
        signale.error(error);
        return res
          .status(400)
          .json(onError(error as Error, 'reservations', 'GET'));
      }
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
          owner: true,
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

        const courtReservations = await ReservationModel.find({
          datetime: { $regex: `^${data.datetime.split('T')[0]}` },
          court: court._id,
        });

        // check if the new reservation conflicts with an existing one
        if (
          !isReservationTimeFree(
            courtReservations,
            data.datetime,
            data.duration
          )
        ) {
          return res.status(400).json(
            onError(new Error('time_conflict'), 'reservations', 'POST', {
              _id: data.court,
            })
          );
        }

        const reservation = await ReservationModel.create({
          ...data,
          owner: data.owner,
        });

        sendMessageToTopic(Topics.Admin, {
          title: 'Νέα κράτηση',
          body: `${reservation.datetime.split('T')[0]} - ${reservation.datetime.split('T')[1]}\nΓήπεδο: ${court.name}\nΌνομα: ${user.name || ''}`,
        });

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

        const reservations = await ReservationModel.find({
          _id: { $in: ids },
          owner: user.id,
        });

        const deletedCount = await ReservationModel.deleteMany({
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

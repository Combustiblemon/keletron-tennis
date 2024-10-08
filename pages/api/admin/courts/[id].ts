import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { Errors, onError, onSuccess } from '@/lib/api/common';
import { formatDate } from '@/lib/common';

import dbConnect from '../../../../lib/api/dbConnect';
import Court, { CourtValidatorPartial } from '../../../../models/Court';
import { authUserHelpers } from '../../auth/[...nextauth]';

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

  const { isAdmin } = await authUserHelpers(req, res);

  if (!isAdmin) {
    return res
      .status(401)
      .json(onError(new Error(Errors.UNAUTHORIZED), 'admin/courts/id'));
  }

  switch (method) {
    case 'GET' /* Get a model by its ID */:
      try {
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

    case 'PUT' /* Edit a model by its ID */:
      try {
        let data: z.infer<typeof CourtValidatorPartial>;

        try {
          data = CourtValidatorPartial.parse(req.body);
        } catch (error) {
          return res
            .status(400)
            .json(onError(error as Error, 'courts/id', 'PUT'));
        }

        if (data.reservationsInfo?.reservedTimes?.length) {
          const today = formatDate(new Date()).split('T')[0];

          data.reservationsInfo.reservedTimes =
            data.reservationsInfo.reservedTimes.map((reser) => {
              if (reser.datesNotApplied) {
                // eslint-disable-next-line no-param-reassign
                reser.datesNotApplied = reser.datesNotApplied.filter(
                  (d) => d >= today
                );
              }

              return reser;
            });
        }

        const court = await Court.findByIdAndUpdate(id, data, {
          new: true,
          runValidators: true,
        });

        if (!court) {
          res
            .status(404)
            .json(onError(new Error('No court found'), 'courts/id', 'PUT'));
        }

        res.status(200).json(onSuccess(court, 'courts/id', 'PUT'));
      } catch (error) {
        res.status(400).json(onError(error as Error, 'courts/id', 'PUT'));
      }
      break;

    case 'DELETE' /* Delete a model by its ID */:
      try {
        if (!id) {
          return res
            .status(404)
            .json(onError(new Error('No ID'), 'courts/id', 'DELETE'));
        }

        const deletedCourt = await Court.deleteOne({ _id: id });

        if (!deletedCourt) {
          return res
            .status(404)
            .json(onError(new Error('No court found'), 'courts/id', 'DELETE'));
        }

        res.status(200).json(onSuccess(deletedCourt, 'courts/id', 'DELETE'));
      } catch (error) {
        res.status(400).json(onError(error as Error, 'courts/id', 'DELETE'));
      }
      break;

    default:
      return res
        .status(400)
        .json(onError(new Error('Invalid method'), 'courts/id'));
  }
}

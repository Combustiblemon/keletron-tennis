import { z } from 'zod';

import {
  CourtType,
  CourtValidator,
  CourtValidatorPartial,
} from '@/models/Court';
import {
  ReservationType,
  ReservationValidator,
  ReservationValidatorPartial,
} from '@/models/Reservation';

import { Errors, onError, onSuccess } from './common';
import { APIResponse } from './responseTypes';

const handleResponse = async <ReturnDataType, Endpoint extends string>(
  res: Response
): Promise<APIResponse<ReturnDataType, Endpoint> | undefined> => {
  try {
    if (!res.ok) {
      if (res.status === 401) {
        if (window) {
          window.location.pathname = '/';
        }

        return {
          success: false,
          errors: [{ message: Errors.UNAUTHORIZED }],
          endpoint: '' as Endpoint,
        };
      }

      const body = (await res.json()) as ReturnType<typeof onError>;

      return {
        ...body,
        endpoint: body.endpoint as Endpoint,
      };
    }

    return (await res.json()) as ReturnType<
      typeof onSuccess<ReturnDataType, Endpoint>
    > satisfies APIResponse<ReturnDataType, Endpoint>;
  } catch (err) {
    console.log(err);
  }

  return undefined;
};

const commonHeaders = {
  'Content-Type': 'application/json',
};

/**
 * Only for FE use, it uses react hooks under the hood
 */
export const endpoints = {
  courts: <IDString extends string | undefined>(id: IDString) => ({
    GET: async () =>
      handleResponse<
        IDString extends undefined ? Array<CourtType> : CourtType,
        `courts${IDString extends undefined ? '' : '/id'}`
      >(
        await fetch(`/api/courts${id ? `/${id}` : ''}`, {
          method: 'GET',
          headers: commonHeaders,
        })
      ),
    POST: async (body: z.infer<typeof CourtValidator>) =>
      handleResponse<
        CourtType,
        `courts${IDString extends undefined ? '' : '/id'}`
      >(
        await fetch('/api/courts', {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify(body),
        })
      ),
    PUT: async (body: z.infer<typeof CourtValidatorPartial>) =>
      handleResponse<
        CourtType,
        `courts${IDString extends undefined ? '' : '/id'}`
      >(
        await fetch(`/api/courts/${id ? `/${id}` : ''}`, {
          method: 'PUT',
          headers: commonHeaders,
          body: JSON.stringify(body),
        })
      ),
    DELETE: async (idToDelete: string) => {
      if (!idToDelete) {
        return null;
      }

      return handleResponse<CourtType, `courts/id`>(
        await fetch(`/api/courts/${idToDelete}`, {
          method: 'DELETE',
          headers: commonHeaders,
        })
      );
    },
  }),
  reservations: {
    GET: async <IDS extends Array<string> | undefined>(
      ids?: IDS,
      date?: string | [string, string],
      offset?: number
    ) => {
      let query: string = '';

      if (date) {
        if (Array.isArray(date)) {
          query += `date=${date[0]}&date=${date[1]}&`;
        } else {
          query += `date=${date}&`;
        }
      }

      if (typeof offset === 'number') {
        query += `offset=${offset >= 0 ? offset : 0}&`;
      }

      return handleResponse<Array<ReservationType>, `reservations`>(
        await fetch(
          `/api/reservations${ids ? `/${ids?.join(',')}` : ''}${query ? `?${query}` : ''}`,
          {
            method: 'GET',
            headers: commonHeaders,
          }
        )
      );
    },
    POST: async (
      body: Pick<
        z.infer<typeof ReservationValidator>,
        'court' | 'type' | 'datetime' | 'people'
      > & {
        owner?: string;
      }
    ) =>
      handleResponse<ReservationType, `reservations`>(
        await fetch('/api/reservations', {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify(body),
        })
      ),
    PUT: async (
      id: string,
      body: z.infer<typeof ReservationValidatorPartial>
    ) =>
      handleResponse<ReservationType, `reservations`>(
        await fetch(`/api/reservations/${id}`, {
          method: 'PUT',
          headers: commonHeaders,
          body: JSON.stringify(body),
        })
      ),
    DELETE: async (idsToDelete: Array<string>) => {
      if (!idsToDelete || !idsToDelete.length) {
        return null;
      }

      return handleResponse<Array<ReservationType>, `reservations`>(
        await fetch(`/api/reservations`, {
          method: 'DELETE',
          headers: commonHeaders,
          body: JSON.stringify({
            ids: idsToDelete,
          }),
        })
      );
    },
  },
  notifications: {
    PUT: async (token: string, userId?: string) =>
      handleResponse<ReservationType, `notifications`>(
        await fetch(`/api/notifications/`, {
          method: 'PUT',
          headers: commonHeaders,
          body: JSON.stringify({
            token,
            userId,
          }),
        })
      ),
  },
};

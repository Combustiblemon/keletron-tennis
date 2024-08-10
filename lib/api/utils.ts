import { z } from 'zod';

import { AnnouncementDataType } from '@/models/Announcement';
import {
  CourtDataType,
  CourtValidator,
  CourtValidatorPartial,
} from '@/models/Court';
import {
  ReservationDataType,
  ReservationValidator,
  ReservationValidatorPartial,
} from '@/models/Reservation';
import { UserDataType } from '@/models/User';

import { Errors, onError, onSuccess } from './common';
import { APIResponse } from './responseTypes';

const publicPages = ['/auth', '/'];

const handleResponse = async <ReturnDataType, Endpoint extends string>(
  res: Response
): Promise<APIResponse<ReturnDataType, Endpoint> | undefined> => {
  try {
    if (!res.ok) {
      if (res.status === 401) {
        if (window && !publicPages.includes(window.location.pathname)) {
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
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return undefined;
};

const commonHeaders = {
  'Content-Type': 'application/json',
};

export type AdminReservationDataType = ReservationDataType & {
  owner: UserDataType;
  court: CourtDataType;
};

/**
 * Only for FE use, it uses react hooks under the hood
 */
export const endpoints = {
  courts: <IDString extends string | undefined>(id?: IDString) => ({
    GET: async () =>
      handleResponse<
        IDString extends undefined ? Array<CourtDataType> : CourtDataType,
        `courts${IDString extends undefined ? '' : '/id'}`
      >(
        await fetch(`/api/courts${id ? `/${id}` : ''}`, {
          method: 'GET',
          headers: commonHeaders,
        })
      ),
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

      return handleResponse<Array<ReservationDataType>, `reservations`>(
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
      handleResponse<ReservationDataType, `reservations`>(
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
      handleResponse<ReservationDataType, `reservations`>(
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

      return handleResponse<Array<ReservationDataType>, `reservations`>(
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
      handleResponse<ReservationDataType, `notifications`>(
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
  admin: {
    announcements: {
      GET: async () =>
        handleResponse<Array<AnnouncementDataType>, `admin/announcements`>(
          await fetch(`/api/admin/announcements`, {
            method: 'GET',
            headers: commonHeaders,
          })
        ),
      POST: async (body: z.infer<typeof CourtValidator>) =>
        handleResponse<AnnouncementDataType, `admin/announcements`>(
          await fetch('/api/admin/announcements', {
            method: 'POST',
            headers: commonHeaders,
            body: JSON.stringify(body),
          })
        ),
      PUT: async (_id: string, body: z.infer<typeof CourtValidatorPartial>) =>
        handleResponse<AnnouncementDataType, `admin/announcements/id`>(
          await fetch(`/api/admin/announcements/${_id}`, {
            method: 'PUT',
            headers: commonHeaders,
            body: JSON.stringify(body),
          })
        ),
      DELETE: async (_id: string) => {
        if (!_id) {
          return null;
        }

        return handleResponse<AnnouncementDataType, `admin/announcements/id`>(
          await fetch(`/api/admin/announcements/${_id}`, {
            method: 'DELETE',
            headers: commonHeaders,
          })
        );
      },
    },
    courts: <IDString extends string | undefined>(id?: IDString) => ({
      GET: async () =>
        handleResponse<
          IDString extends undefined ? Array<CourtDataType> : CourtDataType,
          `courts${IDString extends undefined ? '' : '/id'}`
        >(
          await fetch(`/api/admin/courts${id ? `/${id}` : ''}`, {
            method: 'GET',
            headers: commonHeaders,
          })
        ),
      POST: async (body: z.infer<typeof CourtValidator>) =>
        handleResponse<
          CourtDataType,
          `courts${IDString extends undefined ? '' : '/id'}`
        >(
          await fetch('/api/admin/courts', {
            method: 'POST',
            headers: commonHeaders,
            body: JSON.stringify(body),
          })
        ),
      PUT: async (body: z.infer<typeof CourtValidatorPartial>) =>
        handleResponse<
          CourtDataType,
          `courts${IDString extends undefined ? '' : '/id'}`
        >(
          await fetch(`/api/admin/courts/${id ? `/${id}` : ''}`, {
            method: 'PUT',
            headers: commonHeaders,
            body: JSON.stringify(body),
          })
        ),
      DELETE: async (idToDelete: string) => {
        if (!idToDelete) {
          return null;
        }

        return handleResponse<CourtDataType, `courts/id`>(
          await fetch(`/api/admin/courts/${idToDelete}`, {
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

        return handleResponse<Array<AdminReservationDataType>, `reservations`>(
          await fetch(`/api/admin/reservations${query ? `?${query}` : ''}`, {
            method: 'GET',
            headers: commonHeaders,
          })
        );
      },
      POST: async (
        body: Pick<
          z.infer<typeof ReservationValidator>,
          'court' | 'type' | 'datetime' | 'people' | 'owner' | 'duration'
        >
      ) =>
        handleResponse<ReservationDataType, `reservations`>(
          await fetch('/api/admin/reservations', {
            method: 'POST',
            headers: commonHeaders,
            body: JSON.stringify(body),
          })
        ),
      // PUT: async (
      //   id: string,
      //   body: z.infer<typeof ReservationValidatorPartial>
      // ) =>
      //   handleResponse<ReservationDataType, `reservations`>(
      //     await fetch(`/api/admin/reservations/${id}`, {
      //       method: 'PUT',
      //       headers: commonHeaders,
      //       body: JSON.stringify(body),
      //     })
      //   ),
      DELETE: async (idsToDelete: Array<string>) => {
        if (!idsToDelete || !idsToDelete.length) {
          return null;
        }

        return handleResponse<Array<ReservationDataType>, `reservations`>(
          await fetch(`/api/admin/reservations`, {
            method: 'DELETE',
            headers: commonHeaders,
            body: JSON.stringify({
              ids: idsToDelete,
            }),
          })
        );
      },
    },
  },
  user: {
    PUT: async (_id: string, body: { name: string }) => {
      return handleResponse<Array<ReservationDataType>, `reservations`>(
        await fetch(`/api/user/${_id}`, {
          method: 'PUT',
          headers: commonHeaders,
          body: JSON.stringify(body),
        })
      );
    },
  },
};

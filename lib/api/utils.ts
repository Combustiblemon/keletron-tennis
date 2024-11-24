import { z } from 'zod';

import {
  AnnouncementType,
  AnnouncementValidator,
  AnnouncementValidatorPartial,
} from '@/models/Announcement';
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
import { UserType } from '@/models/User';

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

export type AdminReservationType = ReservationType & {
  owner: UserType;
  court: CourtType;
};

export const endpoints = {
  announcements: {
    GET: async () =>
      handleResponse<Array<AnnouncementType>, `announcements`>(
        await fetch(`/api/announcements`, {
          method: 'GET',
          headers: commonHeaders,
        })
      ),
  },
  courts: <IDString extends string | undefined>(id?: IDString) => ({
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
  admin: {
    announcements: {
      GET: async () =>
        handleResponse<Array<AnnouncementType>, `admin/announcements`>(
          await fetch(`/api/admin/announcements`, {
            method: 'GET',
            headers: commonHeaders,
          })
        ),
      POST: async (body: z.infer<typeof AnnouncementValidator>) =>
        handleResponse<AnnouncementType, `admin/announcements`>(
          await fetch('/api/admin/announcements', {
            method: 'POST',
            headers: commonHeaders,
            body: JSON.stringify(body),
          })
        ),
      PUT: async (
        _id: string,
        body: z.infer<typeof AnnouncementValidatorPartial>
      ) =>
        handleResponse<AnnouncementType, `admin/announcements/id`>(
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

        return handleResponse<AnnouncementType, `admin/announcements/id`>(
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
          IDString extends undefined ? Array<CourtType> : CourtType,
          `courts${IDString extends undefined ? '' : '/id'}`
        >(
          await fetch(`/api/admin/courts${id ? `/${id}` : ''}`, {
            method: 'GET',
            headers: commonHeaders,
          })
        ),
      POST: async (body: z.infer<typeof CourtValidator>) =>
        handleResponse<
          CourtType,
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
          CourtType,
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

        return handleResponse<CourtType, `courts/id`>(
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

        return handleResponse<Array<AdminReservationType>, `reservations`>(
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
        handleResponse<ReservationType, `reservations`>(
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
      //   handleResponse<ReservationType, `reservations`>(
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

        return handleResponse<Array<ReservationType>, `reservations`>(
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
    GET: async () => {
      return handleResponse<UserType, `reservations`>(
        await fetch(`/api/user/`, {
          method: 'GET',
          headers: commonHeaders,
        })
      );
    },
    PUT: async (body: { name: string }) => {
      return handleResponse<UserType, `reservations`>(
        await fetch(`/api/user`, {
          method: 'PUT',
          headers: commonHeaders,
          body: JSON.stringify(body),
        })
      );
    },
  },
};

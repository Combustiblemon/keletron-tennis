import { z } from 'zod';

import {
  AnnouncementType,
  AnnouncementValidator,
  AnnouncementValidatorPartial,
} from '@/models/Announcement';
import {
  CourtDataType,
  CourtType,
  CourtValidator,
  CourtValidatorPartial,
} from '@/models/Court';
import {
  ReservationDataType,
  ReservationType,
  ReservationValidator,
  ReservationValidatorPartial,
} from '@/models/Reservation';
import { UserType } from '@/models/User';

import { Errors, onError, onSuccess } from './common';
import { APIResponse } from './responseTypes';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const publicPages = ['/auth', '/', '/sign-in', '/sign-up'];

const handleResponse = async <ReturnDataType, Endpoint extends string>(
  res: Response
): Promise<APIResponse<ReturnDataType, Endpoint> | undefined> => {
  try {
    if (!res.ok) {
      if (res.status === 401) {
        // Redirect to Clerk sign-in page if unauthorized
        if (window && !publicPages.includes(window.location.pathname)) {
          window.location.pathname = '/sign-in';
        }

        return {
          success: false,
          errors: [{ message: Errors.UNAUTHORIZED }],
          endpoint: '' as Endpoint,
        };
      }

      if (res.status === 404) {
        return {
          success: false,
          errors: [{ message: Errors.NOT_FOUND }],
          endpoint: '' as Endpoint,
        };
      }

      let body: ReturnType<typeof onError> = {
        endpoint: '',
        errors: [],
        success: false,
      };

      try {
        body = (await res.json()) as ReturnType<typeof onError>;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`Error on server response: `, err);
      }

      return {
        ...body,
        endpoint: body.endpoint as Endpoint,
      };
    }

    return {
      ...((await res.json()) as ReturnType<
        typeof onSuccess<ReturnDataType, Endpoint>
      >),
      success: true,
    } as APIResponse<ReturnDataType, Endpoint>;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return undefined;
};

export type AdminReservationType = ReservationType & {
  owner: UserType;
  court: CourtType;
};

const headers = {
  'Content-Type': 'application/json',
};

/**
 * @deprecated Use useApiClient() hook instead for automatic Clerk token injection
 * This object is kept for backward compatibility during migration
 * Legacy auth endpoints have been removed - use Clerk for authentication
 */
export const endpoints = {
  announcements: {
    GET: async () =>
      handleResponse<Array<AnnouncementType>, `announcements`>(
        await fetch(`${API_URL}/announcements`, {
          method: 'GET',
          headers,
          credentials: 'include',
        })
      ),
  },
  courts: <IDString extends string | undefined>(id?: IDString) => ({
    GET: async () =>
      handleResponse<
        IDString extends undefined ? Array<CourtDataType> : CourtDataType,
        `courts${IDString extends undefined ? '' : '/id'}`
      >(
        await fetch(`${API_URL}/courts${id ? `/${id}` : ''}`, {
          method: 'GET',
          headers,
          credentials: 'include',
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
          `${API_URL}/reservations${ids ? `/${ids?.join(',')}` : ''}${query ? `?${query}` : ''}`,
          {
            headers,
            credentials: 'include',
            method: 'GET',
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
        await fetch(`${API_URL}/reservations`, {
          method: 'POST',
          headers,
          credentials: 'include',

          body: JSON.stringify(body),
        })
      ),
    PUT: async (
      id: string,
      body: z.infer<typeof ReservationValidatorPartial>
    ) =>
      handleResponse<ReservationType, `reservations`>(
        await fetch(`${API_URL}/reservations/${id}`, {
          method: 'PUT',
          headers,
          credentials: 'include',

          body: JSON.stringify(body),
        })
      ),
    DELETE: async (idsToDelete: Array<string>) => {
      if (!idsToDelete || !idsToDelete.length) {
        return null;
      }

      return handleResponse<Array<ReservationType>, `reservations`>(
        await fetch(`${API_URL}/reservations`, {
          method: 'DELETE',
          headers,
          credentials: 'include',

          body: JSON.stringify({
            ids: idsToDelete,
          }),
        })
      );
    },
  },
  notifications: {
    PUT: async (token: string, userId?: string) =>
      handleResponse<never, `notifications`>(
        await fetch(`${API_URL}/notifications`, {
          method: 'PUT',
          headers,
          credentials: 'include',

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
          await fetch(`${API_URL}/admin/announcements`, {
            method: 'GET',
            headers,
            credentials: 'include',
          })
        ),
      POST: async (body: z.infer<typeof AnnouncementValidator>) =>
        handleResponse<AnnouncementType, `admin/announcements`>(
          await fetch(`${API_URL}/admin/announcements`, {
            method: 'POST',
            headers,
            credentials: 'include',

            body: JSON.stringify(body),
          })
        ),
      PUT: async (
        _id: string,
        body: z.infer<typeof AnnouncementValidatorPartial>
      ) =>
        handleResponse<AnnouncementType, `admin/announcements/id`>(
          await fetch(`${API_URL}/admin/announcements/${_id}`, {
            method: 'PUT',
            headers,
            credentials: 'include',

            body: JSON.stringify(body),
          })
        ),
      DELETE: async (_id: string) => {
        if (!_id) {
          return null;
        }

        return handleResponse<AnnouncementType, `admin/announcements/id`>(
          await fetch(`${API_URL}/admin/announcements/${_id}`, {
            method: 'DELETE',
            headers,
            credentials: 'include',
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
          await fetch(`${API_URL}/admin/courts${id ? `/${id}` : ''}`, {
            method: 'GET',
            headers,
            credentials: 'include',
          })
        ),
      POST: async (body: z.infer<typeof CourtValidator>) =>
        handleResponse<
          CourtDataType,
          `courts${IDString extends undefined ? '' : '/id'}`
        >(
          await fetch(`${API_URL}/admin/courts`, {
            method: 'POST',
            headers,
            credentials: 'include',

            body: JSON.stringify(body),
          })
        ),
      PUT: async (body: z.infer<typeof CourtValidatorPartial>) => {
        if (!id) {
          throw new Error('Court ID is required for PUT operation');
        }
        return handleResponse<
          CourtDataType,
          `courts${IDString extends undefined ? '' : '/id'}`
        >(
          await fetch(`${API_URL}/admin/courts/${id}`, {
            method: 'PUT',
            headers,
            credentials: 'include',

            body: JSON.stringify(body),
          })
        );
      },
      DELETE: async (idToDelete: string) => {
        if (!idToDelete) {
          return null;
        }

        return handleResponse<CourtType, `courts/id`>(
          await fetch(`${API_URL}/admin/courts/${idToDelete}`, {
            method: 'DELETE',
            headers,
            credentials: 'include',
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
          await fetch(
            `${API_URL}/admin/reservations${query ? `?${query}` : ''}`,
            {
              headers,
              credentials: 'include',
              method: 'GET',
            }
          )
        );
      },
      POST: async (
        body: Pick<
          z.infer<typeof ReservationValidator>,
          'court' | 'type' | 'datetime' | 'people' | 'owner' | 'duration'
        >
      ) =>
        handleResponse<ReservationType, `reservations`>(
          await fetch(`${API_URL}/admin/reservations`, {
            method: 'POST',
            headers,
            credentials: 'include',

            body: JSON.stringify(body),
          })
        ),

      DELETE: async (idsToDelete: Array<string>) => {
        if (!idsToDelete || !idsToDelete.length) {
          return null;
        }

        return handleResponse<Array<ReservationType>, `reservations`>(
          await fetch(`${API_URL}/admin/reservations`, {
            method: 'DELETE',
            headers,
            credentials: 'include',

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
        await fetch(`${API_URL}/user`, {
          method: 'GET',
          headers,
          credentials: 'include',
        })
      );
    },
    PUT: async (body: {
      firstname: string;
      lastname: string;
      FCMToken?: string;
    }) => {
      return handleResponse<UserType, `reservations`>(
        await fetch(`${API_URL}/user`, {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify(body),
        })
      );
    },
  },
};

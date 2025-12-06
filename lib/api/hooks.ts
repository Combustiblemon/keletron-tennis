/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from '@clerk/nextjs';
import { useMemo } from 'react';
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

export type AdminReservationType = ReservationType & {
  owner: UserType;
  court: CourtType;
};

/**
 * Hook-based API client that automatically includes Clerk JWT token in requests
 * Use this in React components instead of the old `endpoints` object
 */
export const useApiClient = () => {
  const { getToken } = useAuth();

  const handleResponse = async <ReturnDataType, Endpoint extends string>(
    res: Response
  ): Promise<APIResponse<ReturnDataType, Endpoint> | undefined> => {
    try {
      if (!res.ok) {
        if (res.status === 401) {
          // Redirect to sign-in if unauthorized
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

  const getHeaders = async () => {
    const token = await getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  return useMemo(
    () => ({
      announcements: {
        GET: async () => {
          const headers = await getHeaders();
          return handleResponse<Array<AnnouncementType>, `announcements`>(
            await fetch(`${API_URL}/announcements`, {
              method: 'GET',
              headers,
              credentials: 'include',
            })
          );
        },
      },
      courts: <IDString extends string | undefined>(id?: IDString) => ({
        GET: async () => {
          const headers = await getHeaders();
          return handleResponse<
            IDString extends undefined ? Array<CourtDataType> : CourtDataType,
            `courts${IDString extends undefined ? '' : '/id'}`
          >(
            await fetch(`${API_URL}/courts${id ? `/${id}` : ''}`, {
              method: 'GET',
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

          const headers = await getHeaders();
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
        ) => {
          const headers = await getHeaders();
          return handleResponse<ReservationType, `reservations`>(
            await fetch(`${API_URL}/reservations`, {
              method: 'POST',
              headers,
              credentials: 'include',
              body: JSON.stringify(body),
            })
          );
        },
        PUT: async (
          id: string,
          body: z.infer<typeof ReservationValidatorPartial>
        ) => {
          const headers = await getHeaders();
          return handleResponse<ReservationType, `reservations`>(
            await fetch(`${API_URL}/reservations/${id}`, {
              method: 'PUT',
              headers,
              credentials: 'include',
              body: JSON.stringify(body),
            })
          );
        },
        DELETE: async (idsToDelete: Array<string>) => {
          if (!idsToDelete || !idsToDelete.length) {
            return null;
          }

          const headers = await getHeaders();
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
        PUT: async (token: string, userId?: string) => {
          const headers = await getHeaders();
          return handleResponse<never, `notifications`>(
            await fetch(`${API_URL}/notifications/`, {
              method: 'PUT',
              headers,
              credentials: 'include',
              body: JSON.stringify({
                token,
                userId,
              }),
            })
          );
        },
      },
      admin: {
        announcements: {
          GET: async () => {
            const headers = await getHeaders();
            return handleResponse<
              Array<AnnouncementType>,
              `admin/announcements`
            >(
              await fetch(`${API_URL}/admin/announcements`, {
                method: 'GET',
                headers,
                credentials: 'include',
              })
            );
          },
          POST: async (body: z.infer<typeof AnnouncementValidator>) => {
            const headers = await getHeaders();
            return handleResponse<AnnouncementType, `admin/announcements`>(
              await fetch(`${API_URL}/admin/announcements`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify(body),
              })
            );
          },
          PUT: async (
            _id: string,
            body: z.infer<typeof AnnouncementValidatorPartial>
          ) => {
            const headers = await getHeaders();
            return handleResponse<AnnouncementType, `admin/announcements/id`>(
              await fetch(`${API_URL}/admin/announcements/${_id}`, {
                method: 'PUT',
                headers,
                credentials: 'include',
                body: JSON.stringify(body),
              })
            );
          },
          DELETE: async (_id: string) => {
            if (!_id) {
              return null;
            }

            const headers = await getHeaders();
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
          GET: async () => {
            const headers = await getHeaders();
            return handleResponse<
              IDString extends undefined ? Array<CourtDataType> : CourtDataType,
              `courts${IDString extends undefined ? '' : '/id'}`
            >(
              await fetch(`${API_URL}/admin/courts${id ? `/${id}` : ''}`, {
                method: 'GET',
                headers,
                credentials: 'include',
              })
            );
          },
          POST: async (body: z.infer<typeof CourtValidator>) => {
            const headers = await getHeaders();
            return handleResponse<
              CourtDataType,
              `courts${IDString extends undefined ? '' : '/id'}`
            >(
              await fetch(`${API_URL}/admin/courts`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify(body),
              })
            );
          },
          PUT: async (body: z.infer<typeof CourtValidatorPartial>) => {
            const headers = await getHeaders();
            return handleResponse<
              CourtDataType,
              `courts${IDString extends undefined ? '' : '/id'}`
            >(
              await fetch(`${API_URL}/admin/courts/${id ? `${id}` : ''}`, {
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

            const headers = await getHeaders();
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

            const headers = await getHeaders();
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
          ) => {
            const headers = await getHeaders();
            return handleResponse<ReservationType, `reservations`>(
              await fetch(`${API_URL}/admin/reservations`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify(body),
              })
            );
          },
          DELETE: async (idsToDelete: Array<string>) => {
            if (!idsToDelete || !idsToDelete.length) {
              return null;
            }

            const headers = await getHeaders();
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
          const headers = await getHeaders();
          return handleResponse<UserType, `user`>(
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
          const headers = await getHeaders();
          return handleResponse<UserType, `user`>(
            await fetch(`${API_URL}/user`, {
              method: 'PUT',
              headers,
              credentials: 'include',
              body: JSON.stringify(body),
            })
          );
        },
      },
    }),
    [getToken]
  );
};

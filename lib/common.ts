import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { signOut } from 'next-auth/react';

import { ReservationDataType } from '@/models/Reservation';

import { firebaseCloudMessaging } from './webPush';

/**
 * Logs the user out of the application (next-auth) and redirects to the homepage
 * @param router  the router instance
 * @param callback
 */
export const logout = async (
  router: AppRouterInstance,
  callback?: () => void | Promise<void>
) => {
  await signOut();
  await firebaseCloudMessaging.deleteToken();

  if (callback) {
    await callback();
  }

  router.push('/');
};

export const addMinutesToTime = (time: string, minutes: number) =>
  new Date(
    new Date(`1970/01/01 ${time}`).getTime() + minutes * 60000
  ).toLocaleTimeString('el-GR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

export const formatDate = (date: Date) =>
  `${date
    .toLocaleDateString('en-CA', { timeZone: 'Europe/Athens' })
    .substring(0, 10)}T${date
    .toLocaleTimeString('el', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Athens',
      hour12: false,
    })
    .substring(0, 5)}`;

export const isReservationTimeFree = (
  courtReservations: Array<ReservationDataType>,
  datetime: string,
  duration: number
): boolean => {
  if (courtReservations.length === 0) {
    return true;
  }

  const startTime = datetime.split('T')[1];
  const endTime = addMinutesToTime(startTime, duration);

  return !courtReservations
    .filter((r) => {
      return r.datetime.split('T')[0] === datetime.split('T')[0];
    })
    .some((r) => {
      const rstartTime = r.datetime.split('T')[1];
      const rendTime = addMinutesToTime(rstartTime, r.duration);

      return (
        // if start time is within the reservation time
        (rstartTime < startTime && startTime < rendTime) ||
        // or end time is within the reservation time
        (rstartTime < endTime && endTime < rendTime) ||
        // or if the times are the same
        (rstartTime === startTime && r.duration === duration)
      );
    });
};

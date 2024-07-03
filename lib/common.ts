import { deleteToken } from 'firebase/messaging';
import { signOut } from 'next-auth/react';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { firebaseCloudMessaging } from './webPush';
import { ReservationType } from '@/models/Reservation';

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
    new Date('1970/01/01 ' + time).getTime() + minutes * 60000
  ).toLocaleTimeString('el-GR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

export const formatDate = (date: Date) =>
  `${new Date()
    .toLocaleDateString('en-CA', { timeZone: 'Europe/Athens' })
    .substring(0, 10)},${new Date()
    .toLocaleTimeString('el', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Athens',
      hour12: false,
    })
    .substring(0, 5)}`;

export const isReservationTimeFree = (
  courtReservations: Array<ReservationType>,
  datetime: string,
  duration: number
): boolean => {
  if (courtReservations.length === 0) {
    return true;
  }

  const startTime = datetime.split(',')[1];
  const endTime = addMinutesToTime(startTime, duration);

  return !courtReservations
    .filter((r) => r.datetime.split(',')[0] === datetime.split(',')[0])
    .every((r) => {
      const rstartTime = r.datetime.split(',')[1];
      const rendTime = addMinutesToTime(rstartTime, r.duration);

      return (
        // if start time is within the reservation time
        (rstartTime <= startTime && startTime <= rendTime) ||
        // or end time is within the reservation time
        (rstartTime <= endTime && endTime <= rendTime)
      );
    });
};

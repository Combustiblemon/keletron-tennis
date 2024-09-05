import { rem } from '@mantine/core';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { signOut } from 'next-auth/react';

import { CourtDataType } from '@/models/Court';
import { ReservationDataType } from '@/models/Reservation';

import { useTranslation } from './i18n/i18n';
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

export const weekDayMap = {
  '1': 'MONDAY',
  '2': 'TUESDAY',
  '3': 'WEDNESDAY',
  '4': 'THURSDAY',
  '5': 'FRIDAY',
  '6': 'SATURDAY',
  '0': 'SUNDAY',
} as const;

const isTimeOverlapping = (
  reservation: { startTime: string; endTime: string; duration: number },
  against: { startTime: string; endTime: string; duration: number }
) => {
  return (
    // if start time is within the reservation time
    (against.startTime < reservation.startTime &&
      reservation.startTime < against.endTime) ||
    // or end time is within the reservation time
    (against.startTime < reservation.endTime &&
      reservation.endTime < against.endTime) ||
    // or if the times are the same
    (against.startTime === reservation.startTime &&
      reservation.duration === against.duration)
  );
};

export const isReservationTimeFree = (
  courtReservations: Array<ReservationDataType>,
  courtReservedTimes: CourtDataType['reservationsInfo']['reservedTimes'],
  datetime: string,
  duration: number,
  reservationId?: string
): boolean => {
  let reservationCheck = true;

  const startTime = datetime.split('T')[1];
  const endTime = addMinutesToTime(startTime, duration);

  if (courtReservations.length) {
    const reservationsToCheck = courtReservations.filter((r) => {
      const dateCheck = r.datetime.split('T')[0] === datetime.split('T')[0];

      if (reservationId) {
        return r._id.toString() !== reservationId.toString() && dateCheck;
      }

      return dateCheck;
    });

    reservationCheck = !reservationsToCheck.length
      ? true
      : !reservationsToCheck.some((r) => {
          const rstartTime = r.datetime.split('T')[1];

          return isTimeOverlapping(
            {
              duration,
              endTime,
              startTime,
            },
            {
              duration: r.duration,
              endTime: addMinutesToTime(rstartTime, r.duration),
              startTime: rstartTime,
            }
          );
        });
  }

  if (!reservationCheck) {
    return false;
  }

  if (!courtReservedTimes.length) {
    return reservationCheck;
  }

  const weekDay =
    weekDayMap[
      new Date(datetime).getDay().toString() as keyof typeof weekDayMap
    ];

  const reservedCheck = !courtReservedTimes
    .filter((r) => r.days?.includes(weekDay))
    .some((r) => {
      return isTimeOverlapping(
        {
          duration,
          endTime,
          startTime,
        },
        {
          duration: r.duration,
          endTime: addMinutesToTime(r.startTime, r.duration),
          startTime: r.startTime,
        }
      );
    });

  return reservationCheck && reservedCheck;
};

export const iconStyles = { width: rem(16), height: rem(16) };

export const weekDays = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export const useTimeUntil = (date1: Date, date2?: Date): string => {
  const { t } = useTranslation();

  const now = date2 || new Date();

  if (date1 <= now) {
    return '';
  }

  const diff = Math.floor((date1.getTime() - now.getTime()) / 1000 / 60);

  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  const days = Math.floor(hours / 24);

  // eslint-disable-next-line no-nested-ternary
  return `${days ? `${days}${t('generic.date.d')} ` : ''}${days ? `${hours % 24}${t('generic.date.h')} ` : hours ? `${hours}${t('generic.date.h')} ` : ''}${minutes}${t('generic.date.m')}`;
};

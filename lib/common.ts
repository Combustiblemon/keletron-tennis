/* eslint-disable @typescript-eslint/no-explicit-any */
import { rem } from '@mantine/core';

import { CourtDataType } from '@/models/Court';
import { ReservationDataType } from '@/models/Reservation';

import { APIResponse } from './api/responseTypes';
import { endpoints } from './api/utils';
import { useTranslation } from './i18n/i18n';
import { firebaseCloudMessaging } from './webPush';

export const isIOS = () =>
  /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

export const isAndroid = () =>
  /android/.test(window.navigator.userAgent.toLowerCase());

export const isMobile = isIOS || isAndroid;

let installed: boolean | undefined;

export const isInstalled = () => {
  if (installed !== undefined) {
    return installed;
  }

  const media = window.matchMedia('(display-mode: standalone)').matches;
  const nav = (navigator as any)?.standalone;
  const andref = document.referrer.includes('android-app://');

  installed = media || nav || andref;

  return installed;
};

export const logout = async (callback?: () => void | Promise<void>) => {
  try {
    await endpoints.auth.logout();

    await firebaseCloudMessaging.deleteToken();

    if (callback) {
      await callback();
    }

    window.location.reload();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('error', error);
  }
};

export const login = async (
  data?: Record<string, string | undefined>,
  callback?: () => void | Promise<void>
): Promise<APIResponse<unknown, 'login'> | undefined> => {
  const res = await endpoints.auth.login(data);

  await firebaseCloudMessaging.saveToken();

  if (callback) {
    await callback();
  }

  return res;
};

export const verifyLogin = async (
  data?: Record<string, string | undefined>,
  callback?: () => void | Promise<void>
): Promise<APIResponse<unknown, 'login'> | undefined> => {
  const res = await endpoints.auth.verifyLogin(data);

  await firebaseCloudMessaging.saveToken();

  if (callback) {
    await callback();
  }

  return res;
};

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

export const addMinutesToTime = (time: string, minutes: number) =>
  new Date(
    new Date(`1970/01/01 ${time}`).getTime() + minutes * 60000
  ).toLocaleTimeString('el-GR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

export const getMinutes = (time1: string, time2: string) => {
  return (
    (new Date(`1970/01/01 ${time1}`).getTime() -
      new Date(`1970/01/01 ${time2}`).getTime()) /
    1000 /
    60
  );
};

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
  courtReservationInfo: CourtDataType['reservationsInfo'],
  datetime: string,
  reservationId?: string
): boolean => {
  let reservationCheck = true;
  const {
    duration,
    reservedTimes: courtReservedTimes,
    startTime: courtStartTime,
    endTime: courtEndTime,
  } = courtReservationInfo;

  const startTime = datetime.split('T')[1];
  const endTime = addMinutesToTime(startTime, duration);

  if (startTime < courtStartTime || endTime > courtEndTime) {
    return false;
  }

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

  if (!reservationCheck || !courtReservedTimes.length) {
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

export const getAvailableTimeInSteps = (
  reservationsInfo: CourtDataType['reservationsInfo'],
  reservations: Array<ReservationDataType>,
  date: Date,
  skipReservationCheck: string = '',
  step: number = 30
): Array<string> => {
  const { endTime, startTime } = reservationsInfo;

  let time = startTime;
  const times: Array<string> = [];
  let count = 0;

  while (count < 500 && time <= endTime) {
    count += 1;

    if (
      isReservationTimeFree(
        reservations,
        reservationsInfo,
        `${date.toISOString().substring(0, 10)}T${time}`,
        skipReservationCheck
      )
    ) {
      times.push(time);
    }

    time = addMinutesToTime(time, step);
  }

  return times;
};

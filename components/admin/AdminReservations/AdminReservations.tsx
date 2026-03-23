import { Box, Group, LoadingOverlay, Stack, Table, Text } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure, useElementSize, useToggle } from '@mantine/hooks';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';

import ReservationDetails from '@/components/Reservation/ReservationDetails';
import { useApiClient } from '@/lib/api/hooks';
import { formatDate } from '@/lib/common';
import { CourtDataType } from '@/models/Court';

import ReservationVisual from './ReservationVisual';

const times = [
  '00:00',
  '01:00',
  '02:00',
  '03:00',
  '04:00',
  '05:00',
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
];

/** Minimum px per hour so reservation cards fit name + meta without clipping. */
const MIN_HOUR_ROW_HEIGHT = 120;

const AdminReservations = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { ref: tableWrapRef, height: tableWrapHeight } = useElementSize();
  const { ref: theadRef, height: theadHeight } = useElementSize();
  const api = useApiClient();

  const [reservationId, setReservationId] = useState<string>('');
  const [opened, { close, open }] = useDisclosure();
  const [isLoading, toggleIsLoading] = useToggle();

  // Defer painting reservation cells until after client mount to avoid PWA/cache
  // serving stale shell where first paint shows empty table
  const [paintReservations, setPaintReservations] = useState(false);
  useLayoutEffect(() => {
    setPaintReservations(true);
  }, []);

  useEffect(() => {
    toggleIsLoading(true);
    const params = new URLSearchParams(window.location.search);

    const datetime = params.get('datetime');
    const resId = params.get('reservationId');

    if (resId) {
      setReservationId(resId);

      if (datetime) {
        setSelectedDate(new Date(datetime));
      }

      open();
    }
    toggleIsLoading(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reservations = useQuery({
    queryKey: ['admin', 'reservations'],
    queryFn: async () => api.admin.reservations.GET(),
    staleTime: 5 * 60 * 1000, // 5 min – avoid refetch on date change / focus
    placeholderData: keepPreviousData,
  });

  const reservationData = useMemo(
    () => (reservations.data?.success ? reservations.data?.data : []),
    [reservations.data]
  );

  const reservationCountByDate = useMemo(() => {
    const map: Record<string, number> = {};
    reservationData.forEach((r) => {
      const key = r.datetime.split('T')[0];
      map[key] = (map[key] ?? 0) + 1;
    });
    return map;
  }, [reservationData]);

  const courts = useQuery({
    queryKey: ['courts'],
    queryFn: async () => api.admin.courts().GET(),
  });

  const courtData = useMemo(
    () =>
      courts.data?.success ? (courts.data?.data as Array<CourtDataType>) : [],
    [courts.data]
  );

  const [formatedDate] = formatDate(selectedDate).split('T');

  const sortedCourts = useMemo(
    () => [...courtData].sort((a, b) => (a.name > b.name ? 1 : -1)),
    [courtData]
  );

  const rowHeight =
    tableWrapHeight > 0 && theadHeight > 0
      ? Math.max(
          (tableWrapHeight - theadHeight) / times.length,
          MIN_HOUR_ROW_HEIGHT
        )
      : MIN_HOUR_ROW_HEIGHT;

  const rows = times.map((time) => (
    <Table.Tr key={time} h={`${rowHeight}px`}>
      <Table.Td p="xs" align="right">
        {time}
      </Table.Td>
      {sortedCourts.map((c) => {
        if (!paintReservations) {
          return <Table.Td key={`${c._id}${time}`} p={0} pos="relative" />;
        }
        const reservation = reservationData.filter(
          (r) =>
            r.court._id?.toString() === c._id?.toString() &&
            r.datetime.split('T')[0] === formatedDate &&
            r.datetime.split('T')[1].substring(0, 2) === time.substring(0, 2)
        )[0];

        return (
          <Table.Td key={`${c._id}${time}`} p={0} pos="relative">
            {reservation ? (
              <ReservationVisual
                key={reservation._id?.toString() ?? `${c._id}-${time}`}
                reservation={reservation}
                hourRowHeight={rowHeight}
              />
            ) : null}
          </Table.Td>
        );
      })}
    </Table.Tr>
  ));

  const res = useMemo(
    () => reservationData.find((v) => v._id.toString() === reservationId),
    [reservationData, reservationId]
  );

  const court = useMemo(
    () => courtData.find((v) => v._id === res?.court._id.toString()),
    [courtData, res]
  );

  return (
    <Stack pt="sm" flex={1} h="100%" miw={0} mih={0} style={{ minHeight: 0 }}>
      <LoadingOverlay
        visible={isLoading || courts.isPending || reservations.isPending}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
      />
      {res && court ? (
        <ReservationDetails
          id={res?._id.toString()}
          close={close}
          opened={opened}
          court={court}
          reservation={res}
        />
      ) : null}

      <Group>
        <DateInput
          label="Ημερομηνια"
          value={selectedDate}
          renderDay={(date) => {
            const dateKey = formatDate(date).split('T')[0];
            const reservationCount = reservationCountByDate[dateKey] ?? 0;
            return (
              <Stack justify="center" align="center" gap="0px">
                <Text size="sm">{date.getDate()}</Text>
                <Text size="xs">{reservationCount}</Text>
              </Stack>
            );
          }}
          onChange={(v) => {
            if (v) setSelectedDate(v);
          }}
        />
      </Group>
      <Box
        flex={1}
        w="100%"
        ref={tableWrapRef}
        pos="relative"
        mih={0}
        style={{ minHeight: 0, overflowY: 'auto' }}
      >
        <Table
          withColumnBorders
          style={{ width: '100%', tableLayout: 'fixed' }}
        >
          <Table.Thead
            ref={theadRef}
            styles={{
              thead: {
                zIndex: 2,
              },
            }}
          >
            <Table.Tr>
              <Table.Th w={56}>Ώρα</Table.Th>
              {sortedCourts.map((c) => (
                <Table.Th key={c._id}>{c.name}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody key={`${formatedDate}-${paintReservations}`}>
            {rows}
          </Table.Tbody>
        </Table>
      </Box>
    </Stack>
  );
};

export default AdminReservations;

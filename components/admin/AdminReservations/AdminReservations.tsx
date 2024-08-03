import {
  Box,
  Group,
  LoadingOverlay,
  ScrollArea,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useElementSize } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';

import { endpoints } from '@/lib/api/utils';
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

const TABLE_CELL_HEIGHT = 60;
const TABLE_CELL_WIDTH = 90;

const AdminReservations = () => {
  const [SelectedDate, setSelectedDate] = useState(new Date());
  const { ref: calendarWrapperRef, height: calendarWrapperHeight } =
    useElementSize();

  const reservations = useQuery({
    queryKey: ['reservations'],
    queryFn: async () => endpoints.admin.reservations.GET(),
  });

  const reservationData = useMemo(
    () => (reservations.data?.success ? reservations.data?.data : []),
    [reservations]
  );

  const courts = useQuery({
    queryKey: ['courts'],
    queryFn: async () => endpoints.admin.courts().GET(),
  });

  const courtData = useMemo(
    () =>
      courts.data?.success ? (courts.data?.data as Array<CourtDataType>) : [],
    [courts]
  );

  const [formatedDate] = formatDate(SelectedDate).split('T');

  const rows = useMemo(() => {
    return times.map((time) => (
      <Table.Tr
        key={time}
        h={`${TABLE_CELL_HEIGHT}px`}
        w={`${TABLE_CELL_WIDTH}px`}
      >
        <Table.Td p="xs" align="right">
          {time}
        </Table.Td>
        {courtData.map((c) => {
          const reservation = reservationData.filter(
            (r) =>
              // same court
              r.court._id === c._id &&
              // same day
              r.datetime.split('T')[0] === formatedDate &&
              // reservation time starts with current time
              r.datetime.split('T')[1].substring(0, 2) === time.substring(0, 2)
          )[0];

          return (
            <Table.Td key={`${c._id}${time}`} p={0} pos="relative">
              {reservation ? (
                <ReservationVisual
                  reservation={reservation}
                  width={`${TABLE_CELL_WIDTH}px`}
                />
              ) : (
                ''
              )}
            </Table.Td>
          );
        })}
      </Table.Tr>
    ));
  }, [courtData, formatedDate, reservationData]);

  return (
    <Stack pt="sm" flex={1}>
      <LoadingOverlay
        visible={reservations.isPending || courts.isPending}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
      />
      <Group>
        <DateInput
          label="Ημερομηνια"
          defaultValue={new Date()}
          renderDay={(date) => {
            const reservationCount = reservationData.filter(
              (r) => r.datetime.split('T')[0] === formatDate(date).split('T')[0]
            ).length;

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
      <Box flex={1} w="100%" ref={calendarWrapperRef}>
        <ScrollArea h={`${calendarWrapperHeight}px`} type="never" w="100%">
          <Table stickyHeader stickyHeaderOffset={0} withColumnBorders>
            <Table.Thead
              styles={{
                thead: {
                  zIndex: 2,
                },
              }}
            >
              <Table.Tr>
                <Table.Th w="50px">Ώρα</Table.Th>
                {courtData.map((c) => {
                  return <Table.Th key={c._id}>{c.name}</Table.Th>;
                })}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </ScrollArea>
      </Box>
    </Stack>
  );
};

export default AdminReservations;

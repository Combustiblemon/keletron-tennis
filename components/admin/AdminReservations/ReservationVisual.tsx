import { Group, Paper, rem, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconNotes, IconUser } from '@tabler/icons-react';
import React from 'react';

import ReservationDetails from '@/components/Reservation/ReservationDetails';
import { AdminReservationType } from '@/lib/api/utils';
import { iconStyles } from '@/lib/common';

export interface ReservationVisualProps {
  reservation: AdminReservationType;
  /** Pixel height of one hour row (positions scale with this). */
  hourRowHeight?: number;
}

const ReservationVisual = ({
  reservation: r,
  hourRowHeight = 120,
}: ReservationVisualProps) => {
  const [opened, { close, open }] = useDisclosure();
  const minutesIntoHour = Number(r.datetime.substring(14, 16));
  const topPx = (minutesIntoHour / 60) * hourRowHeight;
  const heightPx = (r.duration / 60) * hourRowHeight;

  return (
    <Paper
      p="xs"
      withBorder
      shadow="xs"
      pos="absolute"
      left={rem(2)}
      right={rem(2)}
      w="auto"
      top={`${topPx}px`}
      radius="sm"
      bg="teal"
      h={`${Math.max(heightPx, 2)}px`}
      onClick={(e) => {
        e.stopPropagation();
        open();
      }}
      styles={{
        root: {
          zIndex: 1,
        },
      }}
    >
      <ReservationDetails
        close={close}
        opened={opened}
        court={r.court}
        reservation={r}
      />
      <Stack justify="space-between">
        <Text
          size="sm"
          styles={{
            root: {
              wordWrap: 'break-word',
            },
          }}
          c="white"
        >
          {r.owner.firstname} {r.owner.lastname}
        </Text>
        <Group justify="space-between">
          <Group p={0} gap={0} align="center">
            <IconUser
              style={{ width: rem(16), height: rem(16), color: 'white' }}
            />
            <Text size="sm" c="white">
              {r.people.length}
            </Text>
          </Group>
          {r.notes ? <IconNotes style={iconStyles} /> : null}
        </Group>
      </Stack>
    </Paper>
  );
};
export default ReservationVisual;

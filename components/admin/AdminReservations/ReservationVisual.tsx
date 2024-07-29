import { Group, Paper, rem, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconNotes, IconUser } from '@tabler/icons-react';
import React from 'react';

import ReservationDetails from '@/components/Reservation/ReservationDetails';
import { AdminReservationDataType } from '@/lib/api/utils';
import { iconStyles } from '@/lib/common';

export interface ReservationVisualProps {
  reservation: AdminReservationDataType;
  width: number | string;
}

const ReservationVisual = ({
  reservation: r,
  width,
}: ReservationVisualProps) => {
  const [opened, { close, open }] = useDisclosure();
  return (
    <Paper
      p="xs"
      withBorder
      shadow="xs"
      w={width}
      pos="absolute"
      top={`${Number(r.datetime.substring(14, 16))}px`}
      radius="sm"
      bg="teal"
      h={`${r.duration}px`}
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
          {r.owner.name}
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

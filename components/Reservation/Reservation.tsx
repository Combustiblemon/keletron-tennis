import {
  Card,
  CardSection,
  DefaultMantineColor,
  Group,
  rem,
  Stack,
  StyleProp,
  Text,
} from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import React, { useState } from 'react';

import { formatDate, useTimeUntil } from '@/lib/common';
import { CourtType } from '@/models/Court';
import { ReservationType } from '@/models/Reservation';

import ReservationDetails from './ReservationDetails';

export type ReservationProps = {
  court: CourtType;
  reservation: ReservationType;
  bg?: StyleProp<DefaultMantineColor>;
  onClick?: () => void | Promise<void>;
  editable?: boolean;
};

const textOptions = {
  c: 'white',
};

const Reservation = ({
  court,
  reservation: r,
  bg = 'teal',
  onClick,
  editable,
}: ReservationProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const date = new Date(r.datetime);
  const formatedDate = formatDate(new Date(r.datetime)).split('T');

  const timeUntil = useTimeUntil(date);

  const openDetailsModal = () => {
    setIsModalOpen(true);
  };

  return (
    <Card
      onClick={() => {
        onClick?.();
        openDetailsModal();
      }}
      withBorder
      bg={bg}
      radius="lg"
    >
      <ReservationDetails
        court={court}
        editable={editable as true}
        close={() => {
          setIsModalOpen(false);
        }}
        opened={isModalOpen}
        reservation={r}
      />

      <CardSection p="sm">
        <Stack gap="md">
          <Group w="100%" justify="space-between">
            <Text {...textOptions}>{court.name}</Text>
            <Text {...textOptions}>{formatedDate[0]}</Text>
          </Group>
          <Group w="100%" justify="space-between">
            <Group gap={0} align="flex-end">
              <IconUser
                color="white"
                style={{ height: rem(16), width: rem(16) }}
              />
              <Text {...textOptions} lh="12px">
                {r.people.length}
              </Text>
            </Group>
            <Text {...textOptions}>
              {formatedDate[1]} {timeUntil ? `(${timeUntil})` : ''}
            </Text>
          </Group>
        </Stack>
      </CardSection>
    </Card>
  );
};

export default Reservation;

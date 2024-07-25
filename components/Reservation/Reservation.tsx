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

import { formatDate } from '@/lib/common';
import { CourtDataType } from '@/models/Court';
import { ReservationDataType } from '@/models/Reservation';

import ReservationDetails from './ReservationDetails';

export type ReservationProps = {
  court: CourtDataType;
  reservation: ReservationDataType;
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

  let timeUntil = '';
  const now = new Date();

  if (now < date) {
    const diff = Math.floor((date.getTime() - now.getTime()) / 1000 / 60);

    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    const days = Math.floor(hours / 24);

    // eslint-disable-next-line no-nested-ternary
    timeUntil = `${days ? `${days}ημ ` : ''}${days ? `${hours % 24}ωρ ` : hours ? `${hours}ωρ ` : ''}${minutes}λ`;
  }

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

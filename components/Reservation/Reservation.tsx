import { ReservationType } from '@/models/Reservation';
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
import React from 'react';

export interface ReservationProps {
  courtLabel: string;
  reservation: ReservationType;
  bg?: StyleProp<DefaultMantineColor>;
  onClick?: () => void | Promise<void>;
}

const textOptions = {
  c: 'white',
};

const Reservation = ({
  courtLabel,
  reservation: r,
  bg = 'teal',
  onClick,
}: ReservationProps) => {
  const date = new Date(r.datetime);

  const formatedDate = date
    .toLocaleDateString('el-GR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Europe/Athens',
    })
    .substring(0, 5);

  const formatedTime = date.toLocaleTimeString('el-GR', {
    minute: '2-digit',
    hour: '2-digit',
    hour12: false,
    timeZone: 'Europe/Athens',
  });

  let timeUntil = '';
  const now = new Date();

  if (now < date) {
    const diff = Math.floor((date.getTime() - now.getTime()) / 1000 / 60);

    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    const days = Math.floor(hours / 24);

    timeUntil = `${days ? `${days}ημ ` : ''}${days ? `${hours % 24}ωρ ` : hours ? `${hours}ωρ ` : ''}${minutes}λ`;
  }

  return (
    <Card onClick={onClick} withBorder bg={bg} radius={'lg'}>
      <CardSection p={'sm'}>
        <Stack gap={'md'}>
          <Group w={'100%'} justify="space-between">
            <Text {...textOptions}>{courtLabel}</Text>
            <Text {...textOptions}>{formatedDate}</Text>
          </Group>
          <Group w={'100%'} justify="space-between">
            <Group gap={0} align="flex-end">
              <IconUser
                color="white"
                style={{ height: rem(16), width: rem(16) }}
              />
              <Text {...textOptions} lh={'12px'}>
                {r.people.length}
              </Text>
            </Group>
            <Text {...textOptions}>
              {formatedTime} {timeUntil ? `(${timeUntil})` : ''}
            </Text>
          </Group>
        </Stack>
      </CardSection>
    </Card>
  );
};

export default Reservation;

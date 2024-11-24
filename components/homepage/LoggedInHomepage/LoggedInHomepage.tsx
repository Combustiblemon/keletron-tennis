import { Paper, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

import Announcements from '@/components/Announcements/Announcements';
import { useUser } from '@/components/UserProvider/UserProvider';
import { endpoints } from '@/lib/api/utils';
import { useTimeUntil } from '@/lib/common';
import { useTranslation } from '@/lib/i18n/i18n';

const LoggedInHomepage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useUser();

  const userReservations = useQuery({
    queryKey: ['reservations', 'user'],
    queryFn: async () => endpoints.reservations.GET(undefined, undefined, 0),
  });

  const userReservationData = useMemo(
    () => (userReservations.data?.success ? userReservations.data?.data : []),
    [userReservations]
  );

  const timeUntil = useTimeUntil(
    new Date(userReservationData?.[0]?.datetime || '')
  );

  return (
    <Stack w="100%" justify="flex-start" align="center" h="100%">
      <Text size="lg" ta="center">
        {`${t('loggedInHomepage.welcome')}, ${user.user.name}`}
      </Text>
      <Announcements />
      {!!userReservationData?.[0] && (
        <Paper
          p="sm"
          radius="lg"
          withBorder
          shadow="sm"
          onClick={() => router.push('/reservations')}
        >
          <Stack gap="sm" align="center">
            <Text size="sm">{t('loggedInHomepage.reservation.label')}</Text>
            <Text size="sm">
              {userReservationData?.[0].datetime.replace('T', ' ')}
              {timeUntil ? ` (${timeUntil})` : ''}
            </Text>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
};

export default LoggedInHomepage;

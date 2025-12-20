import { Button, Paper, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

// import Announcements from '@/components/Announcements/Announcements';
import { RoleGuard } from '@/components/RoleGuard/RoleGuard';
import { useUser } from '@/components/UserProvider/UserProvider';
import { useApiClient } from '@/lib/api/hooks';
import { useTimeUntil } from '@/lib/common';
import { useTranslation } from '@/lib/i18n/i18n';
// import { firebaseCloudMessaging } from '@/lib/webPush';

const LoggedInHomepage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useUser();
  const api = useApiClient();

  const userReservations = useQuery({
    queryKey: ['reservations'],
    queryFn: async () => api.reservations.GET(undefined, undefined, 0),
    retry: 3,
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
        {`${t('loggedInHomepage.welcome')}${user.firstname || user.lastname ? `, ${user.firstname || ''} ${user.lastname || ''}` : ''}`}
      </Text>
      {!!userReservationData?.[0] && timeUntil ? (
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
      ) : null}
      <Button
        onClick={async () => {
          router.push('/reservations');
        }}
      >
        Κρατήσεις
      </Button>

      {/* Admin-only quick link */}
      <RoleGuard requireAdmin>
        <Button
          variant="light"
          color="red"
          onClick={() => {
            router.push('/admin');
          }}
        >
          Admin Panel
        </Button>
      </RoleGuard>
    </Stack>
  );
};

export default LoggedInHomepage;

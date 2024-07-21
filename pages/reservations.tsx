import { Button, Group, LoadingOverlay, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';

import NewReservationForm from '@/components/forms/NewReservationForm/NewReservationForm';
import Reservation from '@/components/Reservation/Reservation';
import { endpoints } from '@/lib/api/utils';

const fetchCourts = async () => {
  return endpoints.courts(undefined).GET();
};

const Reservations = () => {
  const session = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);

  const courts = useQuery({
    queryKey: ['courts'],
    queryFn: fetchCourts,
  });

  const userReservations = useQuery({
    queryKey: ['reservations', 'user'],
    queryFn: async () => endpoints.reservations.GET(undefined, undefined, 0),
  });

  if (
    !courts.isPending &&
    !courts.isError &&
    !courts.data?.errors &&
    isLoading
  ) {
    setIsLoading(false);
  }

  const courtsSelectionData = useMemo(
    () =>
      courts.data?.success
        ? courts.data?.data.map((court) => ({
            label: court.name,
            value: court._id as string,
          }))
        : [],
    [courts]
  );

  const userReservationData = useMemo(
    () => (userReservations.data?.success ? userReservations.data?.data : []),
    [userReservations]
  );

  return (
    <Stack gap="lg">
      <LoadingOverlay
        visible={courts.isPending || isLoading}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
      />

      <NewReservationForm
        onClose={close}
        opened={opened}
        sessionData={session.data}
        courtData={courts.data}
        courtsSelectionData={courtsSelectionData}
      />

      <Group justify="space-between">
        <Text>Reservations</Text>
        <Button variant="default" onClick={open}>
          New Reservation
        </Button>
      </Group>

      <Stack>
        <Text>Upcoming reservations:</Text>
        {userReservationData
          .filter((r) => {
            return (
              new Date(r.datetime).getTime() >
              //                     20 minutes ago
              new Date().getTime() - 20 * 60 * 1000
            );
          })
          .sort(
            (a, b) =>
              new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
          )
          .map((r) => {
            return (
              <Reservation
                key={`${r._id}`}
                reservation={r}
                courtLabel={
                  courtsSelectionData.find((c) => c.value === r.court)?.label ||
                  ''
                }
              />
            );
          })}
      </Stack>
    </Stack>
  );
};

export default Reservations;

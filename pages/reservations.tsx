import {
  ActionIcon,
  Button,
  Drawer,
  Group,
  Input,
  LoadingOverlay,
  Paper,
  rem,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconCancel,
  IconClock,
  IconDeviceFloppy,
  IconUserPlus,
} from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import Reservation from '@/components/Reservation/Reservation';
import { APIResponse } from '@/lib/api/responseTypes';
import { endpoints } from '@/lib/api/utils';
import { formatDate, isReservationTimeFree } from '@/lib/common';
import { CourtType } from '@/models/Court';

const DEFAULT_RESERVATION_DURATION = 90;

const fetchReservations = async (date?: string) => {
  return endpoints.reservations.GET(undefined, date);
};

const fetchCourts = async () => {
  return endpoints.courts(undefined).GET();
};

const getCourtTimes = (
  courts: APIResponse<CourtType[], 'courts'> | undefined,
  selectedCourt: string
) => {
  if (courts && !courts.errors) {
    const resInfo = courts.data.find(
      (c) => c._id === selectedCourt
    )?.reservationsInfo;

    return [resInfo?.startTime || '09:00', resInfo?.endTime || '21:00'];
  }
  return ['09:00', '21:00'];
};

const formId = 'new-reservation';

const Reservations = () => {
  const session = useSession();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const courts = useQuery({
    queryKey: ['courts'],
    queryFn: fetchCourts,
  });

  const newReservation = useForm({
    mode: 'uncontrolled',
    initialValues: {
      court: '',
      date: new Date(),
      time: '09:00',
      people: [] as string[],
    },
    validate: {
      people: (value) => {
        return value.length <= 0 && 'people error no people';
      },
      court: (value) => {
        return !value && 'no court error';
      },
      time: (value, values) => {
        const [courtMinTime, courtMaxTime] = getCourtTimes(
          courts.data,
          values.court
        );

        const now = new Date();

        const isToday =
          formatDate(now).split(',')[0] ===
          formatDate(values.date).split(',')[0];

        const timeValid = !isToday || formatDate(now).split(',')[1] < value;

        return !(courtMinTime <= value && value <= courtMaxTime) || !timeValid
          ? 'time error'
          : false;
      },
      date: (value) => {
        return (
          value.toLocaleDateString('en-CA', { timeZone: 'Europe/Athens' }) <
            new Date().toLocaleDateString('en-CA', {
              timeZone: 'Europe/Athens',
            }) && 'date error'
        );
      },
    },
  });

  const [opened, { open, close }] = useDisclosure(false, {
    onClose: () => {
      newReservation.reset();
      newReservation.setFieldValue('people', [session.data?.user?.name || '']);
    },
  });

  const updatePeople = (index: number, value: string) => {
    newReservation.setFieldValue(
      'people',
      newReservation.getValues().people.map((p, i) => {
        if (i === index) {
          return value.trim();
        }

        return p;
      })
    );
  };

  useEffect(() => {
    if (
      newReservation.getValues().people.length === 0 &&
      session.data?.user?.name
    ) {
      newReservation.setFieldValue('people', [session.data?.user.name]);
    }
  }, [newReservation, session.data?.user?.name]);

  const reservations = useQuery({
    queryKey: [
      'reservations',
      newReservation.getValues().date.getUTCDate(),
      newReservation.getValues().date.getUTCMonth(),
      newReservation.getValues().date.getUTCFullYear(),
    ],
    queryFn: () =>
      fetchReservations(formatDate(newReservation.getValues().date)),
  });

  const userReservations = useQuery({
    queryKey: ['reservations', 'user'],
    queryFn: async () => endpoints.reservations.GET(undefined, undefined, 0),
  });

  if (!courts.isPending && !courts.isError && !courts.data?.errors) {
    if (!newReservation.getValues().court) {
      newReservation.setValues({
        court: courts.data?.data[0]._id as string,
      });
    }
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

  const reservationData = useMemo(
    () => (reservations.data?.success ? reservations.data?.data : []),
    [reservations]
  );

  const userReservationData = useMemo(
    () => (userReservations.data?.success ? userReservations.data?.data : []),
    [userReservations]
  );

  const timePickerRef = useRef<HTMLInputElement>(null);

  const timePickerControl = (
    <ActionIcon
      variant="subtle"
      color="gray"
      onClick={() => {
        timePickerRef.current?.showPicker();
      }}
    >
      <IconClock style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
    </ActionIcon>
  );

  const selectedCourt = newReservation.getValues().court;

  const [minCourtTime, maxCourtTime] = useMemo(
    () => getCourtTimes(courts.data, selectedCourt),
    [selectedCourt, courts.data]
  );

  const handleNewReservationSubmit = newReservation.onSubmit(async (values) => {
    setIsSubmitting(true);

    const date = formatDate(values.date).split(',')[0];
    const datetime = `${date},${values.time}`;

    const isReservationValid = isReservationTimeFree(
      reservationData.filter(
        (r) => r.datetime.includes(date) && r.court === values.court
      ),
      datetime,
      DEFAULT_RESERVATION_DURATION
    );

    if (!isReservationValid) {
      notifications.show({
        message: 'reservation exists on this time',
        color: 'red',
      });

      setIsSubmitting(false);

      return;
    }

    try {
      const res = await endpoints.reservations.POST({
        court: values.court,
        datetime,
        people: values.people,
        type: values.people.length > 2 ? 'DOUBLE' : 'SINGLE',
      });
      setIsSubmitting(false);

      if (!res?.success) {
        // eslint-disable-next-line no-console
        console.error(JSON.stringify(res, null, 2));

        notifications.show({
          message: 'error creating reservation',
          color: 'red',
        });

        return;
      }
      notifications.show({
        message: 'reservation has been created',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    } catch {
      notifications.show({
        message: 'error creating reservation',
        color: 'red',
      });
    }

    close();
    setIsSubmitting(false);
  });

  return (
    <Stack gap="lg">
      <LoadingOverlay
        visible={reservations.isPending || courts.isPending || isSubmitting}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
      />

      <Drawer
        opened={opened}
        onClose={close}
        title={
          <Group justify="space-between">
            <Text>Νέα Κράτηση</Text>
            <ActionIcon
              variant="subtle"
              type="submit"
              form={formId}
              color="gray"
            >
              <IconDeviceFloppy style={{ width: rem(16), height: rem(16) }} />
            </ActionIcon>
          </Group>
        }
        position="bottom"
        size="92%"
        overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
      >
        <form
          id={formId}
          style={{
            position: 'relative',
          }}
          onSubmit={handleNewReservationSubmit}
        >
          <Stack gap="lg">
            <Stack
              style={{
                display: 'flex',
                width: '100%',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text>
                Το γήπεδο είναι ανοιχτό από {minCourtTime} έως {maxCourtTime}
              </Text>

              <Group
                gap="sm"
                justify="space-between"
                w="100%"
                align="flex-start"
              >
                <DateInput
                  inputMode="none"
                  value={newReservation.getValues().date}
                  onChange={(value): void => {
                    if (value) {
                      newReservation.setValues({
                        date: value,
                      });
                    }
                  }}
                  minDate={new Date()}
                  required
                  label="Date"
                  error={newReservation.errors.date}
                />

                <TimeInput
                  required
                  onFocus={(e) => {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }}
                  error={newReservation.errors.time}
                  ref={timePickerRef}
                  label="Time"
                  defaultValue="09:00"
                  rightSection={timePickerControl}
                  onChange={(e) => {
                    newReservation.setFieldValue('time', e.target.value.trim());
                  }}
                />
              </Group>
            </Stack>

            <Select
              error={newReservation.errors.court}
              data={courtsSelectionData}
              value={newReservation.getValues().court}
              onChange={(value) => {
                newReservation.setValues({
                  court: value || '',
                });
              }}
              label="Select court"
              multiple={false}
              withCheckIcon={false}
            />

            <Stack w="100%" gap="sm">
              <Group w="100%" justify="space-between">
                <Text>People</Text>
                <ActionIcon
                  disabled={newReservation.getValues().people.length >= 4}
                  variant="subtle"
                  color="dark"
                  onClick={() => {
                    const { people } = newReservation.getValues();

                    if (people.length >= 4) {
                      return;
                    }

                    newReservation.setFieldValue('people', [...people, '']);
                  }}
                >
                  <IconUserPlus style={{ width: rem(16), height: rem(16) }} />
                </ActionIcon>
              </Group>
              <Stack gap="sm" w="100%">
                {newReservation.getValues().people.map((person, index) => {
                  return (
                    <Group
                      w="100%"
                      justify="space-between"
                      gap="sm"
                      // eslint-disable-next-line react/no-array-index-key
                      key={index}
                    >
                      <Input
                        value={person}
                        onChange={(e) => {
                          updatePeople(index, e.target.value);
                        }}
                      />
                      <ActionIcon
                        disabled={
                          index === 0 &&
                          newReservation.getValues().people.length === 1
                        }
                        variant="subtle"
                        color="red"
                        onClick={() => {
                          newReservation.setFieldValue(
                            'people',
                            newReservation
                              .getValues()
                              .people.filter((_, i) => i !== index)
                          );
                        }}
                      >
                        <IconCancel
                          style={{ width: rem(16), height: rem(16) }}
                        />
                      </ActionIcon>
                    </Group>
                  );
                })}
              </Stack>
              {newReservation.errors.people && (
                <Input.Error>{newReservation.errors.people}</Input.Error>
              )}
            </Stack>

            <Stack gap="sm">
              <Text>
                Existing reservations for court{' '}
                {
                  courtsSelectionData.find(
                    (c) => c.value === newReservation.getValues().court
                  )?.label
                }
              </Text>
              <SimpleGrid cols={1} verticalSpacing="xs">
                {reservationData
                  ?.filter((r) => r.court === newReservation.getValues().court)
                  .sort(
                    (a, b) =>
                      new Date(a.datetime).getTime() -
                      new Date(b.datetime).getTime()
                  )
                  .map((reservation) => {
                    const startTime = new Date(reservation.datetime);
                    const endTime = new Date(reservation.datetime);
                    endTime.setMinutes(
                      startTime.getMinutes() + reservation.duration
                    );

                    return (
                      <Paper
                        key={reservation._id as string}
                        withBorder
                        p="md"
                        radius="md"
                        shadow="sm"
                        bg="red"
                      >
                        <Group justify="space-between">
                          <Group>
                            <Text c="white" fw="bold">
                              {startTime.toLocaleTimeString('el', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                              })}
                              &nbsp;-&nbsp;
                              {endTime.toLocaleTimeString('el', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                              })}
                            </Text>
                          </Group>
                          {reservation.type === 'TRAINING' && (
                            <Text c="white" fw="bold">
                              Προπόνηση
                            </Text>
                          )}
                        </Group>
                      </Paper>
                    );
                  })}
              </SimpleGrid>
            </Stack>
          </Stack>
        </form>
      </Drawer>

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
                  courtsSelectionData.find((c) => c.value === selectedCourt)
                    ?.label || ''
                }
              />
            );
          })}
      </Stack>
    </Stack>
  );
};

export default Reservations;

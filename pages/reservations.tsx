import { endpoints } from '@/lib/api/utils';
import {
  ActionIcon,
  Box,
  Button,
  Drawer,
  Group,
  Input,
  LoadingOverlay,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Portal,
  Text,
  rem,
  Card,
  CardSection,
} from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import {
  useDebouncedCallback,
  useDebouncedValue,
  useDisclosure,
  useElementSize,
} from '@mantine/hooks';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IconCancel,
  IconClock,
  IconDeviceFloppy,
  IconUserPlus,
} from '@tabler/icons-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CourtType } from '@/models/Court';
import { APIResponse } from '@/lib/api/responseTypes';
import { useSession } from 'next-auth/react';
import { notifications } from '@mantine/notifications';
import { formatDate, isReservationTimeFree } from '@/lib/common';

const DEFAULT_RESERVATION_DURATION = 90;

const fetchReservations = async (date?: string) => {
  return await endpoints.reservations.GET(undefined, date);
};

const fetchCourts = async () => {
  return await endpoints.courts(undefined).GET();
};

const getCourtTimes = (
  courts: APIResponse<CourtType[], 'courts'> | undefined,
  selectedCourt: string
) => {
  if (courts && !courts.errors) {
    let resInfo = courts.data.find(
      (c) => c._id === selectedCourt
    )?.reservationsInfo;

    return [resInfo?.startTime || '09:00', resInfo?.endTime || '21:00'];
  } else {
    return ['09:00', '21:00'];
  }
};

const formId = 'new-reservation';

const Reservations = () => {
  const [opened, { open, close }] = useDisclosure(false);
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
      time: new Date().toTimeString().substring(0, 5),
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

        return (
          !(courtMinTime <= value && value <= courtMaxTime) && 'time error'
        );
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
  }, [session.data?.user?.name]);

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
    queryFn: async () =>
      await endpoints.reservations.GET(undefined, undefined, 0),
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
      onClick={() => timePickerRef.current?.showPicker()}
    >
      <IconClock style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
    </ActionIcon>
  );

  const selectedCourt = newReservation.getValues().court;

  const [courtMinTime, courtMaxTime] = useMemo(
    () => getCourtTimes(courts.data, selectedCourt),
    [selectedCourt]
  );

  const handleNewReservationSubmit = newReservation.onSubmit(async (values) => {
    setIsSubmitting(true);

    const date = formatDate(values.date).split(',')[0];
    const datetime = `${date},${values.time}`;

    console.log(date);

    const isReservationValid = isReservationTimeFree(
      reservationData.filter((r) => r.datetime.includes(date)),
      datetime,
      DEFAULT_RESERVATION_DURATION
    );

    console.log({ isReservationValid });

    if (!isReservationValid || true) {
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

      if (!res?.success) {
        console.log(JSON.stringify(res, null, 2));

        notifications.show({
          message: 'error creating reservation',
          color: 'red',
        });
      } else {
        notifications.show({
          message: 'reservation has been created',
          color: 'green',
        });
        queryClient.invalidateQueries({ queryKey: ['reservations'] });
      }
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
    <Stack gap={'lg'}>
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
                Το γήπεδο είναι ανοιχτό από {courtMinTime} έως {courtMaxTime}
              </Text>

              <Group gap={'sm'} justify="space-between" w="100%">
                <DateInput
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
                  error={newReservation.errors.time}
                  ref={timePickerRef}
                  label="Time"
                  maxTime={courtMaxTime}
                  minTime={courtMinTime}
                  defaultValue={new Date()
                    .toLocaleTimeString('el', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    .substring(0, 5)}
                  rightSection={timePickerControl}
                  onChange={(e) =>
                    newReservation.setFieldValue('time', e.target.value.trim())
                  }
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
                console.log({ value });
              }}
              label={'Select court'}
              multiple={false}
              withCheckIcon={false}
            />

            <Stack w="100%" gap={'sm'}>
              <Group w="100%" justify="space-between">
                <Text>People</Text>
                <ActionIcon
                  disabled={newReservation.getValues().people.length >= 4}
                  variant="subtle"
                  color="dark"
                  onClick={() => {
                    const people = newReservation.getValues().people;

                    if (people.length >= 4) {
                      return;
                    }

                    newReservation.setFieldValue('people', [...people, '']);
                  }}
                >
                  <IconUserPlus style={{ width: rem(16), height: rem(16) }} />
                </ActionIcon>
              </Group>
              <Stack gap={'sm'} w={'100%'}>
                {newReservation.getValues().people.map((person, index) => {
                  return (
                    <Group
                      w="100%"
                      justify="space-between"
                      gap="sm"
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
              <SimpleGrid cols={1} verticalSpacing={'xs'}>
                {reservationData
                  ?.filter((r) => r.court === newReservation.getValues().court)
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
                        p={'md'}
                        radius={'md'}
                        shadow="sm"
                        bg={'red'}
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
        {userReservationData
          .filter((r) =>
            r.datetime.includes(formatDate(new Date()).split(',')[0])
          )
          .map((r) => {
            return (
              <Card key={`${r._id}`} withBorder bg={'teal'} p={'md'}>
                <CardSection>
                  <Stack gap={'md'}>
                    <Text>
                      {
                        courtsSelectionData.find((c) => c.value === r.court)
                          ?.label
                      }
                    </Text>
                    <Text>{r.datetime}</Text>
                  </Stack>
                </CardSection>
              </Card>
            );
          })}
      </Stack>
    </Stack>
  );
};

export default Reservations;

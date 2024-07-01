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
} from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import {
  useDebouncedCallback,
  useDebouncedValue,
  useDisclosure,
  useElementSize,
} from '@mantine/hooks';

import { useQuery } from '@tanstack/react-query';
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
import { ReservationType, ReservationValidator } from '@/models/Reservation';
import { z } from 'zod';

const now = new Date();

const testReservations: Array<
  z.infer<typeof ReservationValidator> & { _id: string }
> = [
  {
    _id: '667fc752ab1945633b6e5841',
    type: 'SINGLE',
    datetime: new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes()
    ).toISOString(),
    people: ['Tasos'],
    owner: '667e9644f13656fc97be0094',
    court: '6676bb2866d60621f2caa49f',
    status: 'APPROVED',
    paid: false,
    duration: 90,
  },
  {
    _id: '667fc752ab1945633b6e5842',
    type: 'SINGLE',
    datetime: new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes() + 90
    ).toISOString(),
    people: ['Tasos'],
    owner: '667e9644f13656fc97be0094',
    court: '6676bb2866d60621f2caa49f',
    status: 'APPROVED',
    paid: false,
    duration: 90,
  },
  {
    _id: '667fc752ab1945633b6e5843',
    type: 'SINGLE',
    datetime: new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes() + 90 * 2
    ).toISOString(),
    people: ['Tasos'],
    owner: '667e9644f13656fc97be0094',
    court: '6676bb2866d60621f2caa49f',
    status: 'APPROVED',
    paid: false,
    duration: 90,
  },
  {
    _id: '667fc752ab1945633b6e5844',
    type: 'SINGLE',
    datetime: new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes() + 90 * 3
    ).toISOString(),
    people: ['Tasos'],
    owner: '667e9644f13656fc97be0094',
    court: '6676bb2866d60621f2caa49f',
    status: 'APPROVED',
    paid: false,
    duration: 90,
  },
];

const fetchReservations = async (date?: Date) => {
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

  const courts = useQuery({
    queryKey: ['courts'],
    queryFn: fetchCourts,
  });

  const newReservation = useForm({
    mode: 'uncontrolled',
    initialValues: {
      court: '',
      date: new Date(),
      time: new Date().toISOString().substring(11, 16),
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

        console.log({
          validation: courtMinTime <= value && value <= courtMaxTime,
          minTime: courtMinTime,
          maxTime: courtMaxTime,
          value: value,
        });

        return (
          !(courtMinTime <= value && value <= courtMaxTime) && 'time error'
        );
      },
      date: (value) => {
        return (
          value.toISOString().substring(0, 10) <
            new Date().toISOString().substring(0, 10) && 'date error'
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
      session.data?.user.name
    ) {
      newReservation.setFieldValue('people', [session.data?.user.name]);
    }
  }, [session.data?.user.name]);

  const reservations = useQuery({
    queryKey: [
      'reservations',
      newReservation.getValues().date.getUTCDate(),
      newReservation.getValues().date.getUTCMonth(),
      newReservation.getValues().date.getUTCFullYear(),
    ],
    queryFn: () =>
      testReservations || fetchReservations(newReservation.getValues().date),
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

  const handleNewReservationSubmit = newReservation.onSubmit((values) => {});

  return (
    <div>
      <LoadingOverlay
        visible={reservations.isPending || courts.isPending}
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
                  defaultValue={new Date().toISOString().substring(11, 16)}
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
                {reservations.data
                  ?.filter((r) => r.court === newReservation.getValues().court)
                  .map((reservation) => {
                    const startTime = new Date(reservation.datetime);
                    const endTime = new Date(reservation.datetime);
                    endTime.setMinutes(
                      startTime.getMinutes() + reservation.duration
                    );

                    return (
                      <Paper
                        key={reservation._id}
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

      <Stack>RESERVATION LIST</Stack>
    </div>
  );
};

export default Reservations;

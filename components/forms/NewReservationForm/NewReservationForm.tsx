/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ActionIcon,
  Drawer,
  Group,
  Input,
  LoadingOverlay,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconCancel,
  IconClock,
  IconDeviceFloppy,
  IconUserPlus,
} from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { User } from '@/components/UserProvider/UserProvider';
import { APIResponse } from '@/lib/api/responseTypes';
import { endpoints } from '@/lib/api/utils';
import {
  formatDate,
  iconStyles,
  isReservationTimeFree,
  weekDayMap,
} from '@/lib/common';
import { CourtDataType } from '@/models/Court';
import { ReservationDataType } from '@/models/Reservation';

const DEFAULT_RESERVATION_DURATION = 90;

const fetchReservations = async (date?: string) => {
  return endpoints.reservations.GET(undefined, date);
};

const getCourtTimes = (
  courts: APIResponse<CourtDataType[], 'courts'> | undefined,
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

export interface NewReservationFormProps {
  userData: User | null;
  courtData?: APIResponse<CourtDataType[], 'courts'>;
  opened: boolean;
  onClose: () => void;
  courtsSelectionData: Array<{ label: string; value: string }>;
  isAdmin?: boolean;
}

const NewReservationForm = ({
  opened,
  userData,
  onClose,
  courtData,
  courtsSelectionData,
  isAdmin,
}: NewReservationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const newReservation = useForm({
    mode: 'uncontrolled',
    initialValues: {
      court: '',
      date: new Date(),
      time: '09:00',
      people: [] as string[],
      notes: '',
      duration: 90,
    },
    validate: {
      people: (value) => {
        const errors: number[] = [];

        value.forEach((p, index) => {
          if (!p.trim()) {
            errors.push(index);
          }
        });

        return (
          (value.length <= 0 && 'people error no people') ||
          (!!errors.length && errors)
        );
      },
      court: (value) => {
        return !value && 'no court error';
      },
      time: (value, values) => {
        const [courtMinTime, courtMaxTime] = getCourtTimes(
          courtData,
          values.court
        );

        const now = new Date();

        const isToday =
          formatDate(now).split('T')[0] ===
          formatDate(values.date).split('T')[0];

        const timeValid = !isToday || formatDate(now).split('T')[1] < value;

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

  const selectedDayFormated = formatDate(newReservation.getValues().date).split(
    'T'
  );

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

  const reservationData = useMemo(
    () => (reservations.data?.success ? reservations.data?.data : []),
    [reservations]
  );

  useEffect(() => {
    if (newReservation.getValues().people.length === 0 && userData?.firstname) {
      newReservation.setFieldValue('people', [
        `${userData?.firstname} ${userData?.lastname}`,
        ' ',
      ]);
    }
  }, [newReservation, userData?.firstname, userData?.lastname]);

  const timePickerRef = useRef<HTMLInputElement>(null);

  const timePickerControl = (
    <ActionIcon
      variant="subtle"
      color="gray"
      onClick={() => {
        timePickerRef.current?.showPicker();
      }}
    >
      <IconClock style={iconStyles} stroke={1.5} />
    </ActionIcon>
  );

  const selectedCourtId = newReservation.getValues().court;
  const selectedCourt = courtData?.success
    ? courtData?.data?.find((c) => c._id === selectedCourtId)
    : undefined;

  const [minCourtTime, maxCourtTime] = useMemo(
    () => getCourtTimes(courtData, selectedCourtId),
    [selectedCourtId, courtData]
  );

  const handleNewReservationSubmit = newReservation.onSubmit(async (values) => {
    setIsSubmitting(true);

    const date = formatDate(values.date).split('T')[0];
    const datetime = `${date}T${values.time}`;

    const isReservationValid = isReservationTimeFree(
      reservationData.filter(
        (r) => r.datetime.includes(date) && r.court === values.court
      ),
      selectedCourt?.reservationsInfo?.reservedTimes || [],
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
      const res = isAdmin
        ? await endpoints.admin.reservations.POST({
            court: values.court,
            datetime,
            people: values.people,
            type: values.people.length > 2 ? 'DOUBLE' : 'SINGLE',
            duration:
              values.duration ||
              selectedCourt?.reservationsInfo?.duration ||
              90,
            notes: values.notes,
          } as any)
        : await endpoints.reservations.POST({
            court: values.court,
            datetime,
            people: values.people,
            type: values.people.length > 2 ? 'DOUBLE' : 'SINGLE',
            notes: values.notes,
          } as any);

      setIsSubmitting(false);
      newReservation.reset();

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

    setIsSubmitting(false);
    onClose();
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
    if (courtsSelectionData[0] && !newReservation.getValues().court) {
      newReservation.setFieldValue('court', courtsSelectionData[0]?.value);
      newReservation.setFieldValue(
        'duration',
        selectedCourt?.reservationsInfo?.duration || 90
      );
    }
  }, [
    courtsSelectionData,
    newReservation,
    selectedCourt?.reservationsInfo?.duration,
  ]);

  const existingReservationData = useMemo(
    () => [
      ...(reservationData?.filter(
        (r) => r.court === newReservation.getValues().court
      ) || []),
      ...(selectedCourt?.reservationsInfo?.reservedTimes.filter(
        (r) =>
          r.days?.includes(
            weekDayMap[
              newReservation
                .getValues()
                .date.getDay()
                .toString() as keyof typeof weekDayMap
            ]
          ) && !r.datesNotApplied?.includes(selectedDayFormated[0])
      ) || []),
    ],
    [
      newReservation,
      reservationData,
      selectedCourt?.reservationsInfo?.reservedTimes,
      selectedDayFormated,
    ]
  );

  return (
    <Drawer
      opened={opened}
      onClose={() => {
        newReservation.reset();
        newReservation.setFieldValue('people', [
          `${userData?.firstname || ''} ${userData?.lastname || ''}`,
          ' ',
        ]);
        onClose?.();
      }}
      title={
        <Group justify="space-between">
          <Text>Νέα Κράτηση</Text>
          <ActionIcon
            variant="filled"
            type="submit"
            form={formId}
            color="green"
          >
            <IconDeviceFloppy style={iconStyles} />
          </ActionIcon>
        </Group>
      }
      position="bottom"
      size="92%"
      overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
    >
      <LoadingOverlay
        visible={reservations.isPending || isSubmitting}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
      />
      <form
        id={formId}
        style={{
          position: 'relative',
        }}
        onSubmit={handleNewReservationSubmit}
        key={newReservation.getValues().court}
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
              Το γήπεδο είναι διαθέσιμο από {minCourtTime} έως {maxCourtTime}
            </Text>

            <Group gap="sm" justify="space-between" w="100%" align="flex-start">
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
                label="Ημερομηνία"
                error={newReservation.errors.date}
              />

              <TimeInput
                required
                inputMode="none"
                error={newReservation.errors.time}
                ref={timePickerRef}
                label="Ώρα"
                defaultValue="09:00"
                rightSection={timePickerControl}
                onChange={(e) => {
                  newReservation.setFieldValue('time', e.target.value.trim());
                }}
              />
            </Group>
          </Stack>
          {isAdmin && (
            <NumberInput
              label="Διάρκεια κράτησης"
              defaultValue={selectedCourt?.reservationsInfo?.duration}
              onChange={(v) => {
                newReservation.setFieldValue('duration', Number(v));
              }}
              allowDecimal={false}
              trimLeadingZeroesOnBlur
              allowNegative={false}
              hideControls
              suffix="λ"
            />
          )}
          <Select
            allowDeselect={false}
            error={newReservation.errors.court}
            data={courtsSelectionData}
            defaultValue={courtsSelectionData[0]?.value}
            value={newReservation.getValues().court}
            onChange={(value) => {
              newReservation.setValues({
                court: value || '',
                duration: courtData?.success
                  ? courtData?.data?.find((c) => c._id === value)
                      ?.reservationsInfo?.duration
                  : 90,
              });
            }}
            label="Γήπεδο"
            multiple={false}
            withCheckIcon
          />

          <Textarea
            placeholder="Σημειώσεις"
            onChange={(e) => {
              newReservation.setFieldValue('notes', e.target.value.trim());
            }}
            error={newReservation.errors.notes}
          />

          <Stack w="100%" gap="sm">
            <Group w="100%" justify="space-between">
              <Text>Άτομα</Text>
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
                <IconUserPlus style={iconStyles} />
              </ActionIcon>
            </Group>

            <Stack gap="sm" w="100%">
              {newReservation.getValues().people.map((person, index) => {
                let error: string | undefined;

                if (
                  Array.isArray(newReservation.errors.people) &&
                  newReservation.errors.people.includes(index)
                ) {
                  error = 'please add person name';
                }

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
                      error={error}
                    />
                    <ActionIcon
                      disabled={newReservation.getValues().people.length <= 2}
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
                      <IconCancel style={iconStyles} />
                    </ActionIcon>
                  </Group>
                );
              })}
            </Stack>

            {newReservation.errors.people && (
              <Input.Error>
                {Array.isArray(newReservation.errors.people)
                  ? 'please add all names'
                  : newReservation.errors.people}
              </Input.Error>
            )}
          </Stack>

          <Stack gap="sm">
            {!!existingReservationData.length && (
              <Text>Μη διαθέσημες ώρες</Text>
            )}

            <SimpleGrid cols={1} verticalSpacing="xs">
              {existingReservationData
                .sort((a, b) => {
                  return (
                    new Date(
                      (a as ReservationDataType).datetime
                        ? (a as ReservationDataType).datetime
                        : `${formatDate(newReservation.getValues().date).split('T')[0]}T${(a as CourtDataType['reservationsInfo']['reservedTimes'][number]).startTime}`
                    ).getTime() -
                    new Date(
                      (b as ReservationDataType).datetime
                        ? (b as ReservationDataType).datetime
                        : `${formatDate(newReservation.getValues().date).split('T')[0]}T${(b as CourtDataType['reservationsInfo']['reservedTimes'][number]).startTime}`
                    ).getTime()
                  );
                })
                .map((reservation) => {
                  const datetime = (reservation as ReservationDataType).datetime
                    ? (reservation as ReservationDataType).datetime
                    : `${formatDate(newReservation.getValues().date).split('T')[0]}T${(reservation as CourtDataType['reservationsInfo']['reservedTimes'][number]).startTime}`;

                  const startTime = new Date(datetime);
                  const endTime = new Date(datetime);
                  endTime.setMinutes(
                    startTime.getMinutes() + reservation.duration
                  );

                  return (
                    <Paper
                      key={datetime}
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
                      </Group>
                    </Paper>
                  );
                })}
            </SimpleGrid>
          </Stack>
        </Stack>
      </form>
    </Drawer>
  );
};

export default NewReservationForm;

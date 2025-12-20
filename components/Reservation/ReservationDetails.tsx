import {
  ActionIcon,
  Group,
  Input,
  LoadingOverlay,
  Modal,
  Paper,
  rem,
  Select,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  IconCancel,
  IconCheck,
  // IconClock,
  IconPencil,
  IconTrash,
  IconUserPlus,
} from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';

import { useApiClient } from '@/lib/api/hooks';
import {
  addMinutesToTime,
  formatDate,
  getAvailableTimeInSteps,
} from '@/lib/common';
import { useTranslation } from '@/lib/i18n/i18n';
import { CourtDataType } from '@/models/Court';
import { ReservationDataType } from '@/models/Reservation';

const iconStyle = { width: rem(16), height: rem(16) };

// const updateDatetime = (datetime: string, date?: string, time?: string) => {
//   let res = datetime;

//   if (time) {
//     res = `${res.split('T')[0]}T${time}`;
//   }

//   if (date) {
//     res = `${date}T${datetime.split('T')[1]}`;
//   }

//   return res;
// };

export type ReservationDetailsProps = {
  reservation: ReservationDataType;
  opened: boolean;
  close: () => void;
  court: CourtDataType;
  editable?: boolean;
  id?: string;
};

const ReservationDetails = ({
  id,
  reservation,
  opened,
  close,
  editable,
  court,
}: ReservationDetailsProps) => {
  const [editState, setEditState] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const api = useApiClient();

  const updatedReservation = useForm({
    mode: 'uncontrolled',
    initialValues: {
      time: reservation.datetime.split('T')[1],
      date: new Date(reservation.datetime),
      ...reservation,
    },
    validate: {
      people: (value) => {
        const errors: number[] = [];

        if (!value) {
          return t('generic.form.errors.noPeople');
        }

        value.forEach((p, index) => {
          if (!p.trim()) {
            errors.push(index);
          }
        });

        return (
          ((value?.length || 0) <= 0 && t('generic.form.errors.noPeople')) ||
          (!!errors.length && errors)
        );
      },
      datetime: (value) => {
        const courtMinTime = court?.reservationsInfo.endTime;
        const courtMaxTime = court?.reservationsInfo.startTime;

        if (!value || !courtMaxTime || !courtMinTime) {
          return t('generic.form.errors.time');
        }

        const now = new Date();

        const isToday = formatDate(now).split('T')[0] === value.split('T')[0];

        const timeValid =
          !isToday || formatDate(now).split('T')[1] <= value?.split('T')[1];

        return !(courtMinTime <= value && value <= courtMaxTime) || !timeValid
          ? t('generic.form.errors.time')
          : false;
      },
    },
  });

  const formatedTime = useMemo(
    () => updatedReservation.getValues().time,
    [updatedReservation]
  );

  const deleteReservation = async () => {
    setIsLoading(true);
    await api.reservations.DELETE([
      updatedReservation.getValues()._id || '',
    ]);
    setIsLoading(false);

    queryClient.invalidateQueries({ queryKey: ['reservations'] });
    close();
  };

  const updateReservation = async () => {
    setIsLoading(true);
    try {
      const res = await api.reservations.PUT(
        updatedReservation.getValues()._id || '',
        {
          ...updatedReservation.getValues(),
          datetime: `${updatedReservation.getValues().date.toISOString().substring(0, 10)}:${updatedReservation.getValues().time}`,
        }
      );

      if (res?.success) {
        notifications.show({
          message: t('generic.components.ReservationDetails.updated'),
          color: 'green',
        });
      } else {
        notifications.show({
          message: res?.errors[0].message,
          color: 'red',
        });
      }

      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      close();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
      notifications.show({
        message: t('errors.unexpected_error'),
        color: 'red',
      });
    }
    setIsLoading(false);
  };

  const openDeleteModal = () => {
    modals.openConfirmModal({
      title: t('generic.components.ReservationDetails.deleteModal.title'),
      centered: true,
      children: (
        <Text size="sm">
          {t('generic.components.ReservationDetails.deleteModal.body')}
        </Text>
      ),
      labels: {
        confirm: t('generic.components.ReservationDetails.deleteModal.confirm'),
        cancel: t('generic.components.ReservationDetails.deleteModal.cancel'),
      },
      confirmProps: { color: 'red' },
      onConfirm: deleteReservation,
    });
  };

  // const timePickerRef = useRef<HTMLInputElement>(null);

  // const timePickerControl = (
  //   <ActionIcon
  //     variant="subtle"
  //     color="gray"
  //     onClick={() => {
  //       timePickerRef.current?.showPicker();
  //     }}
  //   >
  //     <IconClock style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
  //   </ActionIcon>
  // );

  if (
    !updatedReservation.getValues().time &&
    updatedReservation.getValues().datetime
  ) {
    updatedReservation.setFieldValue(
      'time',
      reservation?.datetime.split('T')?.[1] || ''
    );
    updatedReservation.setFieldValue(
      'date',
      new Date(reservation?.datetime || Date.now())
    );
  }

  const reservations = useQuery({
    queryKey: [
      'reservations',
      updatedReservation.getValues().date.getUTCDate(),
      updatedReservation.getValues().date.getUTCMonth(),
      updatedReservation.getValues().date.getUTCFullYear(),
    ],
    queryFn: () =>
      api.reservations.GET(
        undefined,
        formatDate(updatedReservation.getValues().date)
      ),
  });

  useEffect(() => {
    const value = court.reservationsInfo;

    if (
      !value ||
      reservations.status !== 'success' ||
      !reservations.data?.success
    ) {
      return;
    }

    const reserv = reservations.data?.data.filter(
      (res) => res.court.toString() === court._id.toString()
    );

    const times = getAvailableTimeInSteps(
      value,
      reserv,
      updatedReservation.getValues().date,
      reservation?._id?.toString()
    );

    setAvailableTimes(times.filter((v, i) => times.indexOf(v) === i));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    court?.reservationsInfo,
    reservations.data?.data,
    reservations.data?.success,
    reservations.status,
  ]);

  return (
    <Modal
      id={id}
      opened={opened}
      onClose={close}
      closeButtonProps={{
        onClick: (e) => {
          e.stopPropagation();
          setEditState(false);
        },
      }}
      centered
      fullScreen
      withCloseButton
      radius={0}
      transitionProps={{ transition: 'fade', duration: 200 }}
      title={
        <Group gap="sm">
          {editable && (
            <ActionIcon
              onClick={async () => {
                if (editState) {
                  updateReservation();
                }

                setEditState(!editState);
              }}
              color="gray"
            >
              {editState ? (
                <IconCheck style={iconStyle} />
              ) : (
                <IconPencil style={iconStyle} />
              )}
            </ActionIcon>
          )}
          <ActionIcon onClick={openDeleteModal} color="red">
            <IconTrash style={iconStyle} />
          </ActionIcon>
        </Group>
      }
    >
      <LoadingOverlay
        visible={isLoading}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
      />
      <Paper w="100%" p="md" data-autofocus>
        <Stack w="100%" gap="md">
          <DateInput
            disabled={!editState}
            inputMode="none"
            value={
              new Date(updatedReservation.getValues().datetime || Date.now())
            }
            onChange={(value): void => {
              if (value) {
                updatedReservation.setFieldValue('date', value);
              }
            }}
            minDate={new Date()}
            required
            label="Ημερομηνία"
            error={updatedReservation.errors.datetime}
          />
          <Group align="flex-end">
            <Select
              id={availableTimes.join()}
              allowDeselect={false}
              label="Ώρα"
              data={availableTimes}
              error={updatedReservation.errors.time}
              value={updatedReservation.getValues().time}
              multiple={false}
              required
              onChange={(value) => {
                if (!value) {
                  return;
                }

                updatedReservation.setFieldValue('time', value.trim());
              }}
            />
            {/* <TimeInput
              disabled={!editState}
              required
              inputMode="none"
              error={updatedReservation.errors.datetime}
              ref={timePickerRef}
              label="Ώρα"
              value={updatedReservation.getValues().datetime.split('T')[1]}
              // defaultValue="09:00"
              rightSection={timePickerControl}
              onChange={(e) => {
                if (e.target.value.trim()) {
                  updatedReservation.setFieldValue(
                    'datetime',
                    updateDatetime(
                      updatedReservation.getValues().datetime,
                      undefined,
                      e.target.value.trim()
                    )
                  );
                }
              }}
            /> */}
            <Text pb="6px">
              -&nbsp;&nbsp;&nbsp;
              {addMinutesToTime(
                formatedTime,
                updatedReservation.getValues().duration || 90
              )}
            </Text>
          </Group>
          <Input disabled defaultValue={court?.name} placeholder="Γήπεδο" />
          <Textarea
            disabled={!editState}
            placeholder="Σημειώσεις"
            defaultValue={reservation?.notes}
            onChange={(e) => {
              updatedReservation.setFieldValue('notes', e.target.value.trim());
            }}
          />
          <Stack w="100%" gap="sm">
            <Group w="100%" justify="space-between">
              <Text>{t('generic.form.fields.people')}</Text>
              {editState && (
                <ActionIcon
                  disabled={
                    (updatedReservation.getValues().people?.length || 0) >= 4 ||
                    !editState
                  }
                  variant="subtle"
                  color="dark"
                  onClick={() => {
                    const { people } = updatedReservation.getValues();

                    if ((people?.length || 0) >= 4) {
                      return;
                    }

                    updatedReservation.setFieldValue('people', [
                      ...(people || []),
                      '',
                    ]);
                  }}
                >
                  <IconUserPlus style={{ width: rem(16), height: rem(16) }} />
                </ActionIcon>
              )}
            </Group>
            <Stack gap="sm" w="100%">
              {updatedReservation.getValues().people?.map((person, index) => {
                return (
                  <Group
                    w="100%"
                    justify="space-between"
                    gap="sm"
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                  >
                    <Input
                      defaultValue={person}
                      onChange={(e) => {
                        updatedReservation.setFieldValue(
                          'people',
                          updatedReservation.getValues().people?.map((p, i) => {
                            if (i === index) {
                              return e.target.value.trim();
                            }

                            return p;
                          })
                        );
                      }}
                      disabled={!editState}
                      error={
                        Array.isArray(updatedReservation.errors.people)
                          ? updatedReservation.errors.people.includes(index)
                          : ''
                      }
                    />
                    {editState && (
                      <ActionIcon
                        disabled={
                          (updatedReservation.getValues().people?.length ||
                            0) <= 2
                        }
                        variant="subtle"
                        color="red"
                        onClick={() => {
                          updatedReservation.setFieldValue(
                            'people',
                            updatedReservation
                              .getValues()
                              .people?.filter((_, i) => i !== index)
                          );
                        }}
                      >
                        <IconCancel
                          style={{ width: rem(16), height: rem(16) }}
                        />
                      </ActionIcon>
                    )}
                  </Group>
                );
              })}
            </Stack>
            {updatedReservation.errors.people && (
              <Input.Error>
                {Array.isArray(updatedReservation.errors.people)
                  ? t('generic.form.errors.noPeopleNames')
                  : updatedReservation.errors.people}
              </Input.Error>
            )}
          </Stack>
        </Stack>
      </Paper>
    </Modal>
  );
};

export default ReservationDetails;

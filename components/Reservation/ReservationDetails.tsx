import {
  ActionIcon,
  Group,
  Input,
  LoadingOverlay,
  Modal,
  Paper,
  rem,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  IconCancel,
  IconCheck,
  IconClock,
  IconPencil,
  IconTrash,
  IconUserPlus,
} from '@tabler/icons-react';
import React, { useRef, useState } from 'react';

import { endpoints } from '@/lib/api/utils';
import { addMinutesToTime, formatDate } from '@/lib/common';
import { CourtDataType } from '@/models/Court';
import { ReservationDataType } from '@/models/Reservation';

const iconStyle = { width: rem(16), height: rem(16) };

const updateDatetime = (datetime: string, date?: string, time?: string) => {
  let res = datetime;

  if (time) {
    res = `${res.split('T')[0]}T${time}`;
  }

  if (date) {
    res = `${date}T${datetime.split('T')[1]}`;
  }

  return res;
};

export type ReservationDetailsProps = {
  reservation: ReservationDataType;
  opened: boolean;
  close: () => void;
  court: CourtDataType;
  editable?: boolean;
};

const ReservationDetails = ({
  reservation,
  opened,
  close,
  editable,
  court,
}: ReservationDetailsProps) => {
  const [editState, setEditState] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const updatedReservation = useForm({
    mode: 'uncontrolled',
    initialValues: {
      ...reservation,
    },
    validate: {
      people: (value) => {
        const errors: number[] = [];

        value.forEach((p, index) => {
          if (!p) {
            errors.push(index);
          }
        });

        return (
          (value.length <= 0 && 'people error no people') ||
          (!!errors.length && errors)
        );
      },
      datetime: (value) => {
        const courtMinTime = court.reservationsInfo.endTime;
        const courtMaxTime = court.reservationsInfo.startTime;

        const now = new Date();

        const isToday = formatDate(now).split('T')[0] === value.split('T')[0];

        const timeValid =
          !isToday || formatDate(now).split('T')[1] <= value.split('T')[1];

        return !(courtMinTime <= value && value <= courtMaxTime) || !timeValid
          ? 'time error'
          : false;
      },
    },
  });

  const date = new Date(updatedReservation.getValues().datetime);
  const formatedTime = formatDate(date).split('T')[1];

  const deleteReservation = async () => {
    setIsLoading(true);
    await endpoints.reservations.DELETE([updatedReservation.getValues()._id]);
    setIsLoading(false);
  };

  const updateReservation = async () => {
    setIsLoading(true);
    try {
      const res = await endpoints.reservations.PUT(
        updatedReservation.getValues()._id,
        updatedReservation.getValues()
      );

      if (res?.success) {
        notifications.show({
          message: 'Reservation updated',
          color: 'green',
        });
      } else {
        notifications.show({
          message: res?.errors[0].message,
          color: 'red',
        });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
      notifications.show({
        message: 'An unexpected error occured',
        color: 'red',
      });
    }
    setIsLoading(false);
  };

  const openDeleteModal = () => {
    modals.openConfirmModal({
      title: 'Διαγραφή κράτησης',
      centered: true,
      children: <Text size="sm">Η διαγραφή δεν μπορεί να αντιστραφεί</Text>,
      labels: { confirm: 'Διαγραφή', cancel: 'Ακύρωση' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteReservation,
    });
  };

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

  return (
    <Modal
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
            value={new Date(updatedReservation.getValues().datetime)}
            onChange={(value): void => {
              if (value) {
                updatedReservation.setFieldValue(
                  'datetime',
                  updateDatetime(
                    updatedReservation.getValues().datetime,
                    value.toUTCString().substring(0, 10)
                  )
                );
              }
            }}
            minDate={new Date()}
            required
            label="Ημερομηνία"
            error={updatedReservation.errors.datetime}
          />
          <Group align="flex-end">
            <TimeInput
              disabled={!editState}
              required
              inputMode="none"
              error={updatedReservation.errors.datetime}
              ref={timePickerRef}
              label="Ώρα"
              defaultValue="09:00"
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
            />
            <Text pb="6px">
              -&nbsp;&nbsp;&nbsp;
              {addMinutesToTime(
                formatedTime,
                updatedReservation.getValues().duration
              )}
            </Text>
          </Group>
          <Input disabled defaultValue={court.name} placeholder="Γήπεδο" />
          <Textarea
            disabled={!editState}
            placeholder="Σημειώσεις"
            defaultValue={reservation.notes}
            onChange={(e) => {
              updatedReservation.setFieldValue('notes', e.target.value.trim());
            }}
          />
          <Stack w="100%" gap="sm">
            <Group w="100%" justify="space-between">
              <Text>Άτομα</Text>
              {editState && (
                <ActionIcon
                  disabled={
                    updatedReservation.getValues().people.length >= 4 ||
                    !editState
                  }
                  variant="subtle"
                  color="dark"
                  onClick={() => {
                    const { people } = updatedReservation.getValues();

                    if (people.length >= 4) {
                      return;
                    }

                    updatedReservation.setFieldValue('people', [...people, '']);
                  }}
                >
                  <IconUserPlus style={{ width: rem(16), height: rem(16) }} />
                </ActionIcon>
              )}
            </Group>
            <Stack gap="sm" w="100%">
              {updatedReservation.getValues().people.map((person, index) => {
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
                          updatedReservation.getValues().people.map((p, i) => {
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
                        disabled={index === 0}
                        variant="subtle"
                        color="red"
                        onClick={() => {
                          updatedReservation.setFieldValue(
                            'people',
                            updatedReservation
                              .getValues()
                              .people.filter((_, i) => i !== index)
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
                  ? 'please add all names'
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

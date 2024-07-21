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
import { modals } from '@mantine/modals';
import {
  IconCancel,
  IconCheck,
  IconPencil,
  IconTrash,
  IconUserPlus,
} from '@tabler/icons-react';
import React, { useState } from 'react';

import { endpoints } from '@/lib/api/utils';
import { addMinutesToTime, formatDate } from '@/lib/common';
import { ReservationDataType } from '@/models/Reservation';

const iconStyle = { width: rem(16), height: rem(16) };

export interface ReservationDetailsProps {
  reservation: ReservationDataType;
  opened: boolean;
  close: () => void;
  editable?: boolean;
  courtLabel: string;
}

const ReservationDetails = ({
  reservation: r,
  opened,
  close,
  editable,
  courtLabel,
}: ReservationDetailsProps) => {
  const [editState, setEditState] = useState(false);
  const date = new Date(r.datetime);
  const formatedTime = formatDate(date).split('T')[1];
  const [isLoading, setIsLoading] = useState(false);

  const deleteReservation = async () => {
    setIsLoading(true);
    await endpoints.reservations.DELETE([r._id]);
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
              onClick={() => {
                setEditState(true);
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
          <Text>
            {date.toLocaleDateString('el-GR', {
              timeZone: 'Europe/Athens',
              weekday: 'long',
            })}{' '}
            {date.toLocaleDateString('el-GR', {
              month: '2-digit',
              day: 'numeric',
              timeZone: 'Europe/Athens',
            })}{' '}
            {formatedTime} - {addMinutesToTime(formatedTime, r.duration)}
          </Text>
          <Input disabled defaultValue={courtLabel} placeholder="Γήπεδο" />
          <Textarea
            disabled={!editState}
            placeholder="Σημειώσεις"
            defaultValue={r.notes}
          />
          <Stack w="100%" gap="sm">
            <Group w="100%" justify="space-between">
              <Text>Άτομα</Text>
              {editState && (
                <ActionIcon
                  disabled={r.people.length >= 4}
                  variant="subtle"
                  color="dark"
                  onClick={() => {
                    // const { people } = r;
                    // if (people.length >= 4) {
                    //   return;
                    // }
                    // newReservation.setFieldValue('people', [...people, '']);
                  }}
                >
                  <IconUserPlus style={{ width: rem(16), height: rem(16) }} />
                </ActionIcon>
              )}
            </Group>
            <Stack gap="sm" w="100%">
              {r.people.map((person, index) => {
                let error: string | undefined;

                // if (
                //   Array.isArray(newReservation.errors.people) &&
                //   newReservation.errors.people.includes(index)
                // ) {
                //   error = 'please add person name';
                // }

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
                      // onChange={(e) => {
                      //   // updatePeople(index, e.target.value);
                      // }}
                      error={error}
                      disabled={!editState}
                    />
                    {editState && (
                      <ActionIcon
                        disabled={index === 0}
                        variant="subtle"
                        color="red"
                        onClick={() => {
                          // newReservation.setFieldValue(
                          //   'people',
                          //   newReservation
                          //     .getValues()
                          //     .people.filter((_, i) => i !== index)
                          // );
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
            {/* {newReservation.errors.people && (
              <Input.Error>
                {Array.isArray(newReservation.errors.people)
                  ? 'please add all names'
                  : newReservation.errors.people}
              </Input.Error>
            )} */}
          </Stack>
        </Stack>
      </Paper>
    </Modal>
  );
};

export default ReservationDetails;

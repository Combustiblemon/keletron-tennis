import {
  ActionIcon,
  Button,
  Drawer,
  Group,
  MultiSelect,
  NumberInput,
  Popover,
  rem,
  Select,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { DatePicker, TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconClock, IconDeviceFloppy } from '@tabler/icons-react';
import React, { useRef } from 'react';

import { addMinutesToTime, formatDate, getMinutes } from '@/lib/common';
import { CourtDataType } from '@/models/Court';

import { dayData, typeData } from '../common';

const formId = 'new-reservation-info';

type ReservationInfo =
  CourtDataType['reservationsInfo']['reservedTimes'][number];

export interface ReservationInfoFormProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: ReservationInfo, index: number) => void;
  info: ReservationInfo;
  index: number;
}

const ReservationInfoForm = ({
  opened,
  onClose,
  onSubmit,
  info,
  index,
}: ReservationInfoFormProps) => {
  const res = useForm({
    mode: 'uncontrolled',
    initialValues: {
      duration: info?.duration || 60,
      type: info?.type || 'OTHER',
      repeat: info?.repeat || 'DAILY',
      startTime: info?.startTime || '09:00',
      notes: info?.notes || '',
      days: info?.days || ['MONDAY'],
      datesNotApplied: info?.datesNotApplied || [],
      endTime: '',
    } as CourtDataType['reservationsInfo']['reservedTimes'][number] & {
      endTime: string;
    } satisfies CourtDataType['reservationsInfo']['reservedTimes'][number],
    validate: {},
  });

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
  const handleNewReservationSubmit = res.onSubmit(async (values) => {
    onSubmit(values, index);
    onClose();
  });

  if (!res.getValues().endTime) {
    res.setFieldValue(
      'endTime',
      addMinutesToTime(res.getValues().startTime, res.getValues().duration)
    );
  }

  return (
    <Drawer
      opened={opened}
      onClose={() => {
        res.reset();
        onClose?.();
      }}
      title={
        <Group justify="space-between">
          <Text>Νέα Κράτηση</Text>
          <ActionIcon
            variant="subtle"
            type="submit"
            form={formId}
            color="green"
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
        <MultiSelect
          label="Ημέρα"
          data={dayData}
          defaultValue={res.getValues().days}
          onChange={(v) => {
            res.setFieldValue('days', v as ReservationInfo['days']);
          }}
        />
        <Stack>
          <TimeInput
            inputMode="none"
            ref={timePickerRef}
            label="Ώρα έναρξης"
            value={res.getValues().startTime}
            rightSection={timePickerControl}
            onChange={(v) => {
              res.setFieldValue('startTime', v.target.value);
            }}
          />
          <Group>
            <NumberInput
              value={res.getValues().duration}
              label="Διάρκεια"
              allowDecimal={false}
              trimLeadingZeroesOnBlur
              allowNegative={false}
              hideControls
              suffix="λ"
              onChange={(v) => {
                res.setFieldValue('duration', Number(v));
                res.setFieldValue(
                  'endTime',
                  addMinutesToTime(res.getValues().startTime, Number(v))
                );
              }}
            />
            <TimeInput
              error={res.errors.endTime}
              inputMode="none"
              ref={timePickerRef}
              label="Ώρα Λήξης"
              value={res.getValues().endTime}
              rightSection={timePickerControl}
              onChange={(v) => {
                if (v.target.value <= res.getValues().startTime) {
                  res.setFieldError('endTime', 'Πάνω στην ώρα έναρξης');
                  return;
                }

                res.clearFieldError('endTime');

                res.setFieldValue('endTime', v.target.value);
                res.setFieldValue(
                  'duration',
                  getMinutes(v.target.value, res.getValues().startTime)
                );
              }}
            />
          </Group>
          <Select
            label="Λόγος"
            data={typeData}
            allowDeselect={false}
            defaultValue={res.getValues().type}
            onChange={(v) => {
              res.setFieldValue('type', v as ReservationInfo['type']);
            }}
          />
          <Textarea
            label="Σημειώσεις"
            defaultValue={res.getValues().notes}
            onChange={(v) => {
              res.setFieldValue('notes', v.target.value.trim());
            }}
          />
          <Stack w="100%">
            <Group w="100%" justify="space-between">
              <Text size="sm">Ημ/νίες μη ισχύουσες:</Text>
              <Popover position="top-end" shadow="md">
                <Popover.Target>
                  <Button variant="outline" w="100px">
                    Επιλογή
                  </Button>
                </Popover.Target>
                <Popover.Dropdown>
                  <DatePicker
                    inputMode="none"
                    type="multiple"
                    value={res
                      .getValues()
                      .datesNotApplied?.map((d) => new Date(d))}
                    onChange={(value): void => {
                      res.setFieldValue(
                        'datesNotApplied',
                        value
                          .sort((a, b) => a.getTime() - b.getTime())
                          .map((d) => formatDate(d).split('T')[0])
                      );
                    }}
                    minDate={new Date()}
                  />
                </Popover.Dropdown>
              </Popover>
            </Group>
            <Text size="sm">{res.getValues().datesNotApplied?.join(', ')}</Text>
          </Stack>
        </Stack>
      </form>
    </Drawer>
  );
};

export default ReservationInfoForm;

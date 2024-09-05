import {
  ActionIcon,
  Checkbox,
  Drawer,
  Group,
  rem,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconDeviceFloppy } from '@tabler/icons-react';
import React from 'react';

import { formatDate } from '@/lib/common';
import { AnnouncementDataType } from '@/models/Announcement';

const formId = 'new-announcement';

export interface NewAnnouncementFormProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: Omit<AnnouncementDataType, '_id'>) => void;
}

const NewAnnouncementForm = ({
  opened,
  onClose,
  onSubmit,
}: NewAnnouncementFormProps) => {
  const newAnnouncement = useForm({
    mode: 'uncontrolled',
    initialValues: {
      title: '',
      validUntil: formatDate(new Date()).split('T')[0],
      visible: true,
      body: '',
      notification: false,
    } satisfies Omit<AnnouncementDataType, '_id'> & {
      notification: boolean;
    } as Omit<AnnouncementDataType, '_id'> & { notification: boolean },
    validate: {
      title: (value) => {
        return value.trim().length === 0 && 'Υποχρεωτικό πεδίο';
      },
    },
  });

  const handleNewAnnouncementSubmit = newAnnouncement.onSubmit(
    async (values) => {
      onSubmit(values);
      onClose();
    }
  );

  return (
    <Drawer
      opened={opened}
      onClose={() => {
        newAnnouncement.reset();
        onClose?.();
      }}
      title={
        <Group justify="space-between">
          <Text>Νέα Ανακοίνωση</Text>
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
        onSubmit={handleNewAnnouncementSubmit}
      >
        <Group align="flex-end">
          <DateInput
            required
            label="Εμφάνιση έως"
            defaultValue={new Date(newAnnouncement.getValues().validUntil)}
            onChange={(v) => {
              if (!v) {
                return;
              }

              newAnnouncement.setFieldValue(
                'validUntil',
                formatDate(v).split('T')[0]
              );
            }}
            allowDeselect={false}
            error={newAnnouncement.errors.validUntil}
          />
          <Checkbox
            mb="10px"
            label="Ειδοποίηση"
            onChange={(e) => {
              newAnnouncement.setFieldValue('notification', e.target.checked);
            }}
          />
        </Group>
        <Stack>
          <TextInput
            label="Τίτλος"
            required
            onChange={(e) =>
              newAnnouncement.setFieldValue('title', e.target.value.trim())
            }
            error={newAnnouncement.errors.title}
          />
          <Textarea
            label="Μήνυμα"
            error={newAnnouncement.errors.body}
            onChange={(e) =>
              newAnnouncement.setFieldValue('body', e.target.value.trim())
            }
          />
        </Stack>
      </form>
    </Drawer>
  );
};

export default NewAnnouncementForm;

import {
  ActionIcon,
  Button,
  Group,
  LoadingOverlay,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useDisclosure, useForceUpdate } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import { IconTrash, IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';

import { endpoints } from '@/lib/api/utils';
import { iconStyles } from '@/lib/common';

import NewAnnouncementForm from './NewAnnouncementForm';

const deleteAnnouncement = (_id: string) =>
  endpoints.admin.announcements.DELETE(_id);

const AdminAnnouncements = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [opened, { close, open }] = useDisclosure();
  const forceUpdate = useForceUpdate();

  const announcements = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => endpoints.admin.announcements.GET(),
  });

  const announcementData = useMemo(
    () => (announcements.data?.success ? announcements.data?.data : []),
    [announcements]
  );

  return (
    <Stack w="100%" pt="sm" flex={1}>
      <LoadingOverlay
        visible={announcements.isPending || isLoading}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
      />
      <NewAnnouncementForm
        onClose={close}
        opened={opened}
        onSubmit={async (values) => {
          setIsLoading(true);

          const res = await endpoints.admin.announcements.POST(values);

          if (res?.success) {
            showNotification({
              message: 'Επιτυχία δημιουργίας ανακοίνωσης',
              color: 'green',
            });

            announcementData.push(res.data);
            forceUpdate();
          } else {
            showNotification({
              message: res?.errors[0].message,
              color: 'red',
            });
          }

          setIsLoading(false);
        }}
      />
      <Group w="100%" justify="space-between">
        <Text size="sm">Ανακοινώσεις</Text>
        <Button
          variant="default"
          onClick={() => {
            open();
          }}
        >
          Νέα ανακοίνωση
        </Button>
      </Group>
      <Group align="flex-end">
        <TextInput
          label="Αναζήτηση"
          onChange={(e) => setSearchTerm(e.target.value.trim().toLowerCase())}
        />
        <ActionIcon
          variant="filled"
          color="red"
          onClick={() => setSearchTerm('')}
          mb="4px"
          disabled={!searchTerm}
        >
          <IconX style={iconStyles} />
        </ActionIcon>
      </Group>
      <ScrollArea h="400px" w="100%" scrollbars="y" type="auto">
        <Stack h="100%" w="100%">
          {announcementData
            .filter((a) =>
              searchTerm
                ? a.body?.toLowerCase().includes(searchTerm) ||
                  a.title.toLowerCase().includes(searchTerm)
                : true
            )
            .map((a, index) => (
              <Paper
                key={a._id}
                shadow="sm"
                withBorder
                w="100%"
                pos="relative"
                radius="md"
                p="sm"
              >
                <ActionIcon
                  variant="subtle"
                  color="red"
                  pos="absolute"
                  top="8px"
                  right="8px"
                  onClick={async () => {
                    const removed = announcementData.splice(index);
                    forceUpdate();

                    const res = await deleteAnnouncement(a._id);

                    if (!res?.success) {
                      announcementData.push(...removed);
                      forceUpdate();
                      showNotification({
                        message: res?.errors[0].message,
                        color: 'red',
                      });
                    }
                  }}
                >
                  <IconTrash style={iconStyles} />
                </ActionIcon>
                <Stack w="100%" pt="lg">
                  <Text size="sm">{a.title}</Text>
                  {!!a.body && <Text size="sm">{a.body}</Text>}
                  <Text size="sm">Νέο έως: {a.validUntil}</Text>
                </Stack>
              </Paper>
            ))}
        </Stack>
      </ScrollArea>
    </Stack>
  );
};

export default AdminAnnouncements;

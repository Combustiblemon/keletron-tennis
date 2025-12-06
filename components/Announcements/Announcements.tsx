import { Modal, Paper, Stack, Text } from '@mantine/core';
import { useDisclosure, useFocusTrap } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';

import { useApiClient } from '@/lib/api/hooks';
import { formatDate } from '@/lib/common';
import { useTranslation } from '@/lib/i18n/i18n';

const Announcements = () => {
  const [opened, { close, open }] = useDisclosure();
  const [modalInfo, setModalInfo] = useState<number>(-1);
  const focusTrapRef = useFocusTrap();
  const { t } = useTranslation();
  const api = useApiClient();

  const announcements = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.announcements.GET(),
  });

  const announcementData = useMemo(
    () =>
      announcements.data?.success
        ? announcements.data.data.filter(
            (a) => a.validUntil >= formatDate(new Date()).split('T')[0]
          )
        : [],
    [announcements]
  );

  return (
    !!announcementData.length && (
      <>
        <Modal opened={opened} onClose={close} key={modalInfo} centered>
          {!!announcementData[modalInfo] && (
            <Stack ref={focusTrapRef}>
              <Text size="md" fw="bold" ta="center">
                {announcementData[modalInfo].title}
              </Text>
              <Text size="sm">{announcementData[modalInfo].body}</Text>
            </Stack>
          )}
        </Modal>
        <Paper withBorder shadow="lg" w="100%" radius="md" p="md">
          <Stack>
            <Text size="md" fw="bold">
              {t('generic.components.Announcements.header')}
            </Text>
            {announcementData.map((a, index) => (
              <Paper
                withBorder
                shadow="sm"
                key={a._id}
                onClick={() => {
                  setModalInfo(index);
                  open();
                }}
                p="sm"
              >
                <Text size="md" fw="bold" ta="center">
                  {a.title}
                </Text>
              </Paper>
            ))}
          </Stack>
        </Paper>
      </>
    )
  );
};

export default Announcements;

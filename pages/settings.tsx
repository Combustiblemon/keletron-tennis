import {
  ActionIcon,
  Group,
  LoadingOverlay,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { endpoints } from '@/lib/api/utils';
import { iconStyles } from '@/lib/common';
import { useTranslation } from '@/lib/i18n/i18n';
import { UserDataType } from '@/models/User';

const Settings = () => {
  const session = useSession();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const userForm = useForm({
    initialValues: {
      name: '',
    } satisfies Pick<UserDataType, 'name'>,
    validate: {
      name: (value) => {
        return !!value.trim().length || t('generic.form.errors.required');
      },
    },
  });

  useEffect(() => {
    if (session.data?.user?.name && !userForm.getValues().name) {
      userForm.setFieldValue('name', session.data?.user?.name);
    }
  }, [session.data?.user?.name, userForm]);

  const saveUser = async () => {
    if (userForm.validate().hasErrors && session.data?.user?._id) {
      setIsLoading(true);
      const res = await endpoints.user.PUT(session.data?.user?._id, {
        name: userForm.getValues().name,
      });

      if (res?.success) {
        showNotification({
          color: 'green',
          message: t('settings.toast.success'),
        });
      }

      if (!res?.success) {
        showNotification({
          color: 'red',
          message: t('settings.toast.fail'),
        });
      }
    }
    setIsLoading(false);
  };

  return (
    <Stack w="100%">
      <LoadingOverlay
        visible={isLoading}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
      />
      <Group w="100%">
        <Text size="md" fw="bold">
          {t('settings.header')}
        </Text>
        <ActionIcon
          onClick={(e) => {
            e.stopPropagation();
            saveUser();
          }}
          variant="filled"
          color="green"
          disabled={userForm.validate().hasErrors}
        >
          <IconDeviceFloppy style={iconStyles} />
        </ActionIcon>
      </Group>
      <TextInput
        label={t('settings.nameInput.label')}
        defaultValue={session.data?.user?.name}
        onChange={(e) => {
          if (e.target.value.trim()) {
            userForm.setFieldValue('name', e.target.value.trim());
          }
        }}
        error={userForm.errors.name}
      />
    </Stack>
  );
};

export default Settings;

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
import { useRouter } from 'next/router';
import { useState } from 'react';

import { useUser } from '@/components/UserProvider/UserProvider';
import { endpoints } from '@/lib/api/utils';
import { iconStyles } from '@/lib/common';
import { useTranslation } from '@/lib/i18n/i18n';
import { UserDataType } from '@/models/User';

const Settings = () => {
  const { user, invalidateUser } = useUser();
  const { t } = useTranslation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const userForm = useForm({
    initialValues: {
      name: user.name,
    } satisfies Pick<UserDataType, 'name'>,
    validate: {
      name: (value) => {
        return !value.trim().length
          ? t('generic.form.errors.required')
          : undefined;
      },
    },
  });

  const saveUser = async () => {
    setIsLoading(true);

    if (!userForm.validate().hasErrors && user?._id) {
      const res = await endpoints.user.PUT({
        name: userForm.getValues().name,
      });

      if (res?.success) {
        showNotification({
          color: 'green',
          message: t('settings.toast.success'),
        });

        await invalidateUser();

        router.push('/');
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
          disabled={Boolean(userForm.errors.name?.toString())}
        >
          <IconDeviceFloppy style={iconStyles} />
        </ActionIcon>
      </Group>
      <TextInput
        label={t('settings.nameInput.label')}
        defaultValue={user?.name}
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

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

import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import { useUser } from '@/components/UserProvider/UserProvider';
import { useApiClient } from '@/lib/api/hooks';
import { iconStyles } from '@/lib/common';
import { useTranslation } from '@/lib/i18n/i18n';
import { UserDataType } from '@/models/User';

const Settings = () => {
  const { user, invalidateUser } = useUser();
  const { t } = useTranslation();
  const router = useRouter();
  const api = useApiClient();
  const [isLoading, setIsLoading] = useState(false);

  const userForm = useForm({
    initialValues: {
      firstname: user.firstname,
      lastname: user.lastname,
    } satisfies Pick<UserDataType, 'firstname' | 'lastname'>,
    validate: {
      firstname: (value) => {
        return !value.trim().length
          ? t('generic.form.errors.required')
          : undefined;
      },
      lastname: (value) => {
        return !value.trim().length
          ? t('generic.form.errors.required')
          : undefined;
      },
    },
  });

  const saveUser = async () => {
    setIsLoading(true);

    if (!userForm.validate().hasErrors && user?._id) {
      const res = await api.user.PUT({
        firstname: userForm.getValues().firstname,
        lastname: userForm.getValues().lastname,
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
      <Group gap="md">
        <TextInput
          label="Όνομα"
          defaultValue={user?.firstname}
          onChange={(e) => {
            if (e.target.value.trim()) {
              userForm.setFieldValue('firstname', e.target.value.trim());
            }
          }}
          error={userForm.errors.firstname}
        />
        <TextInput
          label="Επίθετο"
          defaultValue={user?.lastname}
          onChange={(e) => {
            if (e.target.value.trim()) {
              userForm.setFieldValue('lastname', e.target.value.trim());
            }
          }}
          error={userForm.errors.lastname}
        />
      </Group>
    </Stack>
  );
};

const ProtectedSettings = () => {
  return (
    <ProtectedRoute>
      <Settings />
    </ProtectedRoute>
  );
};

export default ProtectedSettings;

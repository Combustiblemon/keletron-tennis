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
import { useEffect, useState } from 'react';

import { useUser } from '@/components/UserProvider/UserProvider';
import { endpoints } from '@/lib/api/utils';
import { iconStyles } from '@/lib/common';
import { useTranslation } from '@/lib/i18n/i18n';
import { UserType } from '@/models/User';

const Settings = () => {
  const userData = useUser();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const userForm = useForm({
    initialValues: {
      name: '',
    } satisfies Pick<UserType, 'name'>,
    validate: {
      name: (value) => {
        return !!value.trim().length || t('generic.form.errors.required');
      },
    },
  });

  useEffect(() => {
    if (userData.user?.name && !userForm.getValues().name) {
      userForm.setFieldValue('name', userData.user?.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData.user?.name]);

  const saveUser = async () => {
    if (userForm.validate().hasErrors && userData.user?._id) {
      setIsLoading(true);
      const res = await endpoints.user.PUT({
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
        defaultValue={userData.user?.name}
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

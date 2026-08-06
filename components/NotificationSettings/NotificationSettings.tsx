import { Alert, Button, Stack, Text } from '@mantine/core';
import { IconBellOff, IconInfoCircle } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { isInstalled, isIOS } from '@/lib/common';
import { useTranslation } from '@/lib/i18n/i18n';
import { firebaseCloudMessaging } from '@/lib/webPush';

/**
 * Notification settings panel, rendered as a custom page inside Clerk's
 * <UserProfile> on /settings.
 *
 * The enable button is a user-gesture path: firebaseCloudMessaging.enable()
 * prompts for permission (required on iOS PWAs, where non-gesture prompts are
 * silently rejected) and then obtains an FCM token. The token is registered
 * with the backend by UserProvider's ['fcm-token'] query, which gets
 * invalidated here after a token is obtained.
 */
const NotificationSettings = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [permission, setPermission] = useState(() =>
    firebaseCloudMessaging.getPermission()
  );
  const [hasToken, setHasToken] = useState(() =>
    firebaseCloudMessaging.hasToken()
  );
  const [isEnabling, setIsEnabling] = useState(false);
  const [failed, setFailed] = useState(false);

  const needsInstall = isIOS() && !isInstalled();

  const onEnable = async () => {
    setIsEnabling(true);
    setFailed(false);

    // Gesture path: requestPermission is the first await inside enable().
    const token = await firebaseCloudMessaging.enable();

    setPermission(firebaseCloudMessaging.getPermission());
    setHasToken(!!token);

    if (token) {
      // UserProvider's query re-runs and PUTs the token to the backend.
      await queryClient.invalidateQueries({ queryKey: ['fcm-token'] });
    } else if (firebaseCloudMessaging.getPermission() === 'granted') {
      setFailed(true);
    }

    setIsEnabling(false);
  };

  let content: React.ReactNode;

  if (permission === 'unsupported') {
    content = needsInstall ? (
      <Alert icon={<IconInfoCircle />} color="blue">
        {t('settings.notifications.installFirst')}
      </Alert>
    ) : (
      <Alert icon={<IconInfoCircle />} color="gray">
        {t('settings.notifications.unsupported')}
      </Alert>
    );
  } else if (permission === 'denied') {
    content = (
      <Alert icon={<IconBellOff />} color="yellow">
        <Stack gap="xs">
          <Text size="sm" fw="bold">
            {t('settings.notifications.status.denied')}
          </Text>
          <Text size="sm">{t('settings.notifications.deniedHint')}</Text>
        </Stack>
      </Alert>
    );
  } else if (hasToken) {
    content = (
      <Text size="sm" c="green">
        {t('settings.notifications.status.granted')}
      </Text>
    );
  } else {
    content = (
      <Stack gap="xs">
        <Button onClick={onEnable} loading={isEnabling} w="fit-content">
          {t('settings.notifications.enableButton')}
        </Button>
        {failed ? (
          <Text size="sm" c="red">
            {t('settings.notifications.error')}
          </Text>
        ) : null}
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Stack gap={4}>
        <Text size="lg" fw="bold">
          {t('settings.notifications.header')}
        </Text>
        <Text size="sm" c="dimmed">
          {t('settings.notifications.description')}
        </Text>
      </Stack>
      {content}
    </Stack>
  );
};

export default NotificationSettings;

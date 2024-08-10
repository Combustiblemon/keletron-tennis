import { Button, Stack, Text } from '@mantine/core';
import { useRouter } from 'next/navigation';

import Announcements from '@/components/Announcements/Announcements';
import { useTranslation } from '@/lib/i18n/i18n';

const LoggedOutHomepage = () => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Stack w="100%" justify="flex-start" align="center" h="100%">
      <Text size="lg">{`${t('loggedOutHomepage.welcome')}`}</Text>
      <Announcements />
      <Button
        variant="filled"
        onClick={() => router.push('/auth')}
      >{`${t('auth.login')}`}</Button>
    </Stack>
  );
};

export default LoggedOutHomepage;

import { Button, Stack, Text } from '@mantine/core';
import { useRouter } from 'next/navigation';

import { useUser } from '@/components/UserProvider/UserProvider';
import { useTranslation } from '@/lib/i18n/i18n';

const LoggedOutHomepage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { invalidateUser } = useUser();

  return (
    <Stack w="100%" justify="flex-start" align="center" h="100%">
      <Text size="lg">{`${t('loggedOutHomepage.welcome')}`}</Text>
      <Button
        variant="filled"
        onClick={() => router.push('/auth')}
      >{`${t('auth.login')}`}</Button>
      <Button variant="filled" onClick={async () => invalidateUser()}>
        invalidate user
      </Button>
    </Stack>
  );
};

export default LoggedOutHomepage;

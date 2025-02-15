/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Button,
  Divider,
  Group,
  LoadingOverlay,
  Paper,
  PaperProps,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { upperFirst, useDisclosure, useToggle } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/router';

import { useUser } from '@/components/UserProvider/UserProvider';
import { Errors } from '@/lib/api/common';
import { login, verifyLogin } from '@/lib/common';
import { useTranslation } from '@/lib/i18n/i18n';
import { firebaseCloudMessaging } from '@/lib/webPush';

const AuthenticationForm = (props: PaperProps) => {
  const router = useRouter();
  const { t, tError } = useTranslation();
  const {
    // isAuthenticated
    invalidateUser,
  } = useUser();

  const [isLoading, { close: setIsLoaded, open: setIsLoading }] =
    useDisclosure(false);
  const [type, toggleType] = useToggle<'login' | 'verify'>(['login', 'verify']);
  const form = useForm({
    initialValues: {
      email: '',
      loginCode: '',
    },

    validate: {
      email: (val) => {
        let error = null;

        if (!val) {
          error = t('generic.form.errors.required');
        } else if (/^\S+@\S+$/.test(val) === false) {
          error = t('auth.form.emailInput.invalid');
        }

        return error;
      },
      loginCode: (val) => {
        let error = null;

        if (type === 'login') {
          return null;
        }

        if (!val) {
          error = t('generic.form.errors.required');
        } else if (/^[0-9]{6}$/.test(val) === false) {
          error = t('Ο κωδικός δεν είναι έγκυρος');
        }

        return error;
      },
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setIsLoading();

    switch (type) {
      case 'verify':
        {
          const res = await verifyLogin({
            loginCode: values.loginCode,
            email: values.email,
            FCMToken: await firebaseCloudMessaging.getToken(),
          });

          if (res?.errors?.length) {
            notifications.show({
              message: tError(res.errors[0].message as Errors),
              color: 'red',
            });
          }

          if (res?.success) {
            notifications.show({
              message: `Επιτυχής σύνδεση`,
              color: 'green',
            });

            await invalidateUser();

            // console.log('res', res);

            if (!(res?.data as any).firstname || !(res?.data as any).lastname) {
              router.push('/settings');
              return;
            }

            router.push('/');
          }
        }
        break;
      case 'login':
      default:
        {
          const res = await login({
            email: values.email,
            FCMToken: await firebaseCloudMessaging.getToken(),
          });

          if (res?.errors?.length) {
            notifications.show({
              message: tError(res.errors[0].message as Errors),
              color: 'red',
            });
          }

          if (res?.success) {
            notifications.show({
              message: `Επιτυχής αποστολή email`,
              color: 'green',
            });

            toggleType('verify');
          }
        }
        break;
    }

    setIsLoaded();
  });

  // if (isAuthenticated) {
  //   router.push('/');
  //   return null;
  // }

  return (
    <Paper radius="md" p="xl" pos="relative" {...props}>
      <LoadingOverlay
        visible={isLoading}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
      />

      <Stack gap="lg">
        <Text size="lg" fw={500}>
          {t(`auth.${type}`)}
        </Text>
      </Stack>

      <Divider my="lg" />

      <form onSubmit={handleSubmit}>
        <Stack>
          {(() => {
            if (type === 'login') {
              return (
                <TextInput
                  required
                  label={t('auth.form.emailInput.label')}
                  placeholder="hello@example.com"
                  value={form.values.email}
                  type="text"
                  onChange={(event) =>
                    form.setFieldValue(
                      'email',
                      event.currentTarget.value.trim()
                    )
                  }
                  error={form.errors.email}
                  radius="md"
                />
              );
            }

            if (type === 'verify') {
              return (
                <>
                  <Text size="md">
                    Σας έχει αποσταλθεί ο κωδικός σύνδεσης στο email&nbsp;
                    {form.values.email}. Παρακαλώ ελέξτε τα ανεπιθύμητα μηνύματα
                    εαν δεν βρήσκετε το email.
                  </Text>
                  <TextInput
                    required
                    label="Κωδικός σύνδεσης"
                    value={form.values.loginCode}
                    type="text"
                    onChange={(event) =>
                      form.setFieldValue(
                        'loginCode',
                        event.currentTarget.value.trim()
                      )
                    }
                    error={form.errors.email}
                    radius="md"
                  />
                </>
              );
            }

            return null;
          })()}
        </Stack>

        <Group justify="space-between" mt="xl">
          <Button type="submit" radius="xl" loading={isLoading}>
            {upperFirst(type)}
          </Button>
        </Group>
      </form>
    </Paper>
  );
};

export default AuthenticationForm;

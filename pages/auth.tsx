import {
  Anchor,
  Button,
  Divider,
  Group,
  LoadingOverlay,
  Paper,
  PaperProps,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { upperFirst, useDisclosure, useToggle } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { GoogleButton } from '@/components/GoogleButton/GoogleButton';
import { useUser } from '@/components/UserProvider/UserProvider';
import { Errors } from '@/lib/api/common';
import { login } from '@/lib/common';
import { useTranslation } from '@/lib/i18n/i18n';
import { firebaseCloudMessaging } from '@/lib/webPush';

const AuthenticationForm = (props: PaperProps) => {
  const router = useRouter();
  const userData = useUser();
  const { t, tError } = useTranslation();

  const [isLoading, { close: setIsLoaded, open: setIsLoading }] =
    useDisclosure(false);
  const [type, toggleType] = useToggle<'login' | 'register'>([
    'login',
    'register',
  ]);
  const form = useForm({
    initialValues: {
      email: '',
      name: '',
      password: '',
      repeatPassword: '',
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
      password: (val) => {
        let error = null;

        if (!val) {
          error = t('generic.form.errors.required');
        } else if (val.length < 6) {
          error = t('auth.form.passwordInput.minLength');
        }

        return error;
      },
      repeatPassword: (val) => {
        if (type === 'login') return null;

        let error = null;

        if (!val) {
          error = t('generic.form.errors.required');
        } else if (val.length < 6) {
          error = t('auth.form.passwordInput.minLength');
        }

        return error;
      },
      name: (val) => {
        if (type === 'login') return null;

        let error = null;

        if (!val) {
          error = t('generic.form.errors.required');
        }

        return error;
      },
    },
  });

  useEffect(() => {
    const authType = new URLSearchParams(window.location.search).get('type');

    if (authType === 'register') {
      toggleType('register');
    } else if (authType === 'login') {
      toggleType('login');
    }
  }, [toggleType]);

  const handleSubmit = form.onSubmit(async (values) => {
    setIsLoading();

    if (type === 'register' && values.password !== values.repeatPassword) {
      form.setFieldError('password', tError(Errors.PASSWORDS_DO_NOT_MATCH));
      form.setFieldError(
        'repeatPassword',
        tError(Errors.PASSWORDS_DO_NOT_MATCH)
      );
      return;
    }

    let res: Awaited<ReturnType<typeof login>> = {
      endpoint: 'login',
      success: false,
      errors: [],
    };

    switch (type) {
      case 'login':
        res = await login(router, 'login', {
          redirect: false,
          email: values.email,
          password: values.password,
          FCMToken: await firebaseCloudMessaging.getToken(),
        });
        break;

      case 'register':
        res = await login(router, 'register', {
          redirect: false,
          email: values.email,
          password: values.password,
          name: values.name,
          FCMToken: await firebaseCloudMessaging.getToken(),
        });
        break;

      default:
        break;
    }

    if (res?.errors?.length) {
      notifications.show({
        message: tError(res.errors[0].message as Errors),
        color: 'red',
      });
    }

    if (res?.data?.ok) {
      notifications.show({
        message: t(`auth.${type}Success`),
        color: 'green',
      });

      router.push('/');
    }

    setIsLoaded();
  });

  if (userData.isAuthenticated) {
    router.push('/');
    return null;
  }

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
        {type === 'login' && (
          <GoogleButton
            onClick={() => {
              login(router, 'google');
            }}
          >
            {t('auth.googleLogin.login')}
          </GoogleButton>
        )}
      </Stack>

      <Divider my="lg" />

      <form onSubmit={handleSubmit}>
        <Stack>
          {type === 'register' && (
            <TextInput
              required
              label={t('auth.form.nameInput.label')}
              placeholder={t('auth.form.nameInput.placeholder')}
              onChange={(event) =>
                form.setFieldValue('name', event.currentTarget.value.trim())
              }
              error={form.errors.name}
              radius="md"
            />
          )}

          <TextInput
            required
            label={t('auth.form.emailInput.label')}
            placeholder="hello@example.com"
            value={form.values.email}
            type="text"
            onChange={(event) =>
              form.setFieldValue('email', event.currentTarget.value.trim())
            }
            error={form.errors.email}
            radius="md"
          />

          <PasswordInput
            required
            label={t('auth.form.passwordInput.label')}
            placeholder={t('auth.form.passwordInput.placeholder')}
            value={form.values.password}
            onChange={(event) =>
              form.setFieldValue('password', event.currentTarget.value.trim())
            }
            error={form.errors.password}
            radius="md"
          />

          {type === 'register' && (
            <PasswordInput
              required
              label={t('auth.form.repeatPasswordInput.label')}
              placeholder={t('auth.form.repeatPasswordInput.placeholder')}
              value={form.values.repeatPassword}
              onChange={(event) =>
                form.setFieldValue(
                  'repeatPassword',
                  event.currentTarget.value.trim()
                )
              }
              error={form.errors.password}
              radius="md"
            />
          )}
        </Stack>

        <Group justify="space-between" mt="xl">
          <Anchor
            component="button"
            type="button"
            c="dimmed"
            onClick={() => toggleType()}
            size="xs"
          >
            {t(`auth.${type}Prompt`)}
          </Anchor>
          <Button type="submit" radius="xl" loading={isLoading}>
            {upperFirst(type)}
          </Button>
        </Group>
      </form>
    </Paper>
  );
};

export default AuthenticationForm;

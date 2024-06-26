import {
  Anchor,
  Button,
  Checkbox,
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
import { useRouter } from 'next/router';
import { signIn, useSession } from 'next-auth/react';
import { useEffect } from 'react';

import { Errors } from '@/lib/api/common';

const AuthenticationForm = (props: PaperProps) => {
  const router = useRouter();
  const { status } = useSession();

  const [isLoading, { close: setIsLoaded, open: setIsLoading }] =
    useDisclosure(false);
  const [type, toggleType] = useToggle(['login', 'register']);
  const form = useForm({
    initialValues: {
      email: '',
      name: '',
      password: '',
      repeatPassword: '',
      terms: true,
    },

    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email'),
      password: (val) =>
        val.length <= 6
          ? 'Password should include at least 6 characters'
          : null,
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

    if (!values.password || values.password.length < 6) {
      form.setFieldError(
        'password',
        'Password should include at least 6 characters'
      );
      return;
    }

    if (
      type === 'register' &&
      (!values.repeatPassword || values.repeatPassword.length < 6)
    ) {
      form.setFieldError(
        'repeatPassword',
        'Password should include at least 6 characters'
      );
      return;
    }

    if (type === 'register' && values.password !== values.repeatPassword) {
      form.setFieldError('password', 'Passwords do not match');
      form.setFieldError('repeatPassword', 'Passwords do not match');
      return;
    }

    if (type === 'register' && !values.terms) {
      form.setFieldError('terms', 'You should accept terms and conditions');
      return;
    }

    let res;

    switch (type) {
      case 'login':
        res = await signIn('login', {
          redirect: false,
          email: values.email,
          password: values.password,
        });
        break;

      case 'register':
        res = await signIn('register', {
          redirect: false,
          email: values.email,
          password: values.password,
          name: values.name,
        });
        break;

      default:
        break;
    }

    switch (res?.error) {
      case Errors.INVALID_CREDENTIALS:
        notifications.show({
          message: 'Invalid email or password',
          color: 'red',
        });
        break;

      case Errors.LOGIN_ERROR:
        notifications.show({
          message: 'Login error, please check your credentials and try again',
          color: 'red',
        });
        break;

      case Errors.INTERNAL_SERVER_ERROR:
        notifications.show({
          message: 'Internal server error, please try again later',
          color: 'red',
        });
        break;

      case Errors.USER_EXISTS:
        notifications.show({
          message: 'User with this email already exists',
          color: 'red',
        });
        break;

      default:
        if (res?.error) {
          notifications.show({
            message: 'An unexpected error occurred, please try again later',
            color: 'red',
          });
        }
        break;
    }

    if (res?.ok) {
      notifications.show({
        message: 'You have successfully logged in',
        color: 'green',
      });

      router.push('/');
    }

    setIsLoaded();
  });

  if (status === 'authenticated') {
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

      <Text size="lg" fw={500}>
        Συνδεθείτε στο λογαριασμό σας
      </Text>

      <Divider my="lg" />

      <form onSubmit={handleSubmit}>
        <Stack>
          {type === 'register' && (
            <TextInput
              required
              label="Name"
              placeholder="Your name"
              value={form.values.name}
              onChange={(event) =>
                form.setFieldValue('name', event.currentTarget.value)
              }
              radius="md"
            />
          )}

          <TextInput
            required
            label="Email"
            placeholder="hello@example.com"
            value={form.values.email}
            onChange={(event) =>
              form.setFieldValue('email', event.currentTarget.value)
            }
            error={form.errors.email && 'Invalid email'}
            radius="md"
          />

          <PasswordInput
            required
            label="Password"
            placeholder="Your password"
            value={form.values.password}
            onChange={(event) =>
              form.setFieldValue('password', event.currentTarget.value)
            }
            error={form.errors.password}
            radius="md"
          />

          {type === 'register' && (
            <>
              <PasswordInput
                required
                label="Repeat password"
                placeholder="Your password"
                value={form.values.repeatPassword}
                onChange={(event) =>
                  form.setFieldValue(
                    'repeatPassword',
                    event.currentTarget.value
                  )
                }
                error={form.errors.password}
                radius="md"
              />

              <Checkbox
                label="I accept terms and conditions"
                checked={form.values.terms}
                onChange={(event) =>
                  form.setFieldValue('terms', event.currentTarget.checked)
                }
                error={form.errors.terms}
              />
            </>
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
            {type === 'register'
              ? 'Already have an account? Login'
              : "Don't have an account? Register"}
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

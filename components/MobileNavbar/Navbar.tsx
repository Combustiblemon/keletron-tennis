import {
  AppShell,
  Box,
  Burger,
  Divider,
  Group,
  Image,
  rem,
  Select,
  Stack,
  Switch,
  Text,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { useDisclosure, useMounted } from '@mantine/hooks';
import { IconMoonStars, IconSun } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

import { Language, useLanguage } from '@/context/LanguageContext';
import { logout } from '@/lib/common';
import { useTranslation } from '@/lib/i18n/i18n';

export type NavItem =
  | {
      title: string;
      href: string;
      onClick?: never;
    }
  | {
      title: string;
      onClick: () => void;
      href?: never;
    }
  | 'divider'
  | null;

export const Navbar = ({ children }: { children: React.ReactNode }) => {
  const [opened, { toggle }] = useDisclosure();
  const router = useRouter();
  const { status, data } = useSession();
  const { t } = useTranslation();
  const [lang, setLang] = useLanguage();
  const { setColorScheme, colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const mounted = useMounted();

  function getNavItems(items: Array<NavItem>) {
    return items.map((item, index) => {
      if (!item) {
        return undefined;
      }

      if (item === 'divider') {
        // eslint-disable-next-line react/no-array-index-key
        return <Divider key={`divider-${index}`} />;
      }

      return (
        <Text
          key={item.href || item.title}
          onClick={() => {
            toggle();

            if (item.onClick) {
              item.onClick();
              return;
            }

            if (window.location.pathname === item.href) return;
            router.push(item.href);
          }}
          pl="sm"
        >
          {item.title}
        </Text>
      );
    });
  }

  const navItems: NavItem[] = useMemo(
    () => [
      { title: t('Navbar.home'), href: '/' },
      ...[
        status === 'authenticated'
          ? {
              title: t('Navbar.reservations'),
              href: '/reservations',
            }
          : null,
      ],
      ...[
        data?.user?.role === 'ADMIN'
          ? {
              title: 'Admin',
              href: '/admin',
            }
          : null,
      ],
      'divider',
      // { title: t('Navbar.settings'), href: '/settings' },
      // { title: 'About', href: '/about' },
      // { title: 'Contact', href: '/contact' },
      status === 'authenticated'
        ? {
            title: t('auth.logout'),
            onClick: async () => {
              logout(router);
            },
          }
        : { title: t('auth.login'), href: '/auth?type=login' },
    ],
    [data?.user?.role, router, status, t]
  );

  const sunIcon = (
    <IconSun
      style={{ width: rem(16), height: rem(16) }}
      stroke={2.5}
      color={theme.colors.yellow[4]}
    />
  );

  const moonIcon = (
    <IconMoonStars
      style={{ width: rem(16), height: rem(16) }}
      stroke={2.5}
      color={theme.colors.blue[6]}
    />
  );

  return (
    mounted && (
      <AppShell
        styles={{
          navbar: {
            borderWidth: 2,
          },
          header: {
            borderWidth: 2,
          },
        }}
        header={{ height: 60 }}
        navbar={{
          width: 300,
          breakpoint: 'sm',
          collapsed: { desktop: true, mobile: !opened },
        }}
        padding="md"
      >
        <AppShell.Header h="60px">
          <Group h="100%" px="md" pos="relative">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Image
              src="/android-chrome-192x192.png"
              alt="logo"
              visibleFrom="sm"
              h="50px"
            />
            <Box pos="absolute" right="16px">
              <Image
                src="/android-chrome-192x192.png"
                alt="logo"
                h="50px"
                hiddenFrom="sm"
              />
            </Box>
            <Group justify="space-between" style={{ flex: 1 }} visibleFrom="sm">
              <Group ml="xl" gap={0} visibleFrom="sm">
                {getNavItems(navItems)}
              </Group>
            </Group>
            <Group visibleFrom="sm" gap="lg">
              <Select
                visibleFrom="sm"
                value={lang}
                styles={{
                  wrapper: {
                    width: '40px',
                  },
                  section: {
                    display: 'none',
                  },
                  input: {
                    padding: '10px',
                  },
                }}
                data={[
                  { value: 'en', label: '🇬🇧' },
                  { value: 'el', label: '🇬🇷' },
                ]}
                onChange={(v) => {
                  setLang(v as Language);
                }}
                comboboxProps={{ width: 80, position: 'bottom-start' }}
                allowDeselect={false}
              />
              <Switch
                size="md"
                color="dark.4"
                onLabel={sunIcon}
                offLabel={moonIcon}
              />
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar py="md" px={4}>
          <Stack justify="space-between" h="100%">
            <Stack gap="xs">{getNavItems(navItems)}</Stack>
            <Group w="100%" justify="center" gap="lg">
              <Select
                value={lang}
                styles={{
                  wrapper: {
                    width: '40px',
                  },
                  section: {
                    display: 'none',
                  },
                  input: {
                    padding: '10px',
                  },
                }}
                data={[
                  { value: 'en', label: '🇬🇧' },
                  { value: 'el', label: '🇬🇷' },
                ]}
                onChange={(v) => {
                  setLang(v as Language);
                }}
                comboboxProps={{ width: 80, position: 'bottom-start' }}
                allowDeselect={false}
              />
              <Switch
                size="md"
                color="dark.4"
                onLabel={sunIcon}
                offLabel={moonIcon}
                checked={colorScheme === 'dark'}
                onChange={() =>
                  setColorScheme(colorScheme === 'light' ? 'dark' : 'light')
                }
              />
            </Group>
          </Stack>
        </AppShell.Navbar>

        <AppShell.Main h="calc(100dvh - 60px)" display="flex" w="100dvw">
          {children}
        </AppShell.Main>
      </AppShell>
    )
  );
};

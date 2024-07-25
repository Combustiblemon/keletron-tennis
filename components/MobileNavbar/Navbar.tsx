import {
  AppShell,
  Burger,
  Divider,
  Group,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

import { logout } from '@/lib/common';
import { useTranslation } from '@/lib/i18n/i18n';

import classes from './Navbar.module.css';

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

function getNavItems(
  items: Array<NavItem>,
  toggle: () => void,
  router: AppRouterInstance
) {
  return items.map((item, index) => {
    if (!item) {
      return undefined;
    }

    if (item === 'divider') {
      // eslint-disable-next-line react/no-array-index-key
      return <Divider key={`divider-${index}`} />;
    }

    return (
      <UnstyledButton
        key={item.href || item.title}
        className={classes.control}
        onClick={() => {
          toggle();

          if (item.onClick) {
            item.onClick();
            return;
          }

          if (window.location.pathname === item.href) return;
          router.push(item.href);
        }}
      >
        {item.title}
      </UnstyledButton>
    );
  });
}

export const Navbar = ({ children }: { children: React.ReactNode }) => {
  const [opened, { toggle }] = useDisclosure();
  const router = useRouter();
  const { status } = useSession();
  const { t } = useTranslation();

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
      'divider',
      { title: t('Navbar.settings'), href: '/settings' },
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
    [router, status, t]
  );

  return (
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
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Group justify="space-between" style={{ flex: 1 }}>
            <Group ml="xl" gap={0} visibleFrom="sm">
              {getNavItems(navItems, toggle, router)}
            </Group>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar py="md" px={4}>
        {getNavItems(navItems, toggle, router)}
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
};

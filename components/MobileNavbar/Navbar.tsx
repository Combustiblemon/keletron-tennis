import { AppShell, Burger, Group, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useRouter } from 'next/navigation';

import classes from './Navbar.module.css';

export type NavItem = {
  title: string;
  href: string;
};

function getNavItems(
  items: Array<NavItem>,
  toggle: () => void,
  router: AppRouterInstance
) {
  return items.map((item) => (
    <UnstyledButton
      key={item.href}
      className={classes.control}
      onClick={() => {
        toggle();

        if (window.location.pathname === item.href) return;
        router.push(item.href);
      }}
    >
      {item.title}
    </UnstyledButton>
  ));
}

export const Navbar = ({
  children,
  navItems,
}: {
  children: React.ReactNode;
  navItems: Array<NavItem>;
}) => {
  const [opened, { toggle }] = useDisclosure();
  const router = useRouter();

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

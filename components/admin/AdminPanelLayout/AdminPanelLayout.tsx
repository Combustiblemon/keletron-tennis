import { Box, Flex, NavLink } from '@mantine/core';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { ProtectedRoute } from '@/components/ProtectedRoute/ProtectedRoute';

const links = [
  { href: '/admin', label: 'Κρατήσεις' },
  { href: '/admin/courts', label: 'Γήπεδα' },
  { href: '/admin/users', label: 'Χρήστες' },
] as const;

export const AdminPanelLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const router = useRouter();

  return (
    <ProtectedRoute requireAdmin>
      <Flex
        direction="column"
        gap="md"
        h="100%"
        w="100%"
        style={{ minHeight: 0, minWidth: 0 }}
      >
        <Box
          component="nav"
          w="100%"
          style={{
            flexShrink: 0,
            overflowX: 'auto',
            overscrollBehaviorX: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <Flex gap="xs" wrap="nowrap" w="max-content">
            {links.map(({ href, label }) => (
              <NavLink
                key={href}
                component={Link}
                href={href}
                label={label}
                color="red"
                variant="light"
                active={
                  href === '/admin'
                    ? router.pathname === '/admin'
                    : router.pathname === href
                }
                style={{ flex: '0 0 auto' }}
                styles={{
                  root: {
                    whiteSpace: 'nowrap',
                    width: 'fit-content',
                  },
                }}
              />
            ))}
          </Flex>
        </Box>
        <Box flex={1} h="100%" style={{ minHeight: 0, minWidth: 0 }} w="100%">
          {children}
        </Box>
      </Flex>
    </ProtectedRoute>
  );
};

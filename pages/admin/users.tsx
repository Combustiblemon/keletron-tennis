import { Center, Text } from '@mantine/core';

import { AdminPanelLayout } from '@/components/admin/AdminPanelLayout/AdminPanelLayout';

const AdminUsersPage = () => {
  return (
    <AdminPanelLayout>
      <Center w="100%" py="xl">
        <Text c="dimmed">Χρήστες</Text>
      </Center>
    </AdminPanelLayout>
  );
};

export default AdminUsersPage;

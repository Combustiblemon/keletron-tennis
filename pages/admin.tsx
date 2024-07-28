import { Tabs } from '@mantine/core';

import AdminReservations from '@/components/admin/AdminReservations/AdminReservations';

const Admin = () => {
  return (
    <Tabs
      color="red"
      variant="outline"
      radius="xs"
      defaultValue="reservations"
      w="100%"
      h="100%"
      display="flex"
      styles={{
        root: {
          flexDirection: 'column',
        },
      }}
    >
      <Tabs.List>
        <Tabs.Tab value="reservations">Κρατήσεις</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel
        value="reservations"
        flex={1}
        display="flex"
        styles={{
          panel: { flexDirection: 'column' },
        }}
      >
        <AdminReservations />
      </Tabs.Panel>
    </Tabs>
  );
};

export default Admin;

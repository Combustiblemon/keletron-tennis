import { Tabs } from '@mantine/core';

import AdminAnnouncements from '@/components/admin/AdminAnnouncements/AdminAnnouncements';
import AdminCourts from '@/components/admin/AdminCourts/AdminCourts';
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
      keepMounted={false}
    >
      <Tabs.List>
        <Tabs.Tab value="reservations">Κρατήσεις</Tabs.Tab>
        <Tabs.Tab value="courts">Γήπεδα</Tabs.Tab>
        <Tabs.Tab value="announcements">Ανακοινώσεις</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel
        value="reservations"
        flex={1}
        styles={{
          panel: {
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <AdminReservations />
      </Tabs.Panel>

      <Tabs.Panel
        value="courts"
        flex={1}
        styles={{
          panel: {
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <AdminCourts />
      </Tabs.Panel>

      <Tabs.Panel
        value="announcements"
        flex={1}
        styles={{
          panel: {
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <AdminAnnouncements />
      </Tabs.Panel>
    </Tabs>
  );
};

export default Admin;

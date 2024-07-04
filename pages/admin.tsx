import { Drawer, Group, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';

const Admin = () => {
  const [opened, { close }] = useDisclosure(false);

  // const result = useQuery({
  //   queryKey: ['reservations'],
  //   queryFn: fetchReservations,
  // });

  // console.log(result);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      email: '',
      termsOfService: false,
    },

    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  return (
    <div>
      <Drawer
        opened={opened}
        onClose={close}
        title="New reservation"
        position="bottom"
        size="92%"
        overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
      >
        <form onSubmit={form.onSubmit((values) => console.log(values))}>
          I am a drawer
        </form>
      </Drawer>

      <Group justify="space-between">
        <Text>Admin</Text>
      </Group>

      <Stack>Admin stuff</Stack>
    </div>
  );
};

export default Admin;

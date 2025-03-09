import { Button, List, ListItem, Modal, Stack, Text } from '@mantine/core';
import { useDisclosure, useFocusTrap } from '@mantine/hooks';

const InstallInstructionsButton = () => {
  const [opened, { close, open }] = useDisclosure();
  const focusTrapRef = useFocusTrap();

  return (
    <>
      <Button onClick={open} />
      <Modal
        opened={opened}
        onClose={close}
        key="InstallInstructionsModal"
        centered
      >
        <Stack ref={focusTrapRef}>
          <Text size="md" fw="bold" ta="center">
            Εγκατάσταση εφαρμογής
          </Text>
          <List type="ordered">
            <ListItem>
              <Text size="sm">Μπανανα</Text>
            </ListItem>
            <ListItem>
              <Text size="sm">Μπανανα</Text>
            </ListItem>
            <ListItem>
              <Text size="sm">Μπανανα</Text>
            </ListItem>
            <ListItem>
              <Text size="sm">Μπανανα</Text>
            </ListItem>
          </List>
        </Stack>
      </Modal>
    </>
  );
};

export default InstallInstructionsButton;

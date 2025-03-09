import {
  Button,
  Group,
  Image,
  List,
  ListItem,
  Modal,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure, useFocusTrap } from '@mantine/hooks';

import { isAndroid } from '@/lib/common';

const InstallInstructionsButton = () => {
  const [opened, { close, open }] = useDisclosure();
  const focusTrapRef = useFocusTrap();

  return (
    <>
      <Button onClick={open}>Εγκατάσταση</Button>
      <Modal
        opened={opened}
        onClose={close}
        key="InstallInstructionsModal"
        centered
      >
        <Stack ref={focusTrapRef}>
          <Text size="md" fw="bold" ta="center">
            Για να εγκαταστήσετε την εφαρμογή ακολουθήστε τα παρακάτω βήματα
          </Text>
          <List type="ordered">
            {isAndroid() ? (
              <>
                <ListItem>
                  <Group>
                    <Text size="sm">
                      Πατήστε τις 3 τελείες για να ανοίξετε το μενού
                    </Text>
                    <Image
                      alt="instructions"
                      src="/images/install/android1.jpg"
                      h="50px"
                      w="50px"
                    />
                  </Group>
                </ListItem>
                <ListItem>
                  <Text size="sm">
                    Πατήστε &quot;Προσθήκη στην αρχική σελίδα&quot;
                  </Text>
                  <Image
                    alt="instructions"
                    src="/images/install/android2.jpg"
                    h="50px"
                  />
                </ListItem>
                <ListItem>
                  <Text size="sm">Πατήστε &quot;Εγκατάσταση&quot;</Text>
                  <Image
                    alt="instructions"
                    src="/images/install/android3.jpg"
                    h="50px"
                  />
                </ListItem>
              </>
            ) : (
              <>
                <ListItem>
                  <Group>
                    <Text size="sm">
                      Πατήστε το κουμπί &quot;Κοινοποίηση&quot; για να ανοίξετε
                      το μενού
                    </Text>
                    <Image
                      alt="instructions"
                      src="/images/install/iphone1.jpeg"
                      h="50px"
                      w="50px"
                    />
                  </Group>
                </ListItem>
                <ListItem>
                  <Text size="sm">
                    Πατήστε &quot;Προσθήκη στην αρχική σελίδα&quot;
                  </Text>
                  <Image
                    alt="instructions"
                    src="/images/install/iphone2.jpeg"
                    h="40px"
                  />
                </ListItem>
                <ListItem>
                  <Text size="sm">Πατήστε &quot;Προσθήκη&quot;</Text>
                  <Image
                    alt="instructions"
                    src="/images/install/iphone3.jpeg"
                    h="150px"
                  />
                </ListItem>
              </>
            )}
          </List>
          <Text size="md" fw="bold" ta="center">
            H εφαρμογή είναι πλέον εγκατεστημένη στο κινητό σας.
          </Text>
        </Stack>
      </Modal>
    </>
  );
};

export default InstallInstructionsButton;

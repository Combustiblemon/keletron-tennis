import {
  Button,
  Image,
  List,
  ListItem,
  Modal,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure, useFocusTrap } from '@mantine/hooks';

import { isIOS } from '@/lib/common';

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
        title={
          <Text size="md" fw="bold" ta="center">
            Εγκαταστήστε την εφαρμογή
          </Text>
        }
        withCloseButton
      >
        <Stack ref={focusTrapRef}>
          <List type="ordered">
            {isIOS() ? (
              <>
                <ListItem>
                  <Stack>
                    <Text size="md" fw="bold">
                      Πατήστε το εικονίδιο κοινοποίησης
                    </Text>
                    <Text size="sm">
                      Το εικονίδιο κοινοποίησης βρίσκεται στο κάτω μέρος της
                      οθόνης σας.
                    </Text>
                    <Image
                      alt="instructions"
                      src="/images/install/iphone1.png"
                      w="100%"
                    />
                  </Stack>
                </ListItem>
                <ListItem>
                  <Stack>
                    <Text size="md" fw="bold">
                      Επιλέξτε “Προσθήκη στην οθόνη Αφετηρίας”
                    </Text>
                    <Text size="sm">
                      Κάντε κύλιση προς τα κάτω στη λίστα ενεργειών και πατήστε
                      την επιλογή.
                    </Text>
                    <Image
                      alt="instructions"
                      src="/images/install/iphone2.png"
                      w="100%"
                    />
                  </Stack>
                </ListItem>
                <ListItem>
                  <Stack>
                    <Text size="md" fw="bold">
                      Πατήστε το κουμπί “Προσθήκη”
                    </Text>
                    <Text size="sm">
                      Επιβεβαιώστε το όνομα της εφαρμογής και πατήστε το κουμπί
                      “Προσθήκη” επάνω δεξιά.
                    </Text>
                    <Image
                      alt="instructions"
                      src="/images/install/iphone3.png"
                      w="100%"
                    />
                  </Stack>
                </ListItem>
              </>
            ) : (
              <>
                <ListItem>
                  <Stack>
                    <Text size="md" fw="bold">
                      Πατήστε το εικονίδιο με τις τρεις τελείες (πάνω δεξιά).
                    </Text>
                    <Text size="sm">
                      Θα το βρείτε στη γραμμή εργαλείων, επάνω δεξιά, όπως
                      φαίνεται παρακάτω.
                    </Text>
                    <Image
                      alt="instructions"
                      src="/images/install/android1.png"
                      w="100%"
                    />
                  </Stack>
                </ListItem>
                <ListItem>
                  <Stack>
                    <Text size="md" fw="bold">
                      Επιλέξτε “Προσθήκη στην Αρχική Οθόνη”.
                    </Text>
                    <Text size="sm">
                      Θα τη βρείτε στη λίστα επιλογών που εμφανίζεται.
                    </Text>
                    <Image
                      alt="instructions"
                      src="/images/install/android2.png"
                      w="100%"
                    />
                  </Stack>
                </ListItem>
                <ListItem>
                  <Stack>
                    <Text size="md" fw="bold">
                      Θα εμφανιστεί ένα παράθυρο επιβεβαίωσης-πατήστε το κουμπί
                      “Προσθήκη”.
                    </Text>
                    <Text size="sm">
                      Στο παράθυρο επιβεβαίωσης που θα εμφανιστεί, πατήστε το
                      κουμπί “Προσθήκη”.
                    </Text>
                    <Image
                      alt="instructions"
                      src="/images/install/android3.png"
                      w="100%"
                    />
                  </Stack>
                </ListItem>
              </>
            )}
          </List>
          <Text size="md" fw="bold" ta="center">
            Αφού ολοκληρώσετε όλα τα βήματα, θα βρείτε το εικονίδιο της
            εφαρμογής δίπλα στις υπόλοιπες εφαρμογές σας.
          </Text>
        </Stack>
      </Modal>
    </>
  );
};

export default InstallInstructionsButton;

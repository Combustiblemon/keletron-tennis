import { useEffect } from 'react';

import { isIOS } from '@/lib/common';
import { firebaseCloudMessaging } from '@/lib/webPush';

const FCM = () => {
  useEffect(() => {
    (async () => {
      if (isIOS()) {
        return;
      }

      const token = await firebaseCloudMessaging.init();

      if (token) {
        await firebaseCloudMessaging.saveToken();
        // eslint-disable-next-line no-console
        console.log('initialized FCM');
      }
    })();
  }, []);

  return null;
};

export default FCM;

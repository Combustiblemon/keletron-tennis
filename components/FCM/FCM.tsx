import { useEffect } from 'react';

import { isIOS } from '@/lib/common';
import { firebaseCloudMessaging } from '@/lib/webPush';

import { useUser } from '../UserProvider/UserProvider';

const FCM = () => {
  const { isAuthenticated } = useUser();

  useEffect(() => {
    (async () => {
      if (isIOS() || !isAuthenticated) {
        return;
      }

      const token = await firebaseCloudMessaging.init();

      if (token) {
        await firebaseCloudMessaging.saveToken();
        // eslint-disable-next-line no-console
        console.log('initialized FCM');
      }
    })();
  }, [isAuthenticated]);

  return null;
};

export default FCM;

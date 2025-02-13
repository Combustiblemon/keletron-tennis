import { useEffect } from 'react';

import { firebaseCloudMessaging } from '@/lib/webPush';

const FCM = () => {
  useEffect(() => {
    (async () => {
      const token = await firebaseCloudMessaging.init();

      if (token) {
        await firebaseCloudMessaging.saveToken();
        console.log('initialized FCM');
      }
    })();
  }, []);

  return null;
};

export default FCM;

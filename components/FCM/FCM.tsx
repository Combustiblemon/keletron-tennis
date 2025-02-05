import { useEffect, useState } from 'react';

import { firebaseCloudMessaging } from '@/lib/webPush';

import { useUser } from '../UserProvider/UserProvider';

const FCM = () => {
  const { isAuthenticated } = useUser();
  const [savedToken, setToken] = useState<string>();

  useEffect(() => {
    (async () => {
      if (isAuthenticated && !savedToken) {
        const token = await firebaseCloudMessaging.init();

        if (token) {
          setToken(token);
          await firebaseCloudMessaging.saveToken();
        }
      }
    })();
  }, [isAuthenticated, savedToken]);

  return null;
};

export default FCM;

import { useEffect, useState } from 'react';

import { firebaseCloudMessaging } from '@/lib/webPush';

import { useUser } from '../UserProvider/UserProvider';

const FCM = () => {
  const user = useUser();
  const [savedToken, setToken] = useState<string>();

  useEffect(() => {
    (async () => {
      if (user.isAuthenticated && !savedToken) {
        const token = await firebaseCloudMessaging.init();

        if (token) {
          setToken(token);
          await firebaseCloudMessaging.saveToken();
        }
      } else if (!user.isAuthenticated && savedToken) {
        setToken(undefined);
      }
    })();
  }, [savedToken, user.isAuthenticated]);

  return null;
};

export default FCM;

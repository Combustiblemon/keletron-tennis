import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { firebaseCloudMessaging } from '@/lib/webPush';

const FCM = () => {
  const session = useSession();
  const [savedToken, setToken] = useState<string>();

  useEffect(() => {
    (async () => {
      if (session.status === 'authenticated' && !savedToken) {
        const token = await firebaseCloudMessaging.init();

        if (token) {
          setToken(token);
          await firebaseCloudMessaging.saveToken();
        }
      } else if (session.status !== 'authenticated' && savedToken) {
        setToken(undefined);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.status]);

  return null;
};

export default FCM;

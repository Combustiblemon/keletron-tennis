import { useEffect, useState } from 'react';

import { db } from '@/lib/dbUtils';

const Home = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const t = await db.tokens.get('unregistered');
      setToken(t?.FCMToken || null);
    })();
  }, []);

  return (
    <div>
      <button
        onClick={async () => {
          const t = await db.tokens.get('unregistered');
          setToken(t?.FCMToken || null);
        }}
        type="button"
      >
        reload
      </button>
      <br />
      <br />
      <br />
      FCM TOKEN:
      <br />
      {token}
    </div>
  );
};

export default Home;

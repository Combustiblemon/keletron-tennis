import { useSession } from 'next-auth/react';

import LoggedInHomepage from '@/components/homepage/LoggedInHomepage/LoggedInHomepage';
import LoggedOutHomepage from '@/components/homepage/LoggedOutHomepage/LoggedOutHomepage';

const Home = () => {
  const session = useSession();

  return session.status === 'authenticated' ? (
    <LoggedInHomepage session={session} />
  ) : (
    <LoggedOutHomepage />
  );
};

export default Home;

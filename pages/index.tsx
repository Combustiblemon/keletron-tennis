import LoggedInHomepage from '@/components/homepage/LoggedInHomepage/LoggedInHomepage';
import LoggedOutHomepage from '@/components/homepage/LoggedOutHomepage/LoggedOutHomepage';
import { useUser } from '@/components/UserProvider/UserProvider';

const Home = () => {
  const userData = useUser();

  return userData.isAuthenticated ? (
    <LoggedInHomepage />
  ) : (
    <LoggedOutHomepage />
  );
};

export default Home;

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';

import { Language, useLanguage } from '@/context/LanguageContext';
import { endpoints } from '@/lib/api/utils';
import { firebaseCloudMessaging } from '@/lib/webPush';
import { UserType } from '@/models/User';

export type User = Omit<UserType, '_id'> & { language: Language; _id: string };

export type UserContextDataType = {
  isUserLoading: boolean;
  isUserFetching: boolean;
  isAuthenticated: boolean;
  user: User;
  userRoles: {
    isAdmin: boolean;
  };
  invalidateUser: () => Promise<void>;
};

const DEFAULT_USER: User = {
  _id: '',
  email: '',
  firstname: '',
  lastname: '',
  role: 'USER',
  language: 'en',
};

const defaultContextData: UserContextDataType = {
  isUserLoading: true,
  isUserFetching: true,
  isAuthenticated: false,
  user: DEFAULT_USER,
  userRoles: {
    isAdmin: false,
  },
  invalidateUser: async () => {},
};

const UserContextData = createContext(defaultContextData);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const [lang, setLang] = useLanguage();

  const { data, isFetching, isLoading } = useQuery({
    queryFn: async () => {
      const token = await firebaseCloudMessaging.getToken();

      if (token) {
        await endpoints.notifications.PUT(token);
      }

      return endpoints.user.GET();
    },
    queryKey: ['user'],
    // staleTime: 1000 * 60 * 60 * 24,
  });

  let user: User;

  if (!data?.success) {
    user = DEFAULT_USER;

    if (data?.errors) {
      // eslint-disable-next-line no-console
      console.error('error(s) fetching user: ', data?.errors);
    }
  } else {
    user = data.data;
  }

  useEffect(() => {
    if (user.language && lang !== user.language) {
      setLang(user.language);
    }
  }, [user.language, lang, setLang]);

  const invalidateUser = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ['user'],
    });
  }, [queryClient]);

  const contextValue = useMemo(
    () => ({
      isUserLoading: isLoading,
      isUserFetching: isFetching,
      isAuthenticated: !isLoading && !isFetching && !!user._id?.length,
      user: user || DEFAULT_USER,
      userRoles: {
        isAdmin: user.role === 'ADMIN',
      },
      invalidateUser,
    }),
    [isLoading, isFetching, user, invalidateUser]
  );

  return (
    <UserContextData.Provider value={contextValue}>
      {children}
    </UserContextData.Provider>
  );
};

export const useUser = () => {
  return useContext(UserContextData);
};

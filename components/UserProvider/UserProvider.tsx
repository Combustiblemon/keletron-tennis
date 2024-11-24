import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';

import { useLanguage } from '@/context/LanguageContext';
import { endpoints } from '@/lib/api/utils';
import { UserType } from '@/models/User';

export type UserContextDataType = {
  isUserLoading: boolean;
  isUserFetching: boolean;
  isAuthenticated: boolean;
  user: UserType;
  userRoles: {
    isAdmin: boolean;
  };
  invalidateUser: () => void;
};

const DEFAULT_USER: UserType = {
  _id: '',
  email: '',
  name: '',
  role: 'USER',
  accountType: 'PASSWORD',
  language: 'EN',
};

const defaultContextData: UserContextDataType = {
  isUserLoading: true,
  isUserFetching: true,
  isAuthenticated: false,
  user: DEFAULT_USER,
  userRoles: {
    isAdmin: false,
  },
  invalidateUser: () => {},
};

const UserContextData = createContext(defaultContextData);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const [lang, setLang] = useLanguage();

  const { data, isFetching, isLoading } = useQuery({
    queryFn: endpoints.user.GET,
    queryKey: ['user'],
    staleTime: 1000 * 60 * 60 * 24,
  });

  let user: UserType;

  if (!data?.success) {
    user = DEFAULT_USER;
    // eslint-disable-next-line no-console
    console.error('error(s) fetching user: ', data?.errors);
  } else {
    user = data.data;
  }

  useEffect(() => {
    if (user.language && lang !== user.language) {
      setLang(user.language);
    }
  }, [user.language, lang, setLang]);

  const invalidateUser = useCallback(() => {
    queryClient.invalidateQueries({
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

import { useAuth, useUser as useClerkUser } from '@clerk/nextjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';

import { Language, useLanguage } from '@/context/LanguageContext';
import { useApiClient } from '@/lib/api/hooks';
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

  // Clerk authentication
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth();
  const { user: clerkUser } = useClerkUser();

  // New hook-based API client with Clerk token
  const api = useApiClient();

  const { data, isFetching, isLoading } = useQuery({
    queryFn: async () => {
      // Only fetch user data if signed in with Clerk
      if (!isSignedIn) {
        return { success: false, errors: [{ message: 'NOT_AUTHENTICATED' }] };
      }

      // Get FCM token and send to backend
      const fcmToken = await firebaseCloudMessaging.getToken();
      if (fcmToken) {
        await api.notifications.PUT(fcmToken);
      }

      // Fetch user from backend with Clerk token (automatically included by api hook)
      return api.user.GET();
    },
    queryKey: ['user', isSignedIn],
    enabled: isClerkLoaded && isSignedIn, // Only run query if Clerk is loaded and user is signed in
    // staleTime: 1000 * 60 * 60 * 24,
  });

  let user: User;
  let role: 'USER' | 'ADMIN' | 'DEVELOPER' = 'USER';

  // Get role from Clerk metadata first (synced by backend), fallback to backend response
  if (clerkUser?.publicMetadata?.role) {
    role = clerkUser.publicMetadata.role as 'USER' | 'ADMIN' | 'DEVELOPER';
  }

  if (!isSignedIn || !data?.success) {
    user = DEFAULT_USER;

    if (data?.errors && isSignedIn) {
      // Only log errors if user is actually signed in
      // eslint-disable-next-line no-console
      console.error('error(s) fetching user: ', data?.errors);
    }
  } else {
    user = {
      ...data.data,
      role: data.data.role || role, // Prefer backend role, fallback to Clerk metadata
    };
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
      isUserLoading: !isClerkLoaded || isLoading,
      isUserFetching: isFetching,
      // User is authenticated if Clerk says they're signed in and we have user data
      isAuthenticated: isClerkLoaded && isSignedIn && !isLoading && !!user._id?.length,
      user: user || DEFAULT_USER,
      userRoles: {
        isAdmin: user.role === 'ADMIN' || user.role === 'DEVELOPER',
        isDeveloper: user.role === 'DEVELOPER',
      },
      invalidateUser,
    }),
    [isClerkLoaded, isSignedIn, isLoading, isFetching, user, invalidateUser]
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

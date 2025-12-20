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
    isDeveloper: boolean;
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
    isDeveloper: false,
  },
  invalidateUser: async () => {},
};

const UserContextData = createContext(defaultContextData);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const [lang, setLang] = useLanguage();

  // Clerk authentication
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth();
  const { user: clerkUser, isLoaded: isClerkUserLoaded } = useClerkUser();

  // New hook-based API client with Clerk token
  const api = useApiClient();

  const { isFetching, isLoading } = useQuery({
    queryFn: async () => {
      // Only fetch FCM token if signed in with Clerk
      if (!isSignedIn) {
        return { success: false };
      }

      // Get FCM token - initialize if not already initialized
      // This ensures FCM works for all users including admin/developer roles
      let fcmToken: string | null | undefined;

      if (firebaseCloudMessaging.isInitialized()) {
        // FCM already initialized, just get the token
        fcmToken = await firebaseCloudMessaging.getToken();
      } else {
        // FCM not initialized yet, initialize it (this will also get the token)
        fcmToken = await firebaseCloudMessaging.init();
      }

      // Send token to backend if we have one
      if (fcmToken) {
        try {
          await api.notifications.PUT(fcmToken);
          // eslint-disable-next-line no-console
          console.log('FCM token registered successfully');
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to register FCM token:', error);
        }
      }

      return { success: true };
    },
    queryKey: ['fcm-token', isSignedIn],
    enabled: isClerkLoaded && isSignedIn, // Only run query if Clerk is loaded and user is signed in
    retry: 2, // Retry up to 2 times if FCM initialization fails
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Build user object from Clerk's user data and publicMetadata
  let user: User;
  let role: 'USER' | 'ADMIN' | 'DEVELOPER' = 'USER';

  // Get role from Clerk metadata
  if (clerkUser?.publicMetadata?.role) {
    role = clerkUser.publicMetadata.role as 'USER' | 'ADMIN' | 'DEVELOPER';
  }

  if (!isSignedIn || !clerkUser) {
    user = DEFAULT_USER;
  } else {
    // Get user data from Clerk's publicMetadata
    const publicMetadata = clerkUser.publicMetadata || {};
    user = {
      _id: clerkUser.id || '',
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      firstname:
        (publicMetadata.firstname as string) || clerkUser.firstName || '',
      lastname: (publicMetadata.lastname as string) || clerkUser.lastName || '',
      role,
      language: (publicMetadata.language as Language) || lang || 'en',
      FCMTokens: (publicMetadata.FCMTokens as string[]) || [],
    };
  }

  useEffect(() => {
    if (user.language && lang !== user.language) {
      setLang(user.language);
    }
  }, [user.language, lang, setLang]);

  const invalidateUser = useCallback(async () => {
    // Reload Clerk user to get updated publicMetadata
    if (clerkUser) {
      await clerkUser.reload();
    }
    // Also invalidate FCM token query in case it needs to be refreshed
    await queryClient.invalidateQueries({
      queryKey: ['fcm-token'],
    });
  }, [clerkUser, queryClient]);

  const contextValue = useMemo(
    () => ({
      isUserLoading: !isClerkLoaded || !isClerkUserLoaded || isLoading,
      isUserFetching: isFetching,
      // User is authenticated if Clerk says they're signed in and we have user data
      isAuthenticated:
        isClerkLoaded && isClerkUserLoaded && isSignedIn && !!user._id?.length,
      user: user || DEFAULT_USER,
      userRoles: {
        isAdmin: user.role === 'ADMIN' || user.role === 'DEVELOPER',
        isDeveloper: user.role === 'DEVELOPER',
      },
      invalidateUser,
    }),
    [
      isClerkLoaded,
      isClerkUserLoaded,
      isSignedIn,
      isLoading,
      isFetching,
      user,
      invalidateUser,
    ]
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

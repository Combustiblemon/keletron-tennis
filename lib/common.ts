import { deleteToken } from 'firebase/messaging';
import { signOut } from 'next-auth/react';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { firebaseCloudMessaging } from './webPush';

/**
 * Logs the user out of the application (next-auth) and redirects to the homepage
 * @param router  the router instance
 * @param callback
 */
export const logout = async (
  router: AppRouterInstance,
  callback?: () => void | Promise<void>
) => {
  await signOut();
  await firebaseCloudMessaging.deleteToken();

  if (callback) {
    await callback();
  }

  router.push('/');
};

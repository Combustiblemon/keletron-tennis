import { UserProfile } from '@clerk/nextjs';
import { IconBell } from '@tabler/icons-react';

import NotificationSettings from '@/components/NotificationSettings/NotificationSettings';
import { ProtectedRoute } from '@/components/ProtectedRoute/ProtectedRoute';
import { useTranslation } from '@/lib/i18n/i18n';

/**
 * Settings page using Clerk's pre-built UserProfile component.
 *
 * The [[...index]].tsx naming allows Clerk to route between profile sections
 * (/settings, /settings/notifications, etc.); custom pages require it.
 */
const Settings = () => {
  const { t } = useTranslation();

  return (
    <UserProfile routing="path" path="/settings">
      <UserProfile.Page
        label={t('settings.notifications.label')}
        url="notifications"
        labelIcon={<IconBell size={16} />}
      >
        <NotificationSettings />
      </UserProfile.Page>
    </UserProfile>
  );
};

const ProtectedSettings = () => {
  return (
    <ProtectedRoute>
      <Settings />
    </ProtectedRoute>
  );
};

export default ProtectedSettings;

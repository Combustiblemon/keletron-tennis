import { UserProfile } from '@clerk/nextjs';
import { IconBell } from '@tabler/icons-react';

import NotificationSettings from '@/components/NotificationSettings/NotificationSettings';
import { ProtectedRoute } from '@/components/ProtectedRoute/ProtectedRoute';
import { useTranslation } from '@/lib/i18n/i18n';

const Settings = () => {
  const { t } = useTranslation();

  return (
    <UserProfile>
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

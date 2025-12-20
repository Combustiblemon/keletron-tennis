import { UserProfile } from '@clerk/nextjs';

import { ProtectedRoute } from '@/components/ProtectedRoute/ProtectedRoute';

const Settings = () => {
  return <UserProfile />;
};

const ProtectedSettings = () => {
  return (
    <ProtectedRoute>
      <Settings />
    </ProtectedRoute>
  );
};

export default ProtectedSettings;

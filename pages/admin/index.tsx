import { AdminPanelLayout } from '@/components/admin/AdminPanelLayout/AdminPanelLayout';
import AdminReservations from '@/components/admin/AdminReservations/AdminReservations';

const AdminReservationsPage = () => {
  return (
    <AdminPanelLayout>
      <AdminReservations />
    </AdminPanelLayout>
  );
};

export default AdminReservationsPage;

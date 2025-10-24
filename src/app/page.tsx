import AuthWrapper from '@/components/AuthWrapper';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import Dashboard from '@/components/Dashboard';

export default function HomePage() {
  return (
    <AuthWrapper>
      <DashboardLayout>
        <Dashboard />
      </DashboardLayout>
    </AuthWrapper>
  );
}
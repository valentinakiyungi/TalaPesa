import QueryProvider from './_providers/QueryProvider';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import './globals.css';

export const metadata = {
  title: 'TalaPesa - Mkopo wa Haraka Tanzania',
  description: 'Instant loans, trusted by thousands',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sw">
      <body className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <QueryProvider>
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </QueryProvider>
      </body>
    </html>
  );
}
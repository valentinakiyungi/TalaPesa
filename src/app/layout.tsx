
import './globals.css';
import { Inter } from 'next/font/google';
import AuthWrapper from '@/components/AuthWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Cash Loan System',
  description: 'Secure loan management for Arusha',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Only ONE AuthWrapper here */}
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  );
}
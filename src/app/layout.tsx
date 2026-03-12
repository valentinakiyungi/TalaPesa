import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'TalaPesa',
  description: 'Mkopo wa Haraka Tanzania',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased bg-gray-50">
        {/* Flex container: sidebar + main content */}
        <div className="flex">
          {/* Sidebar: hidden on mobile */}
          <div className="hidden md:block">
            <Sidebar />
          </div>

          {/* Main content */}
          <main className="flex-1 min-h-screen ml-0 md:ml-56 p-4 md:p-8 overflow-x-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
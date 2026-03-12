import type { Metadata } from 'next';
import './globals.css';

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
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
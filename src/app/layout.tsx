
     import './globals.css';
     import { Inter } from 'next/font/google';
     import AuthWrapper from '@/components/AuthWrapper';

     const inter = Inter({ subsets: ['latin'] });

     export const metadata = {
       title: 'Cash Loan Management System',
       description: 'A web application for managing cash loans, customers, and staff.',
       icons: {
         icon: '/favicon.ico',
       },
     };

     export default function RootLayout({ children }: { children: React.ReactNode }) {
       return (
         <html lang="en">
           <body className={inter.className}>
             <nav className="bg-blue-600 text-white p-4">
               <div className="container mx-auto flex justify-between">
                 <h1 className="text-xl font-bold">Cash Loan Management</h1>
                 <div>
                   <a href="/customers" className="mr-4">Customers</a>
                   <a href="/loans" className="mr-4">Loans</a>
                   <a href="/payments" className="mr-4">Payments</a>
                   <a href="/staff" className="mr-4">Staff</a>
                   <a href="/" className="mr-4">Dashboard</a>
                   <a href="/payments/process" className="mr-4">Process Payment</a>
                   <a href="/expenses" className="mr-4">Expenses</a>
                 </div>
               </div>
             </nav>
             <AuthWrapper>
               <main className="container mx-auto p-4">{children}</main>
             </AuthWrapper>
           </body>
         </html>
       );
     }
  
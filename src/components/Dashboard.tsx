// src/components/Dashboard.tsx
'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const metrics = [
    {
      title: 'Active Loans',
      value: '42',
      color: 'bg-blue-600 text-white',
    },
    {
      title: 'Customers',
      value: '128',
      color: 'bg-green-600 text-white',
    },
    {
      title: 'Revenue (This Month)',
      value: 'TZS 12.4M',
      color: 'bg-yellow-400 text-black',
    },
    {
      title: 'Pending Approvals',
      value: '8',
      color: 'bg-red-600 text-white',
    },
  ];

  const recentLoans = [
    {
      customer: 'John Doe',
      amount: 'TZS 500,000',
      status: 'Approved',
      date: 'Oct 12, 2025',
    },
    {
      customer: 'Jane Smith',
      amount: 'TZS 800,000',
      status: 'Pending',
      date: 'Oct 14, 2025',
    },
  ];

  const getStatusBadge = (status: string) => {
    if (status === 'Approved')
      return <Badge className="bg-green-600 text-white">Approved</Badge>;
    if (status === 'Pending')
      return <Badge className="bg-yellow-600 text-white">Pending</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card
            key={metric.title}
            className={`${metric.color} text-white shadow-lg hover:shadow-xl transition-shadow duration-200`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-3xl font-bold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Recent Loan Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLoans.map((loan) => (
                <TableRow key={loan.customer} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {loan.customer}
                  </TableCell>
                  <TableCell>{loan.amount}</TableCell>
                  <TableCell>{getStatusBadge(loan.status)}</TableCell>
                  <TableCell className="text-gray-600">
                    {loan.date}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

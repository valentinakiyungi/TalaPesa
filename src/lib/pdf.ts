
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generateLoanPDF(loan: any, customer: any) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('LOAN CONTRACT', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 20, 35);
  doc.text(`Contract ID: ${loan.id}`, 20, 42);

  // Customer Info
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Borrower Details', 20, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Name: ${customer.name}`, 20, 65);
  doc.text(`Phone: ${customer.phone}`, 20, 72);
  doc.text(`Email: ${customer.email || 'N/A'}`, 20, 79);

  // Loan Details
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Loan Details', 20, 95);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Amount: TZS ${Number(loan.amount).toLocaleString()}`, 20, 105);
  doc.text(`Interest Rate: ${loan.interestRate}%`, 20, 112);
  doc.text(`Term: ${loan.term} days`, 20, 119);
  doc.text(`Total Repayable: TZS ${Number(loan.totalRepayable).toLocaleString()}`, 20, 126);
  doc.text(`Daily Payment: TZS ${Number(loan.dailyPayment).toLocaleString()}`, 20, 133);

  // Payment Schedule
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Schedule', 20, 150);
  doc.setFontSize(10);
  let y = 160;
  loan.schedule.forEach((p: any, i: number) => {
    doc.text(`${i + 1}. ${p.date} - TZS ${p.amount.toLocaleString()}`, 25, y);
    y += 7;
  });

  // Terms
  doc.setFontSize(10);
  doc.text('Terms: Late payment incurs 2% daily penalty.', 20, y + 10);
  doc.text('Guarantor required for loans above TZS 500,000.', 20, y + 17);

  // Signatures
  doc.line(20, y + 40, 80, y + 40);
  doc.text('Borrower Signature', 20, y + 47);
  doc.line(110, y + 40, 170, y + 40);
  doc.text('Loan Officer', 110, y + 47);

  return doc;
}
'use client';

import { installmentOutstanding } from '@/lib/engine/loan';
import type { Loan, Organization, Payment } from '@/lib/types';
import { formatDate, formatNumber } from '@/lib/utils';

type Lang = 'sw' | 'en';

const L = {
  statement: { sw: 'TAARIFA YA MKOPO', en: 'LOAN STATEMENT' },
  agreement: { sw: 'MKATABA WA MKOPO', en: 'LOAN AGREEMENT' },
  borrower: { sw: 'Mkopaji', en: 'Borrower' },
  phone: { sw: 'Simu', en: 'Phone' },
  loanNo: { sw: 'Namba ya mkopo', en: 'Loan number' },
  product: { sw: 'Aina ya mkopo', en: 'Product' },
  principal: { sw: 'Kiasi cha mkopo', en: 'Principal' },
  interest: { sw: 'Riba', en: 'Interest' },
  fees: { sw: 'Faini', en: 'Late fees' },
  totalDue: { sw: 'Jumla ya kulipa', en: 'Total repayable' },
  paid: { sw: 'Kilicholipwa', en: 'Paid' },
  balance: { sw: 'Salio', en: 'Balance' },
  disbursed: { sw: 'Tarehe ya kutolewa', en: 'Disbursed on' },
  status: { sw: 'Hali', en: 'Status' },
  schedule: { sw: 'Ratiba ya marejesho', en: 'Repayment schedule' },
  payments: { sw: 'Malipo yaliyopokelewa', en: 'Payments received' },
  date: { sw: 'Tarehe', en: 'Date' },
  amount: { sw: 'Kiasi', en: 'Amount' },
  receipt: { sw: 'Risiti', en: 'Receipt' },
  method: { sw: 'Njia', en: 'Method' },
  due: { sw: 'Tarehe ya malipo', en: 'Due date' },
  installment: { sw: 'Rejesho', en: 'Installment' },
  outstanding: { sw: 'Kinachodaiwa', en: 'Outstanding' },
  generated: { sw: 'Imetolewa', en: 'Generated' },
  guarantor: { sw: 'Mdhamini', en: 'Guarantor' },
  lender: { sw: 'Mkopeshaji', en: 'Lender' },
  rate: { sw: 'Kiwango cha riba', en: 'Interest rate' },
  lateFee: { sw: 'Faini ya kuchelewa', en: 'Late fee' },
  signBorrower: { sw: 'Sahihi ya mkopaji', en: 'Borrower signature' },
  signGuarantor: { sw: 'Sahihi ya mdhamini', en: 'Guarantor signature' },
  signLender: { sw: 'Kwa niaba ya mkopeshaji', en: 'For the lender' },
  terms: {
    sw: [
      'Mkopaji anakubali kulipa kiasi chote kilichoonyeshwa kwenye ratiba hii kwa tarehe zilizopangwa.',
      'Malipo yaliyochelewa zaidi ya muda wa neema yatatozwa faini ya kuchelewa kama ilivyoelezwa hapo juu.',
      'Malipo yanapokelewa kwanza kwa faini, kisha riba, kisha kiasi cha msingi, kuanzia awamu ya zamani zaidi.',
      'Mdhamini anakubali kulipa deni lote lililobaki iwapo mkopaji atashindwa kulipa.',
      'Mkopaji anaweza kulipa mkopo wote mapema wakati wowote.',
    ],
    en: [
      'The borrower agrees to repay the full amount shown in this schedule on the dates listed.',
      'Payments made after the grace period are charged the late fee stated above.',
      'Payments are applied to late fees first, then interest, then principal, oldest installment first.',
      'The guarantor agrees to repay any outstanding balance if the borrower fails to pay.',
      'The borrower may repay the loan in full early at any time.',
    ],
  },
} as const;

async function load() {
  const [{ jsPDF }, autoTable] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  return { jsPDF, autoTable: autoTable.default };
}

function header(doc: import('jspdf').jsPDF, org: Organization, title: string) {
  doc.setFillColor(15, 66, 48);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(org.name, 14, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text([org.address, org.city, org.phone, org.email].filter(Boolean).join('  |  '), 14, 20);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 196, 13, { align: 'right' });
  doc.setTextColor(31, 36, 33);
}

function keyValues(doc: import('jspdf').jsPDF, rows: [string, string][], y: number, x = 14, width = 88) {
  doc.setFontSize(9);
  rows.forEach(([k, v], i) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(97, 109, 102);
    doc.text(k, x, y + i * 6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 36, 33);
    doc.text(v, x + width, y + i * 6, { align: 'right' });
  });
  return y + rows.length * 6;
}

export async function downloadStatement(org: Organization, loan: Loan, payments: Payment[], lang: Lang) {
  const { jsPDF, autoTable } = await load();
  const doc = new jsPDF();
  const cur = org.settings?.currency || 'TZS';
  header(doc, org, L.statement[lang]);
  let y = 40;
  keyValues(doc, [
    [L.borrower[lang], loan.customerName],
    [L.phone[lang], '+' + loan.customerPhone],
    [L.loanNo[lang], loan.loanNumber],
    [L.product[lang], loan.productName],
    [L.disbursed[lang], loan.disbursedDate ? formatDate(loan.disbursedDate, lang) : '-'],
  ], y);
  y = keyValues(doc, [
    [L.principal[lang], `${cur} ${formatNumber(loan.principal)}`],
    [L.interest[lang], `${cur} ${formatNumber(loan.totalInterest)}`],
    [L.fees[lang], `${cur} ${formatNumber(loan.totalPenalty)}`],
    [L.paid[lang], `${cur} ${formatNumber(loan.amountPaid)}`],
    [L.balance[lang], `${cur} ${formatNumber(loan.balance)}`],
  ], y, 110, 86);

  autoTable(doc, {
    startY: y + 6,
    head: [['#', L.due[lang], L.installment[lang], L.fees[lang], L.paid[lang], L.outstanding[lang]]],
    body: loan.schedule.map((i) => [
      String(i.n),
      formatDate(i.dueDate, lang),
      formatNumber(i.amount),
      i.penalty ? formatNumber(i.penalty) : '-',
      formatNumber(i.paidPrincipal + i.paidInterest + i.paidPenalty),
      formatNumber(installmentOutstanding(i)),
    ]),
    headStyles: { fillColor: [19, 100, 69] },
    styles: { fontSize: 8.5 },
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
  });

  const completed = payments.filter((p) => p.status === 'completed').sort((a, b) => a.date.localeCompare(b.date));
  const afterSchedule = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(L.payments[lang], 14, afterSchedule + 10);
  autoTable(doc, {
    startY: afterSchedule + 13,
    head: [[L.date[lang], L.receipt[lang], L.method[lang], L.amount[lang]]],
    body: completed.length ? completed.map((p) => [formatDate(p.date, lang), p.receiptNumber, p.method, formatNumber(p.amount)]) : [['-', '-', '-', '-']],
    headStyles: { fillColor: [19, 100, 69] },
    styles: { fontSize: 8.5 },
    columnStyles: { 3: { halign: 'right' } },
  });
  doc.setFontSize(8);
  doc.setTextColor(124, 136, 128);
  doc.text(`${L.generated[lang]} ${new Date().toLocaleString(lang === 'sw' ? 'sw-TZ' : 'en-GB')} · TalaPesa`, 14, 290);
  doc.save(`${loan.loanNumber}-statement.pdf`);
}

export async function downloadAgreement(org: Organization, loan: Loan, lang: Lang) {
  const { jsPDF, autoTable } = await load();
  const doc = new jsPDF();
  const cur = org.settings?.currency || 'TZS';
  header(doc, org, L.agreement[lang]);
  const freq = { daily: { sw: 'kila siku', en: 'daily' }, weekly: { sw: 'kila wiki', en: 'weekly' }, biweekly: { sw: 'kila wiki 2', en: 'every 2 weeks' }, monthly: { sw: 'kila mwezi', en: 'monthly' } }[loan.frequency][lang];
  const ratePer = loan.ratePeriod === 'loan' ? (lang === 'sw' ? 'kwa mkopo mzima' : 'for the whole loan') : lang === 'sw' ? 'kwa mwezi' : 'per month';
  const lateFee = loan.lateFeeType === 'none' ? '-' : loan.lateFeeType === 'percent' ? `${loan.lateFeeValue}%` : `${cur} ${formatNumber(loan.lateFeeValue)}`;
  const schedule = loan.schedule.length ? loan.schedule : [];

  let y = 40;
  y = keyValues(doc, [
    [L.lender[lang], org.name],
    [L.borrower[lang], `${loan.customerName}  (+${loan.customerPhone})`],
    [L.guarantor[lang], loan.guarantor ? `${loan.guarantor.name}  (+${loan.guarantor.phone})` : '-'],
    [L.loanNo[lang], loan.loanNumber],
    [L.principal[lang], `${cur} ${formatNumber(loan.principal)}`],
    [L.rate[lang], `${loan.interestRate}% ${ratePer}`],
    [L.interest[lang], `${cur} ${formatNumber(loan.totalInterest)}`],
    [L.totalDue[lang], `${cur} ${formatNumber(loan.principal + loan.totalInterest)}`],
    [L.installment[lang], `${loan.installments} × ${freq}`],
    [L.lateFee[lang], `${lateFee} (${loan.graceDays} ${lang === 'sw' ? 'siku za neema' : 'grace days'})`],
  ], y, 14, 182);

  if (schedule.length) {
    autoTable(doc, {
      startY: y + 4,
      head: [['#', L.due[lang], L.installment[lang]]],
      body: schedule.map((i) => [String(i.n), formatDate(i.dueDate, lang), `${cur} ${formatNumber(i.amount)}`]),
      headStyles: { fillColor: [19, 100, 69] },
      styles: { fontSize: 8.5 },
      columnStyles: { 2: { halign: 'right' } },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  }

  if (y > 220) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  L.terms[lang].forEach((line, i) => {
    const wrapped = doc.splitTextToSize(`${i + 1}. ${line}`, 182);
    doc.text(wrapped, 14, y + 10);
    y += 5 * wrapped.length + 1;
  });

  y += 22;
  const sig = (label: string, x: number) => {
    doc.line(x, y, x + 56, y);
    doc.setFontSize(8);
    doc.text(label, x, y + 5);
    doc.text(`${L.date[lang]}: ____________`, x, y + 11);
  };
  sig(L.signBorrower[lang], 14);
  sig(L.signGuarantor[lang], 77);
  sig(L.signLender[lang], 140);
  doc.save(`${loan.loanNumber}-agreement.pdf`);
}

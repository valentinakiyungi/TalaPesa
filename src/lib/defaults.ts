import type { LoanProduct, OrgSettings } from './types';

export const SMS_TEMPLATES = {
  sw: {
    disbursement: 'Habari {name}, mkopo wako {loanNumber} wa {currency} {amount} umetolewa na {orgName}. Malipo ya kwanza ni {currency} {installment} tarehe {dueDate}.',
    reminder: 'Habari {name}, kumbusho: malipo ya {currency} {amount} ya mkopo {loanNumber} yanatakiwa tarehe {dueDate}. {orgName}',
    dueToday: 'Habari {name}, leo ni siku ya malipo ya {currency} {amount} ya mkopo {loanNumber}. Asante. {orgName}',
    overdue: 'Habari {name}, mkopo {loanNumber} umechelewa siku {days}. Deni lililopitwa ni {currency} {amount}. Tafadhali lipa haraka. {orgName}',
    receipt: 'Tumepokea {currency} {amount} kwa mkopo {loanNumber}. Salio ni {currency} {balance}. Risiti {receipt}. Asante! {orgName}',
  },
  en: {
    disbursement: 'Hello {name}, your loan {loanNumber} of {currency} {amount} has been disbursed by {orgName}. First payment of {currency} {installment} is due {dueDate}.',
    reminder: 'Hello {name}, reminder: {currency} {amount} for loan {loanNumber} is due on {dueDate}. {orgName}',
    dueToday: 'Hello {name}, your payment of {currency} {amount} for loan {loanNumber} is due today. Thank you. {orgName}',
    overdue: 'Hello {name}, loan {loanNumber} is {days} days overdue. Amount past due: {currency} {amount}. Please pay as soon as possible. {orgName}',
    receipt: 'We received {currency} {amount} for loan {loanNumber}. Balance: {currency} {balance}. Receipt {receipt}. Thank you! {orgName}',
  },
} as const;

export function defaultOrgSettings(language: 'sw' | 'en' = 'sw'): OrgSettings {
  return {
    currency: 'TZS',
    timeZone: 'Africa/Dar_es_Salaam',
    smsEnabled: false,
    reminderDaysBefore: 2,
    smsLanguage: language,
    templates: { ...SMS_TEMPLATES[language] },
    loanPrefix: 'TP',
    requireGuarantor: true,
    maxActiveLoansPerCustomer: 1,
  };
}

export function defaultProducts(): Omit<LoanProduct, 'id'>[] {
  return [
    {
      name: 'Mkopo wa Biashara (Monthly)',
      description: 'Business loan repaid monthly',
      interestRate: 10,
      ratePeriod: 'month',
      interestMethod: 'flat',
      frequency: 'monthly',
      minAmount: 50_000,
      maxAmount: 5_000_000,
      minInstallments: 1,
      maxInstallments: 12,
      processingFeePercent: 2,
      lateFeeType: 'percent',
      lateFeeValue: 5,
      graceDays: 3,
      active: true,
    },
    {
      name: 'Mkopo wa Wiki (Weekly)',
      description: 'Short loan repaid weekly',
      interestRate: 20,
      ratePeriod: 'loan',
      interestMethod: 'flat',
      frequency: 'weekly',
      minAmount: 20_000,
      maxAmount: 1_000_000,
      minInstallments: 2,
      maxInstallments: 12,
      processingFeePercent: 0,
      lateFeeType: 'fixed',
      lateFeeValue: 2_000,
      graceDays: 1,
      active: true,
    },
  ];
}

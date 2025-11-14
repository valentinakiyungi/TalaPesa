
export interface Customer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  idNumber: string;
  address?: string;
  financialHistory?: {
    creditScore: number;
    previousLoans: string[]; 
  };
  documentUrls?: string[];
  createdAt?: string;
}
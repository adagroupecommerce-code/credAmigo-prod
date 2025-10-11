export interface Client {
  id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  residentialAddress: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  workAddress: {
    company: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  documents: {
    selfie?: string;
    cnh?: string;
    proofOfResidence?: string;
    payStub?: string;
    workCard?: string;
  };
  createdAt: string;
  status: 'active' | 'inactive' | 'blocked';
  creditScore: number;
  creditRating: 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor';
  totalLoans: number;
  activeLoans: number;
  completedLoans: number;
  defaultedLoans: number;
  totalBorrowed: number;
  totalPaid: number;
  onTimePayments: number;
  latePayments: number;
  averagePaymentDelay: number;
  observations?: ClientObservation[];
}

export interface ClientObservation {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  type: 'general' | 'payment' | 'contact' | 'credit' | 'warning';
  isImportant: boolean;
}

export interface Loan {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  interestRate: number;
  installments: number;
  installmentValue: number;
  totalAmount: number;
  startDate: string;
  status?: 'pending' | 'paid' | 'overdue';
  paymentDate?: string;
  endDate: string;
  status: 'active' | 'completed' | 'defaulted';
  paidInstallments: number;
  remainingAmount: number;
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
  installmentPlan?: Array<{
    installmentNumber: number;
    dueDate: string;
    principalAmount: number;
    interestAmount: number;
    totalAmount: number;
    remainingBalance: number;
    status?: 'pending' | 'paid' | 'overdue' | 'partially_paid';
    paymentDate?: string;
    paidAmountForThisInstallment?: number;
    remainingAmountForThisInstallment?: number;
  }>;
}

export interface Payment {
  id: string;
  loanId: string;
  installmentNumber: number;
  amount: number;
  principalAmount?: number;
  interestAmount?: number;
  dueDate: string;
  paymentDate?: string;
  status: 'pending' | 'paid' | 'overdue';
  penalty?: number;
}

export interface Dashboard {
  totalLoans: number;
  activeLoans: number;
  totalLent: number;
  totalReceived: number;
  pendingAmount: number;
  overdueAmount: number;
  monthlyRevenue: number;
  defaultRate: number;
}

export interface Prospect {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  requestedAmount: number;
  stage: 'lead' | 'documents' | 'analysis' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  source: 'website' | 'referral' | 'social_media' | 'phone' | 'walk_in' | 'other';
  notes: string;
  documents: {
    selfie?: boolean;
    cnh?: boolean;
    proofOfResidence?: boolean;
    payStub?: boolean;
    workCard?: boolean;
  };
  documentFiles?: {
    selfie?: File | string;
    cnh?: File | string;
    proofOfResidence?: File | string;
    payStub?: File | string;
    workCard?: File | string;
  };
  address?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  workInfo?: {
    company: string;
    position: string;
    income: number;
  };
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  expectedCloseDate?: string;
  rejectionReason?: string;
  isArchived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
}
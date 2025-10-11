import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para o banco de dados
export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          cpf: string;
          email: string | null;
          phone: string;
          residential_address: any;
          work_address: any;
          documents: any;
          status: 'active' | 'inactive' | 'blocked';
          credit_score: number;
          credit_rating: 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor';
          total_loans: number;
          active_loans: number;
          completed_loans: number;
          defaulted_loans: number;
          total_borrowed: number;
          total_paid: number;
          on_time_payments: number;
          late_payments: number;
          average_payment_delay: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          cpf: string;
          email?: string | null;
          phone: string;
          residential_address?: any;
          work_address?: any;
          documents?: any;
          status?: 'active' | 'inactive' | 'blocked';
          credit_score?: number;
          credit_rating?: 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor';
          total_loans?: number;
          active_loans?: number;
          completed_loans?: number;
          defaulted_loans?: number;
          total_borrowed?: number;
          total_paid?: number;
          on_time_payments?: number;
          late_payments?: number;
          average_payment_delay?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          cpf?: string;
          email?: string | null;
          phone?: string;
          residential_address?: any;
          work_address?: any;
          documents?: any;
          status?: 'active' | 'inactive' | 'blocked';
          credit_score?: number;
          credit_rating?: 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor';
          total_loans?: number;
          active_loans?: number;
          completed_loans?: number;
          defaulted_loans?: number;
          total_borrowed?: number;
          total_paid?: number;
          on_time_payments?: number;
          late_payments?: number;
          average_payment_delay?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      loans: {
        Row: {
          id: string;
          client_id: string;
          amount: number;
          interest_rate: number;
          installments: number;
          installment_value: number;
          total_amount: number;
          start_date: string;
          end_date: string;
          status: 'active' | 'completed' | 'defaulted';
          paid_installments: number;
          remaining_amount: number;
          notes: string | null;
          installment_plan: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          amount: number;
          interest_rate: number;
          installments: number;
          installment_value: number;
          total_amount: number;
          start_date: string;
          end_date: string;
          status?: 'active' | 'completed' | 'defaulted';
          paid_installments?: number;
          remaining_amount: number;
          notes?: string | null;
          installment_plan?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          amount?: number;
          interest_rate?: number;
          installments?: number;
          installment_value?: number;
          total_amount?: number;
          start_date?: string;
          end_date?: string;
          status?: 'active' | 'completed' | 'defaulted';
          paid_installments?: number;
          remaining_amount?: number;
          notes?: string | null;
          installment_plan?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
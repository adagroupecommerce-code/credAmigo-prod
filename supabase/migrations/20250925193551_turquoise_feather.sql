/*
  # Create movements table for financial transactions

  1. New Tables
    - `movements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, not null) - references auth.users
      - `type` (text, not null) - 'credit' or 'debit'
      - `amount` (numeric, not null) - transaction amount >= 0
      - `description` (text, optional) - transaction description
      - `created_at` (timestamptz, not null) - creation timestamp

  2. Security
    - Enable RLS on `movements` table
    - Add policy for users to read their own movements
    - Add policy for users to insert their own movements

  3. Indexes
    - Index on user_id for performance
    - Index on created_at for ordering
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create movements table
CREATE TABLE IF NOT EXISTS public.movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "movements_select_own" ON public.movements;
DROP POLICY IF EXISTS "movements_insert_own" ON public.movements;

-- Create RLS policies
CREATE POLICY "movements_select_own"
  ON public.movements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "movements_insert_own"
  ON public.movements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_movements_user_id ON public.movements(user_id);
CREATE INDEX IF NOT EXISTS idx_movements_created_at ON public.movements(created_at DESC);
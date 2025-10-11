/*
  # Add payment tracking fields to payments table

  1. New Columns
    - `original_amount` (numeric): Original amount of the installment
    - `payment_type` (text): Type of payment (full, partial, overpayment)
    - `excess_amount` (numeric): Amount paid over the expected value
    - `notes` (text): Additional notes about the payment

  2. Security
    - Update RLS policies to include new fields
    - Add indexes for better query performance

  3. Constraints
    - Add check constraints for payment_type values
    - Ensure excess_amount is non-negative
*/

-- Add new columns to payments table
DO $$
BEGIN
  -- Add original_amount column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'original_amount'
  ) THEN
    ALTER TABLE payments ADD COLUMN original_amount numeric(15,2) DEFAULT 0;
  END IF;

  -- Add payment_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'payment_type'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_type text DEFAULT 'full';
  END IF;

  -- Add excess_amount column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'excess_amount'
  ) THEN
    ALTER TABLE payments ADD COLUMN excess_amount numeric(15,2) DEFAULT 0;
  END IF;

  -- Add notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'notes'
  ) THEN
    ALTER TABLE payments ADD COLUMN notes text;
  END IF;
END $$;

-- Add check constraint for payment_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'payments_payment_type_check'
    AND table_name = 'payments'
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT payments_payment_type_check 
    CHECK (payment_type IN ('full', 'partial', 'overpayment'));
  END IF;
END $$;

-- Add check constraint for excess_amount
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'payments_excess_amount_check'
    AND table_name = 'payments'
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT payments_excess_amount_check 
    CHECK (excess_amount >= 0);
  END IF;
END $$;

-- Add check constraint for original_amount
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'payments_original_amount_check'
    AND table_name = 'payments'
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT payments_original_amount_check 
    CHECK (original_amount >= 0);
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_original_amount ON payments(original_amount) WHERE original_amount > 0;
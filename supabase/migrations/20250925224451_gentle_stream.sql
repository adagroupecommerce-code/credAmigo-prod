/*
  # Update payments table for detailed payment tracking

  1. Schema Updates
    - Add `principal_amount` and `interest_amount` columns to track payment breakdown
    - Ensure all payment fields support detailed tracking
    - Add indexes for better query performance

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity with proper constraints
*/

-- Add columns for detailed payment tracking if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'principal_amount'
  ) THEN
    ALTER TABLE payments ADD COLUMN principal_amount numeric(15,2);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'interest_amount'
  ) THEN
    ALTER TABLE payments ADD COLUMN interest_amount numeric(15,2);
  END IF;
END $$;

-- Update existing payments to have default values for new columns
UPDATE payments 
SET 
  principal_amount = COALESCE(principal_amount, amount * 0.7),
  interest_amount = COALESCE(interest_amount, amount * 0.3)
WHERE principal_amount IS NULL OR interest_amount IS NULL;

-- Add constraints to ensure data integrity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'payments' AND constraint_name = 'payments_amounts_check'
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT payments_amounts_check 
    CHECK (
      principal_amount >= 0 AND 
      interest_amount >= 0 AND 
      penalty >= 0 AND
      amount = principal_amount + interest_amount + penalty
    );
  END IF;
END $$;

-- Add index for better performance on payment queries
CREATE INDEX IF NOT EXISTS idx_payments_loan_installment 
ON payments(loan_id, installment_number);

-- Add index for payment date queries
CREATE INDEX IF NOT EXISTS idx_payments_payment_date 
ON payments(payment_date) WHERE payment_date IS NOT NULL;
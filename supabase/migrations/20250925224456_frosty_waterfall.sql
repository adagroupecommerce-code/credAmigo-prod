/*
  # Update loans table to support detailed installment plans

  1. Schema Updates
    - Ensure `installment_plan` column exists and supports detailed tracking
    - Add proper indexing for installment plan queries

  2. Data Migration
    - Ensure existing loans have proper installment plan structure
    - Migrate any existing data to new format

  3. Security
    - Maintain existing RLS policies
    - Ensure data integrity
*/

-- Ensure installment_plan column exists with proper type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'installment_plan'
  ) THEN
    ALTER TABLE loans ADD COLUMN installment_plan jsonb;
  END IF;
END $$;

-- Add index for installment plan queries
CREATE INDEX IF NOT EXISTS idx_loans_installment_plan 
ON loans USING gin(installment_plan) WHERE installment_plan IS NOT NULL;

-- Add function to validate installment plan structure
CREATE OR REPLACE FUNCTION validate_installment_plan(plan jsonb)
RETURNS boolean AS $$
BEGIN
  -- Check if plan is an array
  IF jsonb_typeof(plan) != 'array' THEN
    RETURN false;
  END IF;
  
  -- Check if each installment has required fields
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(plan) AS installment
    WHERE NOT (
      installment ? 'installmentNumber' AND
      installment ? 'dueDate' AND
      installment ? 'principalAmount' AND
      installment ? 'interestAmount' AND
      installment ? 'totalAmount' AND
      installment ? 'remainingBalance'
    )
  ) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Add constraint to validate installment plan structure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'loans' AND constraint_name = 'loans_installment_plan_check'
  ) THEN
    ALTER TABLE loans ADD CONSTRAINT loans_installment_plan_check 
    CHECK (installment_plan IS NULL OR validate_installment_plan(installment_plan));
  END IF;
END $$;

-- Update existing loans to ensure they have proper installment plans
UPDATE loans 
SET installment_plan = '[]'::jsonb
WHERE installment_plan IS NULL;
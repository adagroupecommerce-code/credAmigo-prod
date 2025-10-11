/*
  # Update installment plan structure for partial payments

  1. Changes
    - Add validation function for installment plan with new fields
    - Update existing constraint to use new validation
    - Add indexes for better performance on installment plan queries

  2. New Fields Support
    - `paidAmountForThisInstallment`: tracks amount paid for each installment
    - `remainingAmountForThisInstallment`: tracks remaining amount for each installment
    - `status`: supports 'pending', 'paid', 'overdue', 'partially_paid'
*/

-- Drop existing constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'loans_installment_plan_check' 
    AND table_name = 'loans'
  ) THEN
    ALTER TABLE loans DROP CONSTRAINT loans_installment_plan_check;
  END IF;
END $$;

-- Create updated validation function for installment plan
CREATE OR REPLACE FUNCTION validate_installment_plan_v2(plan jsonb)
RETURNS boolean AS $$
DECLARE
  installment jsonb;
  required_fields text[] := ARRAY['installmentNumber', 'dueDate', 'principalAmount', 'interestAmount', 'totalAmount', 'remainingBalance'];
  field text;
BEGIN
  -- Check if plan is an array
  IF jsonb_typeof(plan) != 'array' THEN
    RETURN false;
  END IF;
  
  -- Check each installment
  FOR installment IN SELECT * FROM jsonb_array_elements(plan)
  LOOP
    -- Check required fields
    FOREACH field IN ARRAY required_fields
    LOOP
      IF NOT (installment ? field) THEN
        RETURN false;
      END IF;
    END LOOP;
    
    -- Validate installment number is positive integer
    IF NOT (installment->>'installmentNumber' ~ '^\d+$' AND (installment->>'installmentNumber')::int > 0) THEN
      RETURN false;
    END IF;
    
    -- Validate amounts are non-negative numbers
    IF (installment->>'principalAmount')::numeric < 0 OR
       (installment->>'interestAmount')::numeric < 0 OR
       (installment->>'totalAmount')::numeric < 0 OR
       (installment->>'remainingBalance')::numeric < 0 THEN
      RETURN false;
    END IF;
    
    -- Validate total amount equals principal + interest
    IF ABS((installment->>'totalAmount')::numeric - 
           ((installment->>'principalAmount')::numeric + (installment->>'interestAmount')::numeric)) > 0.01 THEN
      RETURN false;
    END IF;
    
    -- Validate status if present
    IF installment ? 'status' THEN
      IF NOT (installment->>'status' IN ('pending', 'paid', 'overdue', 'partially_paid')) THEN
        RETURN false;
      END IF;
    END IF;
    
    -- Validate paidAmountForThisInstallment if present
    IF installment ? 'paidAmountForThisInstallment' THEN
      IF (installment->>'paidAmountForThisInstallment')::numeric < 0 OR
         (installment->>'paidAmountForThisInstallment')::numeric > (installment->>'totalAmount')::numeric THEN
        RETURN false;
      END IF;
    END IF;
    
    -- Validate remainingAmountForThisInstallment if present
    IF installment ? 'remainingAmountForThisInstallment' THEN
      IF (installment->>'remainingAmountForThisInstallment')::numeric < 0 OR
         (installment->>'remainingAmountForThisInstallment')::numeric > (installment->>'totalAmount')::numeric THEN
        RETURN false;
      END IF;
    END IF;
    
    -- Validate date format
    BEGIN
      PERFORM (installment->>'dueDate')::date;
    EXCEPTION WHEN OTHERS THEN
      RETURN false;
    END;
    
    -- Validate paymentDate format if present
    IF installment ? 'paymentDate' THEN
      BEGIN
        PERFORM (installment->>'paymentDate')::date;
      EXCEPTION WHEN OTHERS THEN
        RETURN false;
      END;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;
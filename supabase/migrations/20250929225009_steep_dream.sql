/*
  # Sync payments with loans installment plans

  1. Function to sync payments
    - Creates or updates payments based on loan installment plans
    - Calculates penalties for overdue payments
    - Maintains data consistency between loans and payments

  2. Trigger to auto-sync
    - Automatically syncs payments when loan installment_plan is updated
    - Ensures billing module always reflects current loan status
*/

-- Function to sync payments from loan installment plan
CREATE OR REPLACE FUNCTION sync_payments_from_loan(loan_id_param UUID)
RETURNS VOID AS $$
DECLARE
    loan_record RECORD;
    installment JSONB;
    payment_record RECORD;
    penalty_amount NUMERIC(15,2);
    days_overdue INTEGER;
BEGIN
    -- Get loan with installment plan
    SELECT * INTO loan_record FROM loans WHERE id = loan_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Loan not found: %', loan_id_param;
    END IF;
    
    -- Process each installment in the plan
    FOR installment IN SELECT * FROM jsonb_array_elements(COALESCE(loan_record.installment_plan, '[]'::jsonb))
    LOOP
        -- Calculate penalty for overdue payments
        penalty_amount := 0;
        IF (installment->>'status') IN ('overdue', 'partially_paid') AND 
           (installment->>'dueDate')::date < CURRENT_DATE THEN
            days_overdue := CURRENT_DATE - (installment->>'dueDate')::date;
            penalty_amount := ((installment->>'totalAmount')::numeric * 0.02) + 
                            (days_overdue * (installment->>'totalAmount')::numeric * 0.001);
        END IF;
        
        -- Check if payment already exists
        SELECT * INTO payment_record 
        FROM payments 
        WHERE loan_id = loan_id_param 
        AND installment_number = (installment->>'installmentNumber')::integer;
        
        IF FOUND THEN
            -- Update existing payment
            UPDATE payments SET
                amount = COALESCE((installment->>'remainingAmountForThisInstallment')::numeric, (installment->>'totalAmount')::numeric),
                principal_amount = (installment->>'principalAmount')::numeric,
                interest_amount = (installment->>'interestAmount')::numeric,
                penalty = penalty_amount,
                due_date = (installment->>'dueDate')::date,
                payment_date = CASE 
                    WHEN installment->>'paymentDate' IS NOT NULL 
                    THEN (installment->>'paymentDate')::date 
                    ELSE payment_date 
                END,
                status = CASE 
                    WHEN (installment->>'status') = 'paid' THEN 'paid'::text
                    WHEN (installment->>'status') = 'partially_paid' THEN 'pending'::text
                    WHEN (installment->>'dueDate')::date < CURRENT_DATE THEN 'overdue'::text
                    ELSE 'pending'::text
                END,
                original_amount = (installment->>'totalAmount')::numeric,
                payment_type = CASE 
                    WHEN (installment->>'status') = 'paid' THEN 'full'::text
                    WHEN (installment->>'status') = 'partially_paid' THEN 'partial'::text
                    ELSE 'full'::text
                END,
                excess_amount = 0,
                updated_at = NOW()
            WHERE id = payment_record.id;
        ELSE
            -- Create new payment
            INSERT INTO payments (
                loan_id,
                installment_number,
                amount,
                principal_amount,
                interest_amount,
                penalty,
                due_date,
                payment_date,
                status,
                original_amount,
                payment_type,
                excess_amount
            ) VALUES (
                loan_id_param,
                (installment->>'installmentNumber')::integer,
                COALESCE((installment->>'remainingAmountForThisInstallment')::numeric, (installment->>'totalAmount')::numeric),
                (installment->>'principalAmount')::numeric,
                (installment->>'interestAmount')::numeric,
                penalty_amount,
                (installment->>'dueDate')::date,
                CASE 
                    WHEN installment->>'paymentDate' IS NOT NULL 
                    THEN (installment->>'paymentDate')::date 
                    ELSE NULL 
                END,
                CASE 
                    WHEN (installment->>'status') = 'paid' THEN 'paid'::text
                    WHEN (installment->>'status') = 'partially_paid' THEN 'pending'::text
                    WHEN (installment->>'dueDate')::date < CURRENT_DATE THEN 'overdue'::text
                    ELSE 'pending'::text
                END,
                (installment->>'totalAmount')::numeric,
                CASE 
                    WHEN (installment->>'status') = 'paid' THEN 'full'::text
                    WHEN (installment->>'status') = 'partially_paid' THEN 'partial'::text
                    ELSE 'full'::text
                END,
                0
            );
        END IF;
    END LOOP;
    
    -- Remove orphaned payments (installments that no longer exist in the plan)
    DELETE FROM payments 
    WHERE loan_id = loan_id_param 
    AND installment_number NOT IN (
        SELECT (installment->>'installmentNumber')::integer
        FROM jsonb_array_elements(COALESCE(loan_record.installment_plan, '[]'::jsonb)) AS installment
    );
    
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-sync payments when loan installment_plan is updated
CREATE OR REPLACE FUNCTION trigger_sync_payments()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if installment_plan was actually changed
    IF OLD.installment_plan IS DISTINCT FROM NEW.installment_plan THEN
        PERFORM sync_payments_from_loan(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS sync_payments_on_loan_update ON loans;
CREATE TRIGGER sync_payments_on_loan_update
    AFTER UPDATE ON loans
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sync_payments();

-- Sync existing loans
DO $$
DECLARE
    loan_record RECORD;
BEGIN
    FOR loan_record IN SELECT id FROM loans WHERE installment_plan IS NOT NULL
    LOOP
        PERFORM sync_payments_from_loan(loan_record.id);
    END LOOP;
END;
$$;
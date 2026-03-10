-- Migration: Automatic account balance sync via triggers
-- Adds destination_account_id for transfers and creates triggers
-- that atomically update cash_accounts.balance on INSERT/UPDATE/DELETE.

-- 1. Add destination_account_id column for transfer transactions
ALTER TABLE transactions
  ADD COLUMN destination_account_id UUID REFERENCES cash_accounts(id) ON DELETE SET NULL;

-- Index for reverse lookups on destination account
CREATE INDEX idx_transactions_destination_account ON transactions(destination_account_id)
  WHERE destination_account_id IS NOT NULL;

-- 2. Core trigger function: adjusts cash_accounts.balance atomically
CREATE OR REPLACE FUNCTION sync_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- On DELETE: reverse the old transaction's effect
  IF TG_OP = 'DELETE' THEN
    PERFORM _apply_balance_delta(OLD, -1);
    RETURN OLD;
  END IF;

  -- On UPDATE: reverse old effect, then apply new effect
  IF TG_OP = 'UPDATE' THEN
    PERFORM _apply_balance_delta(OLD, -1);
    PERFORM _apply_balance_delta(NEW, 1);
    RETURN NEW;
  END IF;

  -- On INSERT: apply the new transaction's effect
  IF TG_OP = 'INSERT' THEN
    PERFORM _apply_balance_delta(NEW, 1);
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

-- 3. Helper: applies a single transaction's balance effect (direction = 1 or -1)
CREATE OR REPLACE FUNCTION _apply_balance_delta(
  txn transactions,
  direction INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  delta BIGINT;
BEGIN
  -- For income: amount is positive, adds to balance
  -- For expense: amount is stored as negative, so adding it subtracts from balance
  -- For transfer: amount is positive; debit source, credit destination
  IF txn.type = 'transfer' THEN
    -- Debit source account (subtract amount)
    UPDATE cash_accounts
      SET balance = balance + (direction * (-1) * ABS(txn.amount))
      WHERE id = txn.cash_account_id;

    -- Credit destination account (add amount)
    IF txn.destination_account_id IS NOT NULL THEN
      UPDATE cash_accounts
        SET balance = balance + (direction * ABS(txn.amount))
        WHERE id = txn.destination_account_id;
    END IF;
  ELSE
    -- income or expense: amount already has correct sign (positive for income, negative for expense)
    UPDATE cash_accounts
      SET balance = balance + (direction * txn.amount)
      WHERE id = txn.cash_account_id;
  END IF;
END;
$$;

-- 4. Attach triggers to the transactions table
CREATE TRIGGER trg_balance_sync_insert
  AFTER INSERT ON transactions
  FOR EACH ROW EXECUTE FUNCTION sync_account_balance();

CREATE TRIGGER trg_balance_sync_update
  AFTER UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION sync_account_balance();

CREATE TRIGGER trg_balance_sync_delete
  AFTER DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION sync_account_balance();

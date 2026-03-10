-- Test migration: verify balance sync triggers work correctly
-- This runs assertions using DO blocks. If any assertion fails, it raises an exception
-- and the migration is rolled back.

DO $$
DECLARE
  test_org_id UUID;
  account_a_id UUID;
  account_b_id UUID;
  txn_income_id UUID;
  txn_expense_id UUID;
  txn_transfer_id UUID;
  bal BIGINT;
  bal_a BIGINT;
  bal_b BIGINT;
  test_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Setup: create a test org and two accounts with zero balance
  INSERT INTO organizations (id, name, slug)
    VALUES (gen_random_uuid(), 'Test Org Triggers', 'test-triggers-' || gen_random_uuid())
    RETURNING id INTO test_org_id;

  INSERT INTO cash_accounts (id, organization_id, name, type, balance)
    VALUES (gen_random_uuid(), test_org_id, 'Account A', 'personal', 0)
    RETURNING id INTO account_a_id;

  INSERT INTO cash_accounts (id, organization_id, name, type, balance)
    VALUES (gen_random_uuid(), test_org_id, 'Account B', 'company', 0)
    RETURNING id INTO account_b_id;

  -- ========== TEST 1: INSERT income ==========
  INSERT INTO transactions (id, organization_id, cash_account_id, amount, type, description, date, created_by)
    VALUES (gen_random_uuid(), test_org_id, account_a_id, 10000, 'income', 'Test income', CURRENT_DATE, test_user_id)
    RETURNING id INTO txn_income_id;

  SELECT balance INTO bal FROM cash_accounts WHERE id = account_a_id;
  IF bal != 10000 THEN
    RAISE EXCEPTION 'TEST 1 FAILED: Expected balance 10000 after income insert, got %', bal;
  END IF;

  -- ========== TEST 2: INSERT expense ==========
  INSERT INTO transactions (id, organization_id, cash_account_id, amount, type, description, date, created_by)
    VALUES (gen_random_uuid(), test_org_id, account_a_id, -3000, 'expense', 'Test expense', CURRENT_DATE, test_user_id)
    RETURNING id INTO txn_expense_id;

  SELECT balance INTO bal FROM cash_accounts WHERE id = account_a_id;
  IF bal != 7000 THEN
    RAISE EXCEPTION 'TEST 2 FAILED: Expected balance 7000 after expense insert, got %', bal;
  END IF;

  -- ========== TEST 3: INSERT transfer ==========
  INSERT INTO transactions (id, organization_id, cash_account_id, destination_account_id, amount, type, description, date, created_by)
    VALUES (gen_random_uuid(), test_org_id, account_a_id, account_b_id, 2000, 'transfer', 'Test transfer', CURRENT_DATE, test_user_id)
    RETURNING id INTO txn_transfer_id;

  SELECT balance INTO bal_a FROM cash_accounts WHERE id = account_a_id;
  SELECT balance INTO bal_b FROM cash_accounts WHERE id = account_b_id;
  IF bal_a != 5000 THEN
    RAISE EXCEPTION 'TEST 3 FAILED: Expected Account A balance 5000 after transfer, got %', bal_a;
  END IF;
  IF bal_b != 2000 THEN
    RAISE EXCEPTION 'TEST 3 FAILED: Expected Account B balance 2000 after transfer, got %', bal_b;
  END IF;

  -- ========== TEST 4: UPDATE transaction amount ==========
  UPDATE transactions SET amount = -5000 WHERE id = txn_expense_id;

  SELECT balance INTO bal FROM cash_accounts WHERE id = account_a_id;
  -- Was 5000. Reverse old expense (-3000 reversed = +3000 -> 8000). Apply new expense (-5000 -> 3000).
  IF bal != 3000 THEN
    RAISE EXCEPTION 'TEST 4 FAILED: Expected balance 3000 after expense update, got %', bal;
  END IF;

  -- ========== TEST 5: DELETE income transaction ==========
  DELETE FROM transactions WHERE id = txn_income_id;

  SELECT balance INTO bal FROM cash_accounts WHERE id = account_a_id;
  -- Was 3000. Reverse income (+10000 reversed = -10000 -> -7000).
  IF bal != -7000 THEN
    RAISE EXCEPTION 'TEST 5 FAILED: Expected balance -7000 after income delete, got %', bal;
  END IF;

  -- ========== TEST 6: DELETE transfer ==========
  DELETE FROM transactions WHERE id = txn_transfer_id;

  SELECT balance INTO bal_a FROM cash_accounts WHERE id = account_a_id;
  SELECT balance INTO bal_b FROM cash_accounts WHERE id = account_b_id;
  -- Account A: was -7000, reverse transfer debit (+2000) -> -5000
  -- Account B: was 2000, reverse transfer credit (-2000) -> 0
  IF bal_a != -5000 THEN
    RAISE EXCEPTION 'TEST 6 FAILED: Expected Account A balance -5000 after transfer delete, got %', bal_a;
  END IF;
  IF bal_b != 0 THEN
    RAISE EXCEPTION 'TEST 6 FAILED: Expected Account B balance 0 after transfer delete, got %', bal_b;
  END IF;

  -- ========== CLEANUP ==========
  DELETE FROM transactions WHERE organization_id = test_org_id;
  DELETE FROM cash_accounts WHERE organization_id = test_org_id;
  DELETE FROM organizations WHERE id = test_org_id;

  RAISE NOTICE '✅ All balance trigger tests passed!';
END;
$$;

-- Recurring transactions feature
-- Allows users to define templates for recurring transactions (bills, subscriptions, salary)

-- Frequency enum
CREATE TYPE recurrence_frequency AS ENUM ('daily', 'weekly', 'monthly', 'yearly');

-- Recurring transactions table
CREATE TABLE recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cash_account_id UUID NOT NULL REFERENCES cash_accounts(id) ON DELETE CASCADE,
  destination_account_id UUID REFERENCES cash_accounts(id) ON DELETE SET NULL,
  amount BIGINT NOT NULL, -- stored in cents
  type transaction_type NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  frequency recurrence_frequency NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE, -- NULL means no end
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Junction table for recurring transaction tags
CREATE TABLE recurring_transaction_tags (
  recurring_transaction_id UUID NOT NULL REFERENCES recurring_transactions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recurring_transaction_id, tag_id)
);

-- Indexes
CREATE INDEX idx_recurring_transactions_org ON recurring_transactions(organization_id);
CREATE INDEX idx_recurring_transactions_next_date ON recurring_transactions(next_date) WHERE is_active = true;
CREATE INDEX idx_recurring_transactions_account ON recurring_transactions(cash_account_id);

-- RLS
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transaction_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recurring_transactions
CREATE POLICY "Users can view org recurring transactions"
  ON recurring_transactions FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can manage org recurring transactions"
  ON recurring_transactions FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids()));

-- RLS Policies for recurring_transaction_tags
CREATE POLICY "Users can view recurring transaction tags"
  ON recurring_transaction_tags FOR SELECT
  USING (
    recurring_transaction_id IN (
      SELECT id FROM recurring_transactions
      WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "Users can manage recurring transaction tags"
  ON recurring_transaction_tags FOR ALL
  USING (
    recurring_transaction_id IN (
      SELECT id FROM recurring_transactions
      WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

-- Function to generate due transactions from recurring templates
-- Call this periodically (e.g., daily via cron or Edge Function)
CREATE OR REPLACE FUNCTION generate_recurring_transactions(target_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
  new_txn_id UUID;
  generated_count INTEGER := 0;
BEGIN
  FOR rec IN
    SELECT rt.*, array_agg(rtt.tag_id) FILTER (WHERE rtt.tag_id IS NOT NULL) AS tag_ids
    FROM recurring_transactions rt
    LEFT JOIN recurring_transaction_tags rtt ON rtt.recurring_transaction_id = rt.id
    WHERE rt.is_active = true
      AND rt.next_date <= target_date
      AND (rt.end_date IS NULL OR rt.next_date <= rt.end_date)
    GROUP BY rt.id
  LOOP
    -- Insert the transaction
    INSERT INTO transactions (
      organization_id, cash_account_id, destination_account_id,
      amount, type, description, category_id, date, created_by
    ) VALUES (
      rec.organization_id, rec.cash_account_id, rec.destination_account_id,
      rec.amount, rec.type, rec.description, rec.category_id, rec.next_date, rec.created_by
    ) RETURNING id INTO new_txn_id;

    -- Insert tags
    IF rec.tag_ids IS NOT NULL THEN
      INSERT INTO transaction_tags (transaction_id, tag_id)
      SELECT new_txn_id, unnest(rec.tag_ids);
    END IF;

    -- Advance next_date
    UPDATE recurring_transactions SET next_date = CASE frequency
      WHEN 'daily' THEN next_date + INTERVAL '1 day'
      WHEN 'weekly' THEN next_date + INTERVAL '1 week'
      WHEN 'monthly' THEN next_date + INTERVAL '1 month'
      WHEN 'yearly' THEN next_date + INTERVAL '1 year'
    END
    WHERE id = rec.id;

    -- Deactivate if past end_date
    UPDATE recurring_transactions
    SET is_active = false
    WHERE id = rec.id
      AND end_date IS NOT NULL
      AND next_date > end_date;

    generated_count := generated_count + 1;
  END LOOP;

  RETURN generated_count;
END;
$$;

-- Ori Financeiro - Initial Schema
-- Multi-tenant financial management system

-- Custom types
CREATE TYPE account_type AS ENUM ('personal', 'company', 'cash2');
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');

-- Organizations (tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organization members
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Cash accounts
CREATE TABLE cash_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type account_type NOT NULL,
  balance BIGINT NOT NULL DEFAULT 0, -- stored in cents
  currency TEXT NOT NULL DEFAULT 'BRL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories (hierarchical)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cash_account_id UUID NOT NULL REFERENCES cash_accounts(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL, -- stored in cents
  type transaction_type NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Transaction-Tag junction
CREATE TABLE transaction_tags (
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, tag_id)
);

-- Indexes
CREATE INDEX idx_org_members_user ON org_members(user_id);
CREATE INDEX idx_org_members_org ON org_members(organization_id);
CREATE INDEX idx_cash_accounts_org ON cash_accounts(organization_id);
CREATE INDEX idx_transactions_org ON transactions(organization_id);
CREATE INDEX idx_transactions_account ON transactions(cash_account_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_categories_org ON categories(organization_id);
CREATE INDEX idx_tags_org ON tags(organization_id);

-- Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Helper function: get user's organization IDs
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM org_members WHERE user_id = auth.uid();
$$;

-- RLS Policies

-- Organizations: users can see orgs they belong to
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (true);

-- Org members: users can see members of their orgs
CREATE POLICY "Users can view org members"
  ON org_members FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Owners can manage members"
  ON org_members FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Users can join organizations"
  ON org_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Cash accounts: scoped to org
CREATE POLICY "Users can view org cash accounts"
  ON cash_accounts FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can manage org cash accounts"
  ON cash_accounts FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids()));

-- Transactions: scoped to org
CREATE POLICY "Users can view org transactions"
  ON transactions FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can manage org transactions"
  ON transactions FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids()));

-- Tags: scoped to org
CREATE POLICY "Users can view org tags"
  ON tags FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can manage org tags"
  ON tags FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids()));

-- Transaction tags: scoped via transaction's org
CREATE POLICY "Users can view transaction tags"
  ON transaction_tags FOR SELECT
  USING (
    transaction_id IN (
      SELECT id FROM transactions
      WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "Users can manage transaction tags"
  ON transaction_tags FOR ALL
  USING (
    transaction_id IN (
      SELECT id FROM transactions
      WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

-- Categories: scoped to org
CREATE POLICY "Users can view org categories"
  ON categories FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can manage org categories"
  ON categories FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids()));

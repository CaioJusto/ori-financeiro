-- Organization invitations table
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired');

CREATE TABLE org_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role member_role NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  status invitation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  UNIQUE(organization_id, email)
);

CREATE INDEX idx_org_invitations_org ON org_invitations(organization_id);
CREATE INDEX idx_org_invitations_email ON org_invitations(email);

-- RLS
ALTER TABLE org_invitations ENABLE ROW LEVEL SECURITY;

-- Members can see invitations for their orgs
CREATE POLICY "Users can view org invitations"
  ON org_invitations FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

-- Owner/admin can manage invitations
CREATE POLICY "Owners can manage invitations"
  ON org_invitations FOR ALL
  USING (organization_id IN (SELECT get_user_owner_org_ids()));

-- Helper function to get admin org IDs (owner or admin role)
CREATE OR REPLACE FUNCTION get_user_admin_org_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin');
$$;

-- Admins can also manage invitations
CREATE POLICY "Admins can manage invitations"
  ON org_invitations FOR ALL
  USING (organization_id IN (SELECT get_user_admin_org_ids()));

-- Admins can also manage members (not just owners)
CREATE POLICY "Admins can manage members"
  ON org_members FOR ALL
  USING (organization_id IN (SELECT get_user_admin_org_ids()));

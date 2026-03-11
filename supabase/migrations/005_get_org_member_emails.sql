-- Returns email addresses for all members of an organization
-- Only accessible to authenticated users who are themselves members of the org
create or replace function get_org_member_emails(org_id uuid)
returns table (user_id uuid, email text) as $$
begin
  -- Verify caller is a member of this org
  if not exists (
    select 1 from public.org_members
    where organization_id = org_id
      and org_members.user_id = auth.uid()
  ) then
    raise exception 'Not a member of this organization';
  end if;

  return query
    select om.user_id, au.email::text
    from public.org_members om
    join auth.users au on au.id = om.user_id
    where om.organization_id = org_id;
end;
$$ language plpgsql security definer;

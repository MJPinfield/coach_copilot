-- Coach Copilot V3.3.5
-- Allows an authenticated client to activate only their own coach/client relationship.
-- Run once in Supabase SQL Editor.

create or replace function public.activate_my_client_relationship()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.coach_clients
  set status = 'active'
  where client_id = auth.uid()
    and status = 'invited';

  return exists (
    select 1
    from public.coach_clients
    where client_id = auth.uid()
      and status = 'active'
  );
end;
$$;

revoke all on function public.activate_my_client_relationship() from public;
grant execute on function public.activate_my_client_relationship() to authenticated;

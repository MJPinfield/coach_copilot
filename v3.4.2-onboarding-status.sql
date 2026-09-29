-- Coach Copilot V3.4.2
-- Make the database relationship state the source of truth for client onboarding.
-- An authenticated user can learn only whether their own client relationship
-- is active, invited, or absent. SECURITY DEFINER avoids depending on table RLS.

create or replace function public.my_client_onboarding_status()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when auth.uid() is null then null
    when exists (
      select 1
      from public.coach_clients cc
      where cc.client_id = auth.uid()
        and cc.status = 'active'
    ) then 'active'
    when exists (
      select 1
      from public.coach_clients cc
      where cc.client_id = auth.uid()
        and cc.status = 'invited'
    ) then 'invited'
    else null
  end;
$$;

revoke all on function public.my_client_onboarding_status() from public;
grant execute on function public.my_client_onboarding_status() to authenticated;

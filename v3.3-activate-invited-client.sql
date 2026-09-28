-- Coach Copilot V3.3
-- Mark an invited coach/client relationship active when the invited client first signs in.
-- Run once in Supabase SQL Editor.

create or replace function public.activate_client_relationship()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.coach_clients
  set status = 'active'
  where client_id = new.id
    and status = 'invited';
  return new;
end;
$$;

drop trigger if exists on_auth_user_confirmed_coach_copilot on auth.users;

create trigger on_auth_user_confirmed_coach_copilot
after update of confirmed_at on auth.users
for each row
when (old.confirmed_at is null and new.confirmed_at is not null)
execute procedure public.activate_client_relationship();

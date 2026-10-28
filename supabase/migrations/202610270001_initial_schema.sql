create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create type public.user_role as enum ('superadmin', 'admin', 'receptionist');
create type public.event_status as enum ('draft', 'active', 'completed', 'cancelled');
create type public.check_in_result as enum ('prevalidated', 'authorized', 'used', 'revoked', 'invalid', 'unauthorized');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (length(trim(full_name)) between 2 and 120),
  role public.user_role not null,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id),
  celebrant_name text not null check (length(trim(celebrant_name)) between 1 and 120),
  event_name text not null check (length(trim(event_name)) between 1 and 160),
  event_date timestamptz not null,
  event_address text not null check (length(trim(event_address)) between 3 and 300),
  event_description text,
  invitation_message text,
  invitation_theme jsonb not null default '{}'::jsonb,
  status public.event_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  full_name text not null check (length(trim(full_name)) between 2 and 160),
  email text,
  phone text,
  invitation_token_hash text unique,
  archived boolean not null default false,
  is_revoked boolean not null default false,
  checked_in_at timestamptz,
  checked_in_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.event_receptionists (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  receptionist_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (event_id, receptionist_id)
);

create table public.check_in_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id),
  guest_id uuid references public.guests(id),
  receptionist_id uuid not null references public.profiles(id),
  result public.check_in_result not null,
  created_at timestamptz not null default now()
);

create index events_admin_id_idx on public.events(admin_id);
create index events_event_date_idx on public.events(event_date);
create index guests_event_id_idx on public.guests(event_id);
create index guests_event_state_idx on public.guests(event_id, archived, is_revoked);
create index event_receptionists_receptionist_idx on public.event_receptionists(receptionist_id);
create index check_in_logs_event_created_idx on public.check_in_logs(event_id, created_at desc);

create function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger events_set_updated_at before update on public.events
for each row execute function public.set_updated_at();

create function public.protect_guest_security_fields() returns trigger language plpgsql as $$
begin
  new.invitation_token_hash = null;
  new.archived = false;
  new.is_revoked = false;
  new.checked_in_at = null;
  new.checked_in_by = null;
  return new;
end;
$$;
create trigger guests_protect_insert before insert on public.guests
for each row execute function public.protect_guest_security_fields();

create function public.current_profile_role() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid() and is_active = true
$$;

create function public.can_manage_event(target_event uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.events e join public.profiles p on p.id = auth.uid()
    where e.id = target_event and p.is_active = true
      and (p.role = 'superadmin' or (p.role = 'admin' and e.admin_id = p.id))
  )
$$;

create function public.can_check_in_event(target_event uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active = true and (
      p.role = 'superadmin'
      or (p.role = 'admin' and exists (select 1 from public.events e where e.id = target_event and e.admin_id = p.id))
      or (p.role = 'receptionist' and exists (
        select 1 from public.event_receptionists er
        where er.event_id = target_event and er.receptionist_id = p.id
      ))
    )
  )
$$;

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.guests enable row level security;
alter table public.event_receptionists enable row level security;
alter table public.check_in_logs enable row level security;

create policy profiles_self_read on public.profiles for select using (id = auth.uid());
create policy profiles_superadmin_read on public.profiles for select using (public.current_profile_role() = 'superadmin');
create policy profiles_admin_receptionists_read on public.profiles for select using (
  role = 'receptionist' and created_by = auth.uid() and public.current_profile_role() = 'admin'
);
create policy events_read on public.events for select using (
  public.current_profile_role() = 'superadmin' or admin_id = auth.uid() or public.can_check_in_event(id)
);
create policy events_insert on public.events for insert with check (
  public.current_profile_role() = 'superadmin' or (public.current_profile_role() = 'admin' and admin_id = auth.uid())
);
create policy events_update on public.events for update using (public.can_manage_event(id)) with check (public.can_manage_event(id));
create policy events_delete on public.events for delete using (public.can_manage_event(id));

create policy guests_manage_read on public.guests for select using (public.can_manage_event(event_id));
create policy guests_manage_insert on public.guests for insert with check (public.can_manage_event(event_id));
create policy guests_manage_update on public.guests for update using (public.can_manage_event(event_id)) with check (public.can_manage_event(event_id));

create policy assignments_read on public.event_receptionists for select using (
  receptionist_id = auth.uid() or public.can_manage_event(event_id)
);
create policy assignments_insert on public.event_receptionists for insert with check (public.can_manage_event(event_id));
create policy assignments_delete on public.event_receptionists for delete using (public.can_manage_event(event_id));
create policy logs_read on public.check_in_logs for select using (public.can_manage_event(event_id));

create function public.create_event(
  p_celebrant_name text, p_event_name text, p_event_date timestamptz,
  p_event_address text, p_event_description text default null,
  p_invitation_message text default null, p_invitation_theme jsonb default '{}'::jsonb
) returns public.events
language plpgsql security definer set search_path = '' as $$
declare created public.events;
begin
  if public.current_profile_role() not in ('admin', 'superadmin') then raise exception 'not_authorized'; end if;
  insert into public.events(admin_id, celebrant_name, event_name, event_date, event_address, event_description, invitation_message, invitation_theme)
  values (auth.uid(), trim(p_celebrant_name), trim(p_event_name), p_event_date, trim(p_event_address), p_event_description, p_invitation_message, coalesce(p_invitation_theme, '{}'::jsonb))
  returning * into created;
  return created;
end;
$$;

create function public.issue_guest_invitation(p_guest_id uuid)
returns table(token text, guest_id uuid, event_id uuid)
language plpgsql security definer set search_path = '' as $$
declare generated_token text; target_event uuid;
begin
  select g.event_id into target_event from public.guests g where g.id = p_guest_id;
  if target_event is null or not public.can_manage_event(target_event) then raise exception 'not_authorized'; end if;
  generated_token := encode(extensions.gen_random_bytes(32), 'hex');
  update public.guests set invitation_token_hash = encode(extensions.digest(generated_token, 'sha256'), 'hex'), is_revoked = false
  where id = p_guest_id;
  return query select generated_token, p_guest_id, target_event;
end;
$$;

create function public.get_public_invitation(p_token text)
returns table(
  guest_name text, event_name text, celebrant_name text, event_date timestamptz,
  event_address text, event_description text, invitation_message text,
  invitation_theme jsonb, access_status text
)
language sql stable security definer set search_path = '' as $$
  select g.full_name, e.event_name, e.celebrant_name, e.event_date, e.event_address,
    e.event_description, e.invitation_message, e.invitation_theme,
    case when g.is_revoked then 'revoked' when g.archived then 'used' else 'available' end
  from public.guests g join public.events e on e.id = g.event_id
  where g.invitation_token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and length(p_token) = 64 and e.status <> 'cancelled'
$$;

create function public.prevalidate_invitation(p_event_id uuid, p_token text)
returns table(guest_id uuid, guest_name text, status text)
language plpgsql security definer set search_path = '' as $$
declare known public.guests; resolved text;
begin
  if not public.can_check_in_event(p_event_id) then
    return query select null::uuid, null::text, 'unauthorized'::text; return;
  end if;
  select g.* into known from public.guests g where g.event_id = p_event_id
    and g.invitation_token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');
  resolved := case when known.id is null then 'invalid' when known.is_revoked then 'revoked' when known.archived then 'used' else 'available' end;
  insert into public.check_in_logs(event_id, guest_id, receptionist_id, result)
  values (p_event_id, known.id, auth.uid(), (case resolved when 'available' then 'prevalidated' else resolved end)::public.check_in_result);
  return query select known.id, known.full_name, resolved;
end;
$$;

create function public.confirm_guest_check_in(p_event_id uuid, p_token text)
returns table(guest_id uuid, guest_name text, status text, checked_in_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare claimed public.guests; known public.guests;
begin
  if not public.can_check_in_event(p_event_id) then
    return query select null::uuid, null::text, 'unauthorized'::text, null::timestamptz; return;
  end if;
  update public.guests g set archived = true, checked_in_at = now(), checked_in_by = auth.uid()
  where g.event_id = p_event_id and g.invitation_token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and g.archived = false and g.is_revoked = false
  returning g.* into claimed;
  if claimed.id is not null then
    insert into public.check_in_logs(event_id, guest_id, receptionist_id, result)
    values (p_event_id, claimed.id, auth.uid(), 'authorized');
    return query select claimed.id, claimed.full_name, 'confirmed'::text, claimed.checked_in_at; return;
  end if;
  select g.* into known from public.guests g where g.event_id = p_event_id
    and g.invitation_token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');
  if known.id is null then
    insert into public.check_in_logs(event_id, guest_id, receptionist_id, result) values (p_event_id, null, auth.uid(), 'invalid');
    return query select null::uuid, null::text, 'invalid'::text, null::timestamptz;
  else
    insert into public.check_in_logs(event_id, guest_id, receptionist_id, result)
    values (p_event_id, known.id, auth.uid(), case when known.is_revoked then 'revoked' else 'used' end);
    return query select known.id, known.full_name, case when known.is_revoked then 'revoked' else 'used' end, known.checked_in_at;
  end if;
end;
$$;

revoke execute on function public.current_profile_role() from public;
revoke execute on function public.can_manage_event(uuid) from public;
revoke execute on function public.can_check_in_event(uuid) from public;
revoke execute on function public.create_event(text, text, timestamptz, text, text, text, jsonb) from public;
revoke execute on function public.issue_guest_invitation(uuid) from public;
revoke execute on function public.get_public_invitation(text) from public;
revoke execute on function public.prevalidate_invitation(uuid, text) from public;
revoke execute on function public.confirm_guest_check_in(uuid, text) from public;
grant execute on function public.create_event(text, text, timestamptz, text, text, text, jsonb) to authenticated;
grant execute on function public.issue_guest_invitation(uuid) to authenticated;
grant execute on function public.prevalidate_invitation(uuid, text) to authenticated;
grant execute on function public.confirm_guest_check_in(uuid, text) to authenticated;
grant execute on function public.get_public_invitation(text) to anon, authenticated;

revoke update on public.events from authenticated;
grant update(celebrant_name, event_name, event_date, event_address, event_description, invitation_message, invitation_theme, status) on public.events to authenticated;
revoke update on public.guests from authenticated;
grant update(full_name, email, phone, is_revoked) on public.guests to authenticated;



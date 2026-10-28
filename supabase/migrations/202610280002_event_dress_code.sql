begin;

alter table public.events
  add column dress_code text
  constraint events_dress_code_length check (
    dress_code is null or length(trim(dress_code)) between 1 and 120
  );

drop function public.create_event(text, text, timestamptz, text, text, text, jsonb);

create function public.create_event(
  p_celebrant_name text, p_event_name text, p_event_date timestamptz,
  p_event_address text, p_event_description text default null,
  p_invitation_message text default null, p_invitation_theme jsonb default '{}'::jsonb,
  p_dress_code text default null
) returns public.events
language plpgsql security definer set search_path = '' as $$
declare created public.events;
begin
  if public.current_profile_role() not in ('admin', 'superadmin') then raise exception 'not_authorized'; end if;
  insert into public.events(
    admin_id, celebrant_name, event_name, event_date, event_address,
    event_description, invitation_message, invitation_theme, dress_code
  ) values (
    auth.uid(), trim(p_celebrant_name), trim(p_event_name), p_event_date,
    trim(p_event_address), p_event_description, p_invitation_message,
    coalesce(p_invitation_theme, '{}'::jsonb), nullif(trim(p_dress_code), '')
  )
  returning * into created;
  return created;
end;
$$;

drop function public.get_public_invitation(text);

create function public.get_public_invitation(p_token text)
returns table(
  guest_name text, party_size smallint, event_name text, celebrant_name text,
  event_date timestamptz, event_address text, event_description text,
  dress_code text, invitation_message text, invitation_theme jsonb,
  access_status text
)
language sql stable security definer set search_path = '' as $$
  select g.full_name, g.party_size, e.event_name, e.celebrant_name, e.event_date,
    e.event_address, e.event_description, e.dress_code, e.invitation_message,
    e.invitation_theme,
    case when g.is_revoked then 'revoked' when g.archived then 'used' else 'available' end
  from public.guests g join public.events e on e.id = g.event_id
  where g.invitation_token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and length(p_token) = 64 and e.status <> 'cancelled'
$$;

revoke execute on function public.create_event(text, text, timestamptz, text, text, text, jsonb, text) from public;
revoke execute on function public.get_public_invitation(text) from public;
grant execute on function public.create_event(text, text, timestamptz, text, text, text, jsonb, text) to authenticated;
grant execute on function public.get_public_invitation(text) to anon, authenticated;
grant update(dress_code) on public.events to authenticated;

commit;

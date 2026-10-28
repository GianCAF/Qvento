begin;

alter table public.guests
  add column party_size smallint not null default 1
  constraint guests_party_size_range check (party_size between 1 and 99);

drop function public.get_public_invitation(text);

create function public.get_public_invitation(p_token text)
returns table(
  guest_name text, party_size smallint, event_name text, celebrant_name text,
  event_date timestamptz, event_address text, event_description text,
  invitation_message text, invitation_theme jsonb, access_status text
)
language sql stable security definer set search_path = '' as $$
  select g.full_name, g.party_size, e.event_name, e.celebrant_name, e.event_date,
    e.event_address, e.event_description, e.invitation_message, e.invitation_theme,
    case when g.is_revoked then 'revoked' when g.archived then 'used' else 'available' end
  from public.guests g join public.events e on e.id = g.event_id
  where g.invitation_token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and length(p_token) = 64 and e.status <> 'cancelled'
$$;

revoke execute on function public.get_public_invitation(text) from public;
grant execute on function public.get_public_invitation(text) to anon, authenticated;
grant update(party_size) on public.guests to authenticated;

commit;

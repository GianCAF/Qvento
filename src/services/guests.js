import { requireSupabase, unwrap } from './supabase.js'

export async function listGuests(eventId) {
  return unwrap(await requireSupabase().from('guests').select('id, event_id, full_name, email, phone, archived, is_revoked, checked_in_at, checked_in_by, created_at').eq('event_id', eventId).order('created_at', { ascending: false }))
}

export async function createGuest(payload) {
  return unwrap(await requireSupabase().from('guests').insert(payload).select('id, event_id, full_name, email, phone, archived, is_revoked, created_at').single())
}

export async function createGuests(payloads) {
  return unwrap(await requireSupabase().from('guests').insert(payloads).select('id'))
}

export async function updateGuest(id, changes) {
  const safe = Object.fromEntries(Object.entries(changes).filter(([key]) => ['full_name', 'email', 'phone', 'is_revoked'].includes(key)))
  return unwrap(await requireSupabase().from('guests').update(safe).eq('id', id).select().single())
}

export async function issueInvitation(guestId) {
  const rows = unwrap(await requireSupabase().rpc('issue_guest_invitation', { p_guest_id: guestId }))
  return rows[0]
}

export async function getPublicInvitation(token) {
  const rows = unwrap(await requireSupabase().rpc('get_public_invitation', { p_token: token }))
  return rows[0] ?? null
}


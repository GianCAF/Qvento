import { requireSupabase, unwrap } from './supabase.js'

export async function prevalidate(eventId, token) {
  const rows = unwrap(await requireSupabase().rpc('prevalidate_invitation', { p_event_id: eventId, p_token: token }))
  return rows[0]
}

export async function confirmCheckIn(eventId, token) {
  const rows = unwrap(await requireSupabase().rpc('confirm_guest_check_in', { p_event_id: eventId, p_token: token }))
  return rows[0]
}


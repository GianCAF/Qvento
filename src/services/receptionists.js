import { requireSupabase, unwrap } from './supabase.js'

export async function listReceptionists() {
  return unwrap(await requireSupabase().from('profiles').select('id, full_name, is_active, created_at').eq('role', 'receptionist').order('full_name'))
}

export async function listAssignments() {
  return unwrap(await requireSupabase().from('event_receptionists').select('id, event_id, receptionist_id, created_at, events(event_name, event_date), profiles(full_name, is_active)').order('created_at', { ascending: false }))
}

export async function assignReceptionist(eventId, receptionistId) {
  return unwrap(await requireSupabase().from('event_receptionists').insert({ event_id: eventId, receptionist_id: receptionistId }).select().single())
}

export async function removeAssignment(id) {
  return unwrap(await requireSupabase().from('event_receptionists').delete().eq('id', id))
}


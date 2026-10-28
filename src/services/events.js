import { requireSupabase, unwrap } from './supabase.js'

const EVENT_FIELDS = 'id, admin_id, celebrant_name, event_name, event_date, event_address, event_description, dress_code, invitation_message, invitation_theme, status, created_at, updated_at'

export async function listEvents() {
  return unwrap(await requireSupabase().from('events').select(EVENT_FIELDS).order('event_date', { ascending: true }))
}

export async function getEvent(id) {
  return unwrap(await requireSupabase().from('events').select(EVENT_FIELDS).eq('id', id).single())
}

export async function createEvent(payload) {
  return unwrap(await requireSupabase().rpc('create_event', {
    p_celebrant_name: payload.celebrant_name, p_event_name: payload.event_name,
    p_event_date: payload.event_date, p_event_address: payload.event_address,
    p_event_description: payload.event_description, p_invitation_message: payload.invitation_message,
    p_invitation_theme: payload.invitation_theme, p_dress_code: payload.dress_code,
  }))
}

export async function updateEvent(id, changes) {
  return unwrap(await requireSupabase().from('events').update(changes).eq('id', id).select(EVENT_FIELDS).single())
}


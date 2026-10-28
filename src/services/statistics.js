import { requireSupabase, unwrap } from './supabase.js'

async function count(table, configure = (query) => query) {
  const result = await configure(requireSupabase().from(table).select('*', { count: 'exact', head: true }))
  if (result.error) throw new Error(result.error.message)
  return result.count ?? 0
}

export async function adminSummary() {
  const [events, guests, used, revoked] = await Promise.all([
    count('events'), count('guests'), count('guests', (q) => q.eq('archived', true)), count('guests', (q) => q.eq('is_revoked', true)),
  ])
  return { events, guests, used, revoked, available: Math.max(0, guests - used - revoked), attendance: guests ? Math.round((used / guests) * 100) : 0 }
}

export async function superadminSummary() {
  const now = new Date().toISOString()
  const [admins, activeAdmins, events, upcoming, guests, used] = await Promise.all([
    count('profiles', (q) => q.eq('role', 'admin')),
    count('profiles', (q) => q.eq('role', 'admin').eq('is_active', true)),
    count('events'), count('events', (q) => q.gte('event_date', now)), count('guests'), count('guests', (q) => q.eq('archived', true)),
  ])
  return { admins, activeAdmins, events, upcoming, guests, used }
}

export async function latestCheckIns(eventId) {
  let query = requireSupabase().from('check_in_logs').select('id, created_at, result, guests(full_name), profiles(full_name)').eq('result', 'authorized').order('created_at', { ascending: false }).limit(20)
  if (eventId) query = query.eq('event_id', eventId)
  return unwrap(await query)
}


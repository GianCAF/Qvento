import { requireSupabase, unwrap } from './supabase.js'

export async function listAdmins() {
  const result = unwrap(await requireSupabase().functions.invoke('manage-users', { body: { action: 'list', role: 'admin' } }))
  return result.users
}

export async function createManagedUser(payload) {
  return unwrap(await requireSupabase().functions.invoke('create-user', { body: payload }))
}

export async function setManagedUserActive(userId, isActive) {
  return unwrap(await requireSupabase().functions.invoke('manage-users', { body: { action: 'set_active', user_id: userId, is_active: isActive } }))
}


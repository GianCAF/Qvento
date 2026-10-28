import { requireSupabase, unwrap } from './supabase.js'

export async function signIn(email, password) {
  return unwrap(await requireSupabase().auth.signInWithPassword({ email, password }))
}

export async function signOut() { return unwrap(await requireSupabase().auth.signOut()) }
export async function getSession() { return (unwrap(await requireSupabase().auth.getSession())).session }

export async function getCurrentProfile() {
  const client = requireSupabase()
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) return null
  const profile = unwrap(await client.from('profiles').select('id, full_name, role, is_active, created_at').eq('id', user.id).single())
  return { ...profile, email: user.email }
}

export async function requestPasswordReset(email) {
  return unwrap(await requireSupabase().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/restablecer` }))
}

export async function updatePassword(password) {
  return unwrap(await requireSupabase().auth.updateUser({ password }))
}


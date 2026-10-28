import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers })
  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization) throw new Error('Sesión requerida.')
    const url = Deno.env.get('SUPABASE_URL')!
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
    const callerClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } })
    const { data: { user } } = await callerClient.auth.getUser()
    if (!user) throw new Error('Sesión inválida.')
    const { data: caller } = await admin.from('profiles').select('role, is_active').eq('id', user.id).single()
    if (!caller?.is_active) throw new Error('Cuenta inactiva.')
    const body = await request.json()
    if (body.action === 'list') {
      if (caller.role !== 'superadmin' || body.role !== 'admin') throw new Error('Sin autorización.')
      const { data: profiles, error } = await admin.from('profiles').select('id, full_name, role, is_active, created_at').eq('role', 'admin').order('created_at', { ascending: false })
      if (error) throw error
      const users = await Promise.all(profiles.map(async (profile) => {
        const { data } = await admin.auth.admin.getUserById(profile.id)
        return { ...profile, email: data.user?.email || null }
      }))
      return new Response(JSON.stringify({ users }), { headers })
    }
    if (body.action === 'set_active') {
      const { data: target } = await admin.from('profiles').select('role, created_by').eq('id', body.user_id).single()
      const allowed = caller.role === 'superadmin' || (caller.role === 'admin' && target?.role === 'receptionist' && target.created_by === user.id)
      if (!allowed) throw new Error('Sin autorización.')
      const { error } = await admin.from('profiles').update({ is_active: Boolean(body.is_active) }).eq('id', body.user_id)
      if (error) throw error
      return new Response(JSON.stringify({ updated: true }), { headers })
    }
    throw new Error('Acción no válida.')
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Error inesperado.' }), { status: 400, headers })
  }
})

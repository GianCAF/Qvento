import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers })
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) throw new Error('Sesión requerida.')
    const url = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const siteUrl = Deno.env.get('SITE_URL')
    if (!siteUrl) throw new Error('SITE_URL no está configurada en la función.')
    const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } })
    const { data: { user } } = await callerClient.auth.getUser()
    if (!user) throw new Error('Sesión inválida.')
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
    const { data: caller } = await admin.from('profiles').select('role, is_active').eq('id', user.id).single()
    if (!caller?.is_active) throw new Error('Cuenta inactiva.')
    const body = await request.json()
    const permitted = caller.role === 'superadmin'
      ? ['admin', 'receptionist'].includes(body.role)
      : caller.role === 'admin' && body.role === 'receptionist'
    if (!permitted) throw new Error('No tienes permisos para crear este tipo de cuenta.')
    if (typeof body.email !== 'string' || typeof body.full_name !== 'string') throw new Error('Datos incompletos.')
    const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(body.email.trim().toLowerCase(), {
      data: { full_name: body.full_name.trim(), role: body.role },
      redirectTo: `${siteUrl.replace(/\/$/, '')}/restablecer`,
    })
    if (error) throw error
    const { error: profileError } = await admin.from('profiles').insert({ id: invited.user.id, full_name: body.full_name.trim(), role: body.role, is_active: true, created_by: user.id })
    if (profileError) { await admin.auth.admin.deleteUser(invited.user.id); throw profileError }
    return new Response(JSON.stringify({ id: invited.user.id }), { status: 201, headers })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Error inesperado.' }), { status: 400, headers })
  }
})


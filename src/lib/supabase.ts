// Cliente único de Supabase. La sesión anónima la inicia M0 (Dev 3).
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && anonKey ? createClient(url, anonKey) : null

/** M0 · Sesión anónima ligada al celular. Reutiliza la sesión; sin Supabase configurado devuelve null. */
export async function asegurarSesion() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  if (data.session) return data.session
  const { data: nueva, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return nueva.session
}

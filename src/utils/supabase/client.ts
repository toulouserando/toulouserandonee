// src/utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // On récupère les variables d'environnement
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Ce client est spécialement conçu pour tourner dans le navigateur de l'utilisateur
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
import { createClient } from '@supabase/supabase-js'

// Ces variables doivent être définies dans ton fichier .env.local 
// ET sur le tableau de bord Vercel (Settings > Environment Variables)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Attention : Les variables d'environnement Supabase sont manquantes.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
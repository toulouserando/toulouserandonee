import { createClient } from '@supabase/supabase-js'

/**
 * 💡 STRATÉGIE ANTI-CRASH VERCEL :
 * Au moment du build, Vercel ne lit pas toujours les variables d'environnement.
 * En mettant une URL par défaut (placeholder), createClient ne renverra pas d'erreur fatale.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://votre-projet-indefini.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fake-anon-key-pour-le-build'

// Initialisation du client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Log utile pour débugger dans la console Vercel (uniquement au build)
if (typeof window === 'undefined') {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log("⚠️ [Build] NEXT_PUBLIC_SUPABASE_URL manquante. Utilisation du placeholder.");
  } else {
    console.log("✅ [Build] NEXT_PUBLIC_SUPABASE_URL détectée.");
  }
}
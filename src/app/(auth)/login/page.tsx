"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import SocialLoginButtons from "@/components/app/SocialLoginButtons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

// Import du client Supabase
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const [identite, setIdentite] = useState("") // Peut être l'email ou le pseudo
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      let emailToUse = identite

      // 1. Si l'identifiant ne ressemble pas à un email, on cherche l'email associé au pseudo
      if (!identite.includes("@")) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('identite', identite)
          .single()

        if (profileError || !profile) {
          throw new Error("Identifiant ou mot de passe incorrect.")
        }
        emailToUse = profile.email
      }

      // 2. Connexion avec l'email (qu'il soit saisi ou trouvé via le pseudo)
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: password,
      })

      if (authError) throw authError

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la connexion.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mx-auto max-w-sm w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Connexion</CardTitle>
        <CardDescription>
          Utilisez votre pseudo, votre email ou un compte social
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="identite">Identifiant ou Email</Label>
            <Input
              id="identite"
              type="text"
              placeholder="Pseudo ou email"
              required
              value={identite}
              onChange={(e) => setIdentite(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Mot de passe</Label>
              <Link href="/forgot-password" className="ml-auto inline-block text-sm underline">
                Oublié ?
              </Link>
            </div>
            <Input 
              id="password" 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Se connecter"}
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Ou continuer avec</span>
            </div>
          </div>

          <SocialLoginButtons />
        </form>

        <div className="mt-4 text-center text-sm">
          Pas de compte ? <Link href="/signup" className="underline">S'inscrire</Link>
        </div>
      </CardContent>
    </Card>
  )
}
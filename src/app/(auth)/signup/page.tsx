"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SocialLoginButtons from "@/components/app/SocialLoginButtons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

// On remplace Firebase par Supabase
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [identite, setIdentite] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [genre, setGenre] = useState<"femme" | "homme" | "autre" | undefined>();
  const [etudiant, setEtudiant] = useState(false);
  const [majeur, setMajeur] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!majeur) {
      setError("Vous devez certifier être majeur(e) pour vous inscrire.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            identite,
            genre,
            etudiant,
            majeur,
            role: 'randonneur', // On peut aussi le définir ici par défaut
          },
        },
      });

      if (signUpError) {
        // Traduction des erreurs courantes
        if (signUpError.message.includes("already registered")) {
          throw new Error("Cet email est déjà utilisé par un autre randonneur.");
        }
        if (signUpError.message.includes("Password should be")) {
          throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
        }
        throw signUpError;
      }

      // Cas 1 : Confirmation par email activée
      if (data.user && !data.session) {
        setError("Succès ! Un email de confirmation vous a été envoyé. Vérifiez votre boîte de réception.");
      } 
      // Cas 2 : Connexion automatique (si confirmation email désactivée)
      else if (data.session) {
        window.location.href = "/dashboard";
      }

    } catch (err: any) {
      setError(err.message || "Une erreur imprévue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-sm w-full">
      <CardHeader>
        <CardTitle className="text-xl">S'inscrire</CardTitle>
        <CardDescription>
          Créez votre compte pour rejoindre la communauté Toulouse rando
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {error && (
              <Alert variant={error.includes("réussie") ? "default" : "destructive"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{error.includes("réussie") ? "Succès" : "Erreur d'inscription"}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          <div className="grid gap-2">
            <Label htmlFor="identite">Pseudo (Identité)</Label>
            <Input 
              id="identite" 
              placeholder="RandoFan" 
              required 
              value={identite} 
              onChange={(e) => setIdentite(e.target.value)} 
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="genre">Genre</Label>
            <Select 
              onValueChange={(value: "femme" | "homme" | "autre") => setGenre(value)} 
              value={genre} 
              required
              disabled={loading}
            >
              <SelectTrigger id="genre">
                <SelectValue placeholder="Sélectionnez votre genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="femme">Femme</SelectItem>
                <SelectItem value="homme">Homme</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="etudiant" 
              checked={etudiant} 
              onCheckedChange={(checked) => setEtudiant(!!checked)} 
              disabled={loading}
            />
            <Label htmlFor="etudiant" className="text-sm font-medium leading-none">
              Je suis étudiant(e)
            </Label>
          </div>

           <div className="flex items-center space-x-2">
            <Checkbox 
              id="majeur" 
              checked={majeur} 
              onCheckedChange={(checked) => setMajeur(!!checked)} 
              disabled={loading}
            />
            <Label htmlFor="majeur" className="text-sm font-medium leading-none">
              Je certifie être majeur(e)
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Créer un compte"}
          </Button>

           <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Ou s'inscrire avec
              </span>
            </div>
          </div>
          <SocialLoginButtons />

        </form>
        <div className="mt-4 text-center text-sm">
          Vous avez déjà un compte ?{" "}
          <Link href="/login" className="underline">
            Se connecter
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
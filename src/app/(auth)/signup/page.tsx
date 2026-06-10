"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client"; // Adapte le chemin selon ton projet
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export default function ConnectPage() {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  // États pour l'inscription
  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    identite: "",
    genre: "Autre",
    isEtudiant: false,
    isMajeur: false,
  });

  // États pour la connexion
  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });

  // --- LOGIQUE INSCRIPTION ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Création de l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: signUpData.email,
      password: signUpData.password,
      options: {
        data: {
          identite: signUpData.identite,
          genre: signUpData.genre,
        },
      },
    });

    if (authError) {
      toast({ variant: "destructive", title: "Erreur", description: authError.message });
    } else {
      toast({ title: "Succès !", description: "Compte créé. Vérifiez vos emails si nécessaire." });
    }
    setLoading(false);
  };

  // --- LOGIQUE CONNEXION ---
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: signInData.email,
      password: signInData.password,
    });

    if (error) {
      toast({ variant: "destructive", title: "Échec", description: error.message });
    } else {
      toast({ title: "Connecté", description: "Direction le forum !" });
      router.push("/forum"); // Redirection après succès
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <h1 className="text-3xl font-bold text-center mb-8">Espace Membre Supabase</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* CARTE INSCRIPTION */}
        <Card>
          <CardHeader>
            <CardTitle>Créer un compte</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="s-identite">Nom d'utilisateur</Label>
                <Input id="s-identite" required onChange={(e) => setSignUpData({...signUpData, identite: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-email">Email</Label>
                <Input id="s-email" type="email" required onChange={(e) => setSignUpData({...signUpData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-password">Mot de passe</Label>
                <Input id="s-password" type="password" required onChange={(e) => setSignUpData({...signUpData, password: e.target.value})} />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="majeur" onCheckedChange={(val) => setSignUpData({...signUpData, isMajeur: !!val})} />
                <Label htmlFor="majeur">Je suis majeur</Label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Chargement..." : "S'inscrire en toute sécurité"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* CARTE CONNEXION */}
        <Card>
          <CardHeader>
            <CardTitle>Se connecter</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" type="email" required onChange={(e) => setSignInData({...signInData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Mot de passe</Label>
                <Input id="login-password" type="password" required onChange={(e) => setSignInData({...signInData, password: e.target.value})} />
              </div>
              <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
                Connexion
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
"use client";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
// J'utilise des icônes génériques, assure-toi d'avoir lucide-react ou tes propres icônes SVG
import { Globe } from "lucide-react"; 

export default function SocialLoginButtons() {
  
  const handleSocialLogin = async (provider: any) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          // Cette URL doit être configurée dans le dashboard Supabase et Google/Facebook console
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error(`Erreur de connexion avec ${provider}:`, error.message);
    }
  };

  const providers = [
    { id: 'google', name: 'Google' },
    { id: 'facebook', name: 'Facebook' },
    { id: 'apple', name: 'Apple' },
    { id: 'twitter', name: 'X' },
    { id: 'linkedin_oidc', name: 'LinkedIn' },
    { id: 'azure', name: 'Microsoft' },
    { id: 'spotify', name: 'Spotify' },
    { id: 'yahoo', name: 'Yahoo' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {providers.map((provider) => (
        <Button
          key={provider.id}
          variant="outline"
          type="button"
          className="w-full text-xs"
          onClick={() => handleSocialLogin(provider.id)}
        >
          <Globe className="mr-2 h-3 w-3" />
          {provider.name}
        </Button>
      ))}
    </div>
  );
}
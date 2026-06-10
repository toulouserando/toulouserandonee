"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // Ton client Supabase côté client
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewTopicPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  // Vérifier l'utilisateur au chargement
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        // Rediriger vers la connexion si pas d'utilisateur
        router.push("/login");
      } else {
        setUserId(user.id);
      }
    };
    checkUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      alert("Erreur : Utilisateur non identifié.");
      return;
    }

    setLoading(true);

    try {
      // Insertion dans la table forum_topics
      // Note : author_id doit correspondre à l'ID de l'utilisateur dans Supabase Auth
      const { data, error } = await supabase
        .from("forum_topics")
        .insert([
          { 
            title, 
            content, 
            author_id: userId, // Indispensable pour lier le sujet à un membre
            replies_count: 0,
            last_activity: new Date().toISOString() 
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Redirection vers le sujet créé
      router.push(`/forum/${data.id}`);
      router.refresh();
      
    } catch (error: any) {
      console.error("Erreur de création :", error);
      alert("Erreur lors de la création : " + (error.message || "Une erreur est survenue"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" asChild className="gap-2">
        <Link href="/forum">
          <ArrowLeft className="h-4 w-4" /> Retour au forum
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline text-primary">
            Créer un nouveau sujet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Titre</label>
              <Input 
                placeholder="De quoi voulez-vous discuter ?" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required 
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea 
                placeholder="Développez votre idée ici..." 
                className="min-h-[200px] resize-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required 
                disabled={loading}
              />
            </div>
            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading || !userId}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  "Publier le sujet"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
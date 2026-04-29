"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewTopicPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // On insère le nouveau sujet
    const { data, error } = await supabase
      .from("forum_topics")
      .insert([
        { 
          title, 
          content, 
          replies_count: 0,
          last_activity: new Date().toISOString() 
        }
      ])
      .select()
      .single();

    if (error) {
      alert("Erreur lors de la création : " + error.message);
      setLoading(false);
    } else {
      // Redirection vers le sujet tout juste créé
      router.push(`/forum/${data.id}`);
      router.refresh();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/forum" className="flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="mr-2 h-4 w-4" /> Retour au forum
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Créer un nouveau sujet</CardTitle>
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
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea 
                placeholder="Développez votre idée ici..." 
                className="min-h-[200px]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required 
              />
            </div>
            <div className="flex justify-end gap-4">
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Création..." : "Publier le sujet"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}